// backend/src/routes/gdpr.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const gdprService = require('../services/gdprService');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════
// DROITS D'ACCÈS (RGPD Art. 15)
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/gdpr/access
 * Droit d'accès - Obtenir toutes les données personnelles
 */
router.get('/access', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Log la demande d'accès
    await gdprService.logGDPRRequest(userId, 'access', req.ip);
    
    // Récupérer toutes les données
    const userData = await gdprService.getAllUserData(userId);
    
    res.json({
      success: true,
      requestId: crypto.randomUUID(),
      timestamp: new Date(),
      data: userData,
      message: 'Vos données personnelles ont été récupérées avec succès'
    });
    
  } catch (error) {
    console.error('[GDPR] Access error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de vos données'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// DROIT DE RECTIFICATION (RGPD Art. 16)
// ═══════════════════════════════════════════════════════════════════════

/**
 * PUT /api/gdpr/rectify
 * Droit de rectification - Corriger des données
 */
router.put('/rectify', 
  auth,
  [
    body('field').isString().isIn(['profile', 'preferences', 'healthData']),
    body('data').isObject()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.userId;
      const { field, data, reason } = req.body;
      
      // Log la demande
      await gdprService.logGDPRRequest(userId, 'rectification', req.ip, { field, reason });
      
      // Effectuer la rectification
      const result = await gdprService.rectifyUserData(userId, field, data);
      
      res.json({
        success: true,
        message: 'Données mises à jour avec succès',
        updated: result.updated,
        requestId: result.requestId
      });
      
    } catch (error) {
      console.error('[GDPR] Rectification error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour des données'
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════
// DROIT À L'EFFACEMENT (RGPD Art. 17)
// ═══════════════════════════════════════════════════════════════════════

/**
 * DELETE /api/gdpr/delete
 * Droit à l'effacement - Supprimer le compte et les données
 */
router.delete('/delete',
  auth,
  [
    body('password').isString().notEmpty(),
    body('confirmation').equals('DELETE_MY_ACCOUNT'),
    body('reason').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.userId;
      const { password, reason } = req.body;
      
      // Vérifier le mot de passe
      const isValidPassword = await gdprService.verifyUserPassword(userId, password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Mot de passe incorrect'
        });
      }
      
      // Log la demande
      await gdprService.logGDPRRequest(userId, 'deletion', req.ip, { reason });
      
      // Programmer la suppression (délai de 30 jours)
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);
      
      const result = await gdprService.scheduleAccountDeletion(userId, deletionDate, reason);
      
      res.json({
        success: true,
        message: 'Votre compte sera supprimé dans 30 jours',
        deletionDate: deletionDate,
        cancellationToken: result.cancellationToken,
        instructions: 'Vous pouvez annuler cette demande en vous reconnectant dans les 30 jours'
      });
      
    } catch (error) {
      console.error('[GDPR] Deletion error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la demande de suppression'
      });
    }
  }
);

/**
 * POST /api/gdpr/cancel-deletion
 * Annuler une demande de suppression
 */
router.post('/cancel-deletion',
  auth,
  [
    body('cancellationToken').isString().notEmpty()
  ],
  async (req, res) => {
    try {
      const userId = req.userId;
      const { cancellationToken } = req.body;
      
      const result = await gdprService.cancelAccountDeletion(userId, cancellationToken);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }
      
      res.json({
        success: true,
        message: 'Demande de suppression annulée avec succès'
      });
      
    } catch (error) {
      console.error('[GDPR] Cancel deletion error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'annulation'
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════
// DROIT À LA PORTABILITÉ (RGPD Art. 20)
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/gdpr/export
 * Droit à la portabilité - Exporter les données
 */
router.post('/export',
  auth,
  [
    body('format').isIn(['json', 'csv', 'pdf']).optional(),
    body('categories').isArray().optional()
  ],
  async (req, res) => {
    try {
      const userId = req.userId;
      const { format = 'json', categories = ['all'] } = req.body;
      
      // Vérifier les quotas d'export
      const quotaCheck = await req.app.locals.quotaService.checkAndConsumeQuota(userId, 'export');
      if (!quotaCheck.allowed) {
        return res.status(403).json({
          success: false,
          error: 'Quota d\'export épuisé',
          quotaInfo: quotaCheck
        });
      }
      
      // Log la demande
      await gdprService.logGDPRRequest(userId, 'export', req.ip, { format, categories });
      
      // Générer l'export
      const exportData = await gdprService.exportUserData(userId, format, categories);
      
      // Définir les headers selon le format
      const headers = {
        json: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="ecolojia-data.json"' },
        csv: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="ecolojia-data.csv"' },
        pdf: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="ecolojia-data.pdf"' }
      };
      
      res.set(headers[format]);
      res.send(exportData);
      
    } catch (error) {
      console.error('[GDPR] Export error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'export des données'
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════
// DROIT D'OPPOSITION (RGPD Art. 21)
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/gdpr/object
 * Droit d'opposition - S'opposer à certains traitements
 */
router.post('/object',
  auth,
  [
    body('processing').isArray().notEmpty(),
    body('reason').isString().optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.userId;
      const { processing, reason } = req.body;
      
      // Traitements valides
      const validProcessing = ['marketing', 'analytics', 'profiling', 'research'];
      const invalidProcessing = processing.filter(p => !validProcessing.includes(p));
      
      if (invalidProcessing.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Traitements invalides: ${invalidProcessing.join(', ')}`
        });
      }
      
      // Log la demande
      await gdprService.logGDPRRequest(userId, 'objection', req.ip, { processing, reason });
      
      // Appliquer l'opposition
      const result = await gdprService.applyObjection(userId, processing);
      
      res.json({
        success: true,
        message: 'Vos oppositions ont été enregistrées',
        applied: result.applied,
        refused: result.refused
      });
      
    } catch (error) {
      console.error('[GDPR] Objection error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'enregistrement de l\'opposition'
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════
// GESTION DU CONSENTEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/gdpr/consent
 * Obtenir l'état actuel des consentements
 */
router.get('/consent', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const consents = await gdprService.getUserConsents(userId);
    
    res.json({
      success: true,
      consents
    });
    
  } catch (error) {
    console.error('[GDPR] Get consent error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des consentements'
    });
  }
});

/**
 * PUT /api/gdpr/consent
 * Mettre à jour les consentements
 */
router.put('/consent',
  auth,
  [
    body('consents').isObject(),
    body('consents.analytics').isBoolean().optional(),
    body('consents.healthData').isBoolean().optional(),
    body('consents.marketing').isBoolean().optional()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.userId;
      const { consents } = req.body;
      
      // Log la modification
      await gdprService.logGDPRRequest(userId, 'consent_update', req.ip, { consents });
      
      // Mettre à jour les consentements
      const result = await gdprService.updateUserConsents(userId, consents);
      
      res.json({
        success: true,
        message: 'Consentements mis à jour',
        consents: result.consents,
        withdrawnProcessing: result.withdrawnProcessing
      });
      
    } catch (error) {
      console.error('[GDPR] Update consent error:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour des consentements'
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════
// HISTORIQUE DES DEMANDES RGPD
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/gdpr/history
 * Obtenir l'historique des demandes RGPD
 */
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const history = await gdprService.getGDPRRequestHistory(userId);
    
    res.json({
      success: true,
      history,
      count: history.length
    });
    
  } catch (error) {
    console.error('[GDPR] History error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// INFORMATIONS RGPD
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/gdpr/info
 * Obtenir les informations RGPD (DPO, durées de conservation, etc.)
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    info: {
      dpo: {
        email: 'privacy@ecolojia.app',
        address: 'ECOLOJIA SAS, 123 rue de la Santé, 75014 Paris, France'
      },
      retentionPeriods: {
        account: '3 ans après dernière connexion',
        analyses: '2 ans',
        healthData: '5 ans (obligation légale)',
        logs: '1 an',
        marketing: 'Jusqu\'au retrait du consentement'
      },
      rights: [
        'Droit d\'accès (Art. 15)',
        'Droit de rectification (Art. 16)',
        'Droit à l\'effacement (Art. 17)',
        'Droit à la limitation (Art. 18)',
        'Droit à la portabilité (Art. 20)',
        'Droit d\'opposition (Art. 21)',
        'Retrait du consentement (Art. 7)'
      ],
      legalBasis: {
        essential: 'Exécution du contrat',
        healthData: 'Consentement explicite',
        analytics: 'Intérêt légitime',
        marketing: 'Consentement'
      },
      authorities: {
        france: {
          name: 'CNIL',
          website: 'https://www.cnil.fr',
          address: '3 Place de Fontenoy, TSA 80715, 75334 PARIS CEDEX 07'
        }
      }
    }
  });
});

module.exports = router;