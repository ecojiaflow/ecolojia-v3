// backend/src/routes/gdpr.routes.js
// Routes GDPR - Version solo dev (Non production)
// ?? IMPORTANT: Avant production, remplacer infos DPO fictives par données réelles
// ?? TODO: Intégrer modèle Consent.js pour consentement explicite données santé (Art. 9)

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware');
const DataExportService = require('../services/gdpr/DataExportService');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * GET /api/gdpr/download-data
 * Telecharger toutes ses donnees (RGPD Art. 20 - Portabilite)
 */
router.get('/download-data/:format?', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const format = req.params.format || 'json';
    
    if (!['json', 'csv', 'pdf', 'all'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Format invalide. Utilisez: json, csv, pdf ou all'
      });
    }
    
    console.log(`[GDPR] Export demande par ${userId} au format ${format}`);
    
    // Verifier les quotas pour les utilisateurs gratuits
    if (req.user.tier === 'free' && format !== 'json') {
      return res.status(403).json({
        success: false,
        error: 'Export PDF/CSV reserve aux utilisateurs Premium',
        upgradeUrl: '/pricing'
      });
    }
    
    // Generer l'export
    const exportResult = await DataExportService.exportUserData(userId, format);
    
    // Si format 'all', retourner les URLs de telechargement
    if (format === 'all') {
      return res.json({
        success: true,
        exportId: exportResult.exportId,
        downloads: {
          json: `/api/gdpr/download/${exportResult.exportId}/json`,
          csv: `/api/gdpr/download/${exportResult.exportId}/csv`,
          pdf: `/api/gdpr/download/${exportResult.exportId}/pdf`,
          zip: `/api/gdpr/download/${exportResult.exportId}/zip`
        },
        expiresAt: exportResult.expiresAt
      });
    }
    
    // Pour un format unique, envoyer directement le fichier
    const file = exportResult.files[format];
    if (Array.isArray(file)) {
      // Format CSV avec plusieurs fichiers - creer un ZIP
      const zipFile = await DataExportService.createZipArchive(file, exportResult.exportId, new Date().toISOString());
      res.download(zipFile.filepath, zipFile.filename);
    } else {
      res.download(file.filepath, file.filename);
    }
    
  } catch (error) {
    console.error('[GDPR] Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export des donnees'
    });
  }
});

/**
 * GET /api/gdpr/download/:exportId/:format
 * Telecharger un export specifique
 */
router.get('/download/:exportId/:format', authenticateUser, async (req, res) => {
  try {
    const { exportId, format } = req.params;
    const exportPath = path.join(process.cwd(), 'exports');
    
    // Verifier que l'export appartient Â  l'utilisateur
    // TODO: Implementer la verification avec un modele ExportLog
    
    const filename = `ecolojia-export-${exportId}.${format}`;
    const filepath = path.join(exportPath, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Export non trouve ou expire'
      });
    }
    
    res.download(filepath, filename);
    
  } catch (error) {
    console.error('[GDPR] Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du telechargement'
    });
  }
});

/**
 * DELETE /api/gdpr/delete-account
 * Supprimer son compte (RGPD Art. 17 - Droit Â  l'oubli)
 */
router.delete('/delete-account', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { password, reason } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe requis pour confirmer la suppression'
      });
    }
    
    // Verifier le mot de passe
    const user = await User.findById(userId).select('+password');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect'
      });
    }
    
    console.log(`[GDPR] Demande de suppression du compte ${userId}, raison: ${reason}`);
    
    // Option 1: Suppression immediate
    // TODO CRITIQUE: Implémenter deleteAllUserData() complète
    // Doit supprimer: User, Analysis, ChatHistory, Favorite, Payment, 
    // VisionAnalysis, UserJourney, et toute trace dans logs
    // const result = await DataExportService.deleteAllUserData(userId);
    
    // Option 2: Suppression differee (30 jours)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    
    user.accountDeletion = {
      requested: true,
      requestDate: new Date(),
      scheduledDate: deletionDate,
      reason,
      cancellationToken: crypto.randomBytes(32).toString('hex')
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Votre compte sera supprime dans 30 jours',
      deletionDate,
      cancellationToken: user.accountDeletion.cancellationToken,
      note: 'Vous pouvez annuler cette demande en vous reconnectant dans les 30 jours'
    });
    
  } catch (error) {
    console.error('[GDPR] Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du compte'
    });
  }
});

/**
 * POST /api/gdpr/cancel-deletion
 * Annuler une demande de suppression
 */
router.post('/cancel-deletion', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { cancellationToken } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user.accountDeletion?.requested) {
      return res.status(400).json({
        success: false,
        error: 'Aucune demande de suppression en cours'
      });
    }
    
    if (user.accountDeletion.cancellationToken !== cancellationToken) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'annulation invalide'
      });
    }
    
    // Annuler la suppression
    user.accountDeletion = undefined;
    await user.save();
    
    console.log(`[GDPR] Suppression annulee pour ${userId}`);
    
    res.json({
      success: true,
      message: 'Demande de suppression annulee avec succes'
    });
    
  } catch (error) {
    console.error('[GDPR] Cancel deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'annulation'
    });
  }
});

/**
 * PUT /api/gdpr/update-consent
 * Mettre Â  jour les consentements
 */
router.put('/update-consent', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { consents } = req.body;
    
    const validConsents = ['marketing', 'analytics', 'personalizedAds', 'dataSharing'];
    const invalidConsents = Object.keys(consents).filter(c => !validConsents.includes(c));
    
    if (invalidConsents.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Consentements invalides: ${invalidConsents.join(', ')}`
      });
    }
    
    const user = await User.findById(userId);
    
    // Mettre Â  jour les consentements
    user.privacy = user.privacy || {};
    user.privacy.consents = {
      ...user.privacy.consents,
      ...consents,
      lastUpdated: new Date()
    };
    
    await user.save();
    
    console.log(`[GDPR] Consentements mis Â  jour pour ${userId}:`, consents);
    
    res.json({
      success: true,
      message: 'Consentements mis Â  jour',
      consents: user.privacy.consents
    });
    
  } catch (error) {
    console.error('[GDPR] Update consent error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise Â  jour des consentements'
    });
  }
});

/**
 * GET /api/gdpr/privacy-settings
 * Obtenir les parametres de confidentialite
 */
router.get('/privacy-settings', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const privacySettings = {
      consents: user.privacy?.consents || {
        marketing: false,
        analytics: true,
        personalizedAds: false,
        dataSharing: false
      },
      dataRetention: {
        analyses: '2 ans',
        personalData: 'Jusqu\'Â  suppression du compte',
        logs: '1 an'
      },
      rights: [
        {
          name: 'Acces',
          description: 'Consulter toutes vos donnees',
          action: '/api/gdpr/download-data'
        },
        {
          name: 'Rectification',
          description: 'Corriger vos donnees',
          action: '/profile/edit'
        },
        {
          name: 'Effacement',
          description: 'Supprimer votre compte',
          action: '/api/gdpr/delete-account'
        },
        {
          name: 'Portabilite',
          description: 'Exporter vos donnees',
          action: '/api/gdpr/download-data'
        },
        {
          name: 'Opposition',
          description: 'Vous opposer Â  certains traitements',
          action: '/api/gdpr/update-consent'
        }
      ],
      deletionRequested: !!user.accountDeletion?.requested,
      deletionDate: user.accountDeletion?.scheduledDate
    };
    
    res.json({
      success: true,
      privacySettings
    });
    
  } catch (error) {
    console.error('[GDPR] Get privacy settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation des parametres'
    });
  }
});

/**
 * POST /api/gdpr/data-breach-notification
 * Notification en cas de violation de donnees (pour les admins)
 */
router.post('/data-breach-notification', authenticateUser, async (req, res) => {
  try {
    // Verifier que l'utilisateur est admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acces non autorise'
      });
    }
    
    const { affectedUsers, breachType, description, discoveredAt } = req.body;
    
    // TODO: Implementer la notification des utilisateurs affectes
    // - Envoyer des emails
    // - Logger l'incident
    // - Notifier la CNIL sous 72h
    
    console.log('[GDPR] Data breach notification:', {
      affectedUsers: affectedUsers.length,
      breachType,
      discoveredAt
    });
    
    res.json({
      success: true,
      message: 'Notification de violation enregistree',
      actionsRequired: [
        'Notifier la CNIL sous 72h',
        'Informer les utilisateurs concernes',
        'Documenter les mesures prises'
      ]
    });
    
  } catch (error) {
    console.error('[GDPR] Data breach notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la notification'
    });
  }
});

/**
 * GET /api/gdpr/info
 * Informations RGPD publiques
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    info: {
      dataController: {
        name: 'ECOLOJIA (Projet Solo)',
        address: 'À définir - Développement en cours',
        email: 'privacy@ecolojia.app',
        phone: 'À définir'
      },
      dataProtectionOfficer: {
        name: 'Claude (Assistant IA - DPO Temporaire)',
        email: 'dpo@ecolojia.app',
        note: 'Pour production : désigner un DPO humain certifié RGPD',
        phone: 'À définir'
      },
      legalBasis: {
        account: 'Execution du contrat',
        healthData: 'Consentement explicite (RGPD Art. 9)',
        marketing: 'Consentement',
        analytics: 'Interet legitime'
      },
      dataRetention: {
        activeAccount: 'Duree de vie du compte + 3 ans',
        inactiveAccount: '3 ans apres derniere connexion',
        analyses: '2 ans',
        logs: '1 an',
        financialRecords: '10 ans (obligation legale)'
      },
      thirdParties: [
        {
          name: 'MongoDB Atlas',
          purpose: 'Hebergement des donnees',
          location: 'UE (Irlande)'
        },
        {
          name: 'Cloudinary',
          purpose: 'Stockage des images',
          location: 'UE'
        },
        {
          name: 'LemonSqueezy',
          purpose: 'Traitement des paiements',
          location: 'USA (Privacy Shield)'
        }
      ],
      rights: {
        access: 'Obtenir une copie de vos donnees',
        rectification: 'Corriger des donnees inexactes',
        erasure: 'Supprimer votre compte et vos donnees',
        restriction: 'Limiter le traitement de vos donnees',
        portability: 'Recevoir vos donnees dans un format structure',
        objection: 'Vous opposer Â  certains traitements',
        automatedDecision: 'Ne pas faire l\'objet de decisions automatisees'
      },
      complaints: {
        authority: 'CNIL',
        website: 'https://www.cnil.fr',
        address: '3 Place de Fontenoy - TSA 80715 - 75334 PARIS CEDEX 07',
        phone: '+33 1 53 73 22 22'
      },
      lastUpdated: '2024-01-01'
    }
  });
});

/**
 * GET /api/gdpr/processing-activities
 * Registre des activites de traitement (pour conformite)
 */
router.get('/processing-activities', authenticateUser, async (req, res) => {
  try {
    // Verifier que l'utilisateur est admin ou DPO
    if (!req.user.isAdmin && !req.user.isDPO) {
      return res.status(403).json({
        success: false,
        error: 'Acces reserve aux administrateurs et DPO'
      });
    }
    
    const activities = [
      {
        name: 'Gestion des comptes utilisateurs',
        purpose: 'Permettre l\'acces et l\'utilisation du service',
        legalBasis: 'Execution du contrat',
        dataCategories: ['Identite', 'Contact', 'Connexion'],
        recipients: ['â€°quipe support', 'Hebergeur'],
        retention: '3 ans apres fermeture',
        security: ['Chiffrement', 'Acces restreint', 'Logs']
      },
      {
        name: 'Analyses de produits',
        purpose: 'Fournir le service d\'analyse nutritionnelle',
        legalBasis: 'Execution du contrat',
        dataCategories: ['Produits scannes', 'Preferences alimentaires'],
        recipients: ['Algorithmes d\'analyse'],
        retention: '2 ans',
        security: ['Anonymisation', 'Chiffrement']
      },
      {
        name: 'Communications marketing',
        purpose: 'Informer des nouveautes et offres',
        legalBasis: 'Consentement',
        dataCategories: ['Email', 'Preferences'],
        recipients: ['Service marketing', 'Outil emailing'],
        retention: 'Jusqu\'au retrait du consentement',
        security: ['Double opt-in', 'Desinscription facile']
      }
    ];
    
    res.json({
      success: true,
      activities,
      lastUpdated: new Date('2024-01-01'),
      nextReview: new Date('2025-01-01')
    });
    
  } catch (error) {
    console.error('[GDPR] Get processing activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation du registre'
    });
  }
});

module.exports = router;
