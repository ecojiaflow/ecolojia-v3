// backend/src/services/gdprService.js
const User = require('../models/User');
const Product = require('../models/Product');
const Analysis = require('../models/Analysis');
const GDPRLog = require('../models/GDPRLog');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

class GDPRService {
  // ═══════════════════════════════════════════════════════════════════════
  // LOGGING DES DEMANDES RGPD
  // ═══════════════════════════════════════════════════════════════════════

  async logGDPRRequest(userId, requestType, ip, details = {}) {
    try {
      await GDPRLog.create({
        userId,
        requestType,
        ip: this.hashIP(ip),
        details,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[GDPR] Error logging request:', error);
    }
  }

  hashIP(ip) {
    // Hash l'IP pour la confidentialité tout en gardant une trace
    return crypto.createHash('sha256').update(ip + process.env.IP_SALT).digest('hex').substring(0, 16);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DROIT D'ACCÈS
  // ═══════════════════════════════════════════════════════════════════════

  async getAllUserData(userId) {
    const user = await User.findById(userId).select('-passwordHash').lean();
    if (!user) throw new Error('Utilisateur non trouvé');

    // Récupérer toutes les données liées
    const [analyses, gdprLogs] = await Promise.all([
      Analysis.find({ userId }).lean(),
      GDPRLog.find({ userId }).lean()
    ]);

    // Structurer les données
    return {
      profile: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        ...user.profile
      },
      preferences: user.preferences,
      subscription: {
        tier: user.subscription?.tier,
        status: user.subscription?.status,
        expiresAt: user.subscription?.currentPeriodEnd
      },
      healthData: {
        allergies: user.preferences?.allergies || [],
        diets: user.preferences?.diets || [],
        conditions: user.preferences?.healthConditions || []
      },
      activity: {
        totalAnalyses: analyses.length,
        lastActivity: user.metadata?.lastActivityAt,
        loginCount: user.metadata?.loginCount
      },
      analyses: analyses.map(a => ({
        id: a._id,
        date: a.timestamp,
        productName: a.input?.name,
        category: a.results?.category,
        scores: a.results?.scores
      })),
      gdprHistory: gdprLogs.map(log => ({
        date: log.timestamp,
        type: log.requestType,
        details: log.details
      }))
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DROIT DE RECTIFICATION
  // ═══════════════════════════════════════════════════════════════════════

  async rectifyUserData(userId, field, data) {
    const allowedFields = {
      profile: ['firstName', 'lastName', 'phoneNumber', 'bio'],
      preferences: ['language', 'theme', 'timezone', 'currency'],
      healthData: ['allergies', 'diets', 'healthConditions']
    };

    if (!allowedFields[field]) {
      throw new Error('Champ non modifiable');
    }

    const updatePath = field === 'healthData' ? `preferences.${Object.keys(data)[0]}` : field;
    const updateData = {};

    // Valider et nettoyer les données
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields[field].includes(key)) {
        updateData[`${updatePath}.${key}`] = value;
      }
    }

    await User.findByIdAndUpdate(userId, { $set: updateData });

    return {
      updated: Object.keys(updateData),
      requestId: crypto.randomUUID()
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DROIT À L'EFFACEMENT
  // ═══════════════════════════════════════════════════════════════════════

  async verifyUserPassword(userId, password) {
    const user = await User.findById(userId).select('passwordHash');
    if (!user) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async scheduleAccountDeletion(userId, deletionDate, reason) {
    const cancellationToken = crypto.randomBytes(32).toString('hex');

    await User.findByIdAndUpdate(userId, {
      $set: {
        'gdpr.deletionRequested': true,
        'gdpr.deletionRequestedDate': new Date(),
        'gdpr.deletionScheduledDate': deletionDate,
        'gdpr.deletionReason': reason,
        'gdpr.cancellationToken': cancellationToken
      }
    });

    // Désactiver immédiatement le compte
    await User.findByIdAndUpdate(userId, {
      $set: { 'status': 'pending_deletion' }
    });

    return { cancellationToken };
  }

  async cancelAccountDeletion(userId, cancellationToken) {
    const user = await User.findById(userId);
    
    if (!user?.gdpr?.deletionRequested) {
      return { success: false, error: 'Aucune demande de suppression en cours' };
    }

    if (user.gdpr.cancellationToken !== cancellationToken) {
      return { success: false, error: 'Token invalide' };
    }

    await User.findByIdAndUpdate(userId, {
      $unset: {
        'gdpr.deletionRequested': '',
        'gdpr.deletionRequestedDate': '',
        'gdpr.deletionScheduledDate': '',
        'gdpr.deletionReason': '',
        'gdpr.cancellationToken': ''
      },
      $set: { 'status': 'active' }
    });

    return { success: true };
  }

  async executeScheduledDeletions() {
    // À exécuter via cron job quotidien
    const usersToDelete = await User.find({
      'gdpr.deletionRequested': true,
      'gdpr.deletionScheduledDate': { $lte: new Date() }
    });

    for (const user of usersToDelete) {
      await this.permanentlyDeleteUser(user._id);
    }

    return usersToDelete.length;
  }

  async permanentlyDeleteUser(userId) {
    // Anonymiser les analyses (garder pour statistiques)
    await Analysis.updateMany(
      { userId },
      { 
        $set: { userId: null, anonymized: true },
        $unset: { userContext: '' }
      }
    );

    // Supprimer les logs GDPR après export
    const gdprLogs = await GDPRLog.find({ userId });
    if (gdprLogs.length > 0) {
      // Archiver avant suppression
      await this.archiveGDPRLogs(userId, gdprLogs);
      await GDPRLog.deleteMany({ userId });
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId);

    console.log(`[GDPR] User ${userId} permanently deleted`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DROIT À LA PORTABILITÉ
  // ═══════════════════════════════════════════════════════════════════════

  async exportUserData(userId, format, categories) {
    const userData = await this.getAllUserData(userId);
    
    // Filtrer par catégories si nécessaire
    let exportData = userData;
    if (!categories.includes('all')) {
      exportData = {};
      for (const category of categories) {
        if (userData[category]) {
          exportData[category] = userData[category];
        }
      }
    }

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
        
      case 'csv':
        return this.convertToCSV(exportData);
        
      case 'pdf':
        return this.generatePDF(exportData);
        
      default:
        throw new Error('Format non supporté');
    }
  }

  convertToCSV(data) {
    const flatData = this.flattenObject(data);
    const parser = new Parser({ fields: Object.keys(flatData) });
    return parser.parse([flatData]);
  }

  flattenObject(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        flattened[newKey] = value.join('; ');
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  }

  async generatePDF(data) {
    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    // Header
    doc.fontSize(20).text('ECOLOJIA - Export de données personnelles', 50, 50);
    doc.fontSize(10).text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 50, 80);
    
    // Contenu
    let y = 120;
    for (const [section, content] of Object.entries(data)) {
      doc.fontSize(14).text(section.toUpperCase(), 50, y);
      y += 25;
      
      doc.fontSize(10);
      const text = JSON.stringify(content, null, 2);
      doc.text(text, 70, y, { width: 450 });
      y += (text.split('\n').length * 12) + 20;
      
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    }
    
    doc.end();
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DROIT D'OPPOSITION
  // ═══════════════════════════════════════════════════════════════════════

  async applyObjection(userId, processingTypes) {
    const objections = {};
    const applied = [];
    const refused = [];

    for (const type of processingTypes) {
      switch (type) {
        case 'marketing':
          objections['preferences.notifications.marketing'] = false;
          objections['gdpr.marketingConsent'] = false;
          applied.push(type);
          break;
          
        case 'analytics':
          objections['gdpr.analyticsConsent'] = false;
          applied.push(type);
          break;
          
        case 'profiling':
          objections['gdpr.profilingConsent'] = false;
          applied.push(type);
          break;
          
        case 'research':
          objections['gdpr.researchConsent'] = false;
          applied.push(type);
          break;
          
        default:
          refused.push(type);
      }
    }

    if (Object.keys(objections).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: objections });
    }

    return { applied, refused };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GESTION DU CONSENTEMENT
  // ═══════════════════════════════════════════════════════════════════════

  async getUserConsents(userId) {
    const user = await User.findById(userId).select('gdpr preferences');
    
    return {
      essential: true, // Toujours true
      analytics: user.gdpr?.analyticsConsent || false,
      healthData: user.gdpr?.dataProcessingConsent || false,
      marketing: user.gdpr?.marketingConsent || false,
      version: user.gdpr?.consentVersion || '1.0',
      date: user.gdpr?.consentDate
    };
  }

  async updateUserConsents(userId, consents) {
    const updates = {};
    const withdrawnProcessing = [];

    // Mapper les consentements
    if (consents.analytics !== undefined) {
      updates['gdpr.analyticsConsent'] = consents.analytics;
      if (!consents.analytics) withdrawnProcessing.push('analytics');
    }
    
    if (consents.healthData !== undefined) {
      updates['gdpr.dataProcessingConsent'] = consents.healthData;
      if (!consents.healthData) withdrawnProcessing.push('healthData');
    }
    
    if (consents.marketing !== undefined) {
      updates['gdpr.marketingConsent'] = consents.marketing;
      updates['preferences.notifications.marketing'] = consents.marketing;
      if (!consents.marketing) withdrawnProcessing.push('marketing');
    }

    updates['gdpr.consentDate'] = new Date();
    updates['gdpr.consentVersion'] = '2.0';

    await User.findByIdAndUpdate(userId, { $set: updates });

    return {
      consents: await this.getUserConsents(userId),
      withdrawnProcessing
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HISTORIQUE ET ARCHIVAGE
  // ═══════════════════════════════════════════════════════════════════════

  async getGDPRRequestHistory(userId) {
    return GDPRLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .select('-ip')
      .lean();
  }

  async archiveGDPRLogs(userId, logs) {
    // Archiver dans un système de stockage à long terme
    // (S3, système de fichiers, etc.)
    const archiveData = {
      userId,
      archivedAt: new Date(),
      logs: logs.map(log => ({
        ...log.toObject(),
        ip: undefined // Supprimer l'IP même hashée
      }))
    };

    // TODO: Implémenter l'archivage réel
    console.log(`[GDPR] Archived ${logs.length} logs for user ${userId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONFORMITÉ ET MAINTENANCE
  // ═══════════════════════════════════════════════════════════════════════

  async enforceRetentionPolicies() {
    // À exécuter via cron job mensuel
    const now = new Date();
    
    // Supprimer les analyses de plus de 2 ans
    const twoYearsAgo = new Date(now.setFullYear(now.getFullYear() - 2));
    await Analysis.deleteMany({
      timestamp: { $lt: twoYearsAgo },
      anonymized: { $ne: true }
    });

    // Supprimer les logs GDPR de plus d'un an
    const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
    await GDPRLog.deleteMany({
      timestamp: { $lt: oneYearAgo }
    });

    // Anonymiser les comptes inactifs depuis 3 ans
    const threeYearsAgo = new Date(now.setFullYear(now.getFullYear() - 3));
    const inactiveUsers = await User.find({
      'metadata.lastActivityAt': { $lt: threeYearsAgo },
      'status': { $ne: 'deleted' }
    });

    for (const user of inactiveUsers) {
      await this.anonymizeUser(user._id);
    }

    console.log(`[GDPR] Retention policies enforced - ${inactiveUsers.length} users anonymized`);
  }

  async anonymizeUser(userId) {
    await User.findByIdAndUpdate(userId, {
      $set: {
        email: `deleted_${userId}@anonymous.local`,
        'profile.firstName': 'Anonyme',
        'profile.lastName': 'Anonyme',
        'profile.phoneNumber': null,
        'status': 'anonymized'
      },
      $unset: {
        'profile.avatarUrl': '',
        'profile.bio': '',
        'metadata.lastIP': '',
        'metadata.referralCode': ''
      }
    });
  }
}

module.exports = new GDPRService();