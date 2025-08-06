// backend/src/services/gdpr/DataExportService.js
// Service d'export des données personnelles (RGPD compliant)

const PDFDocument = require('pdfkit');
const json2csv = require('json2csv').Parser;
const User = require('../../models/User');
const Product = require('../../models/Product');
const Analysis = require('../../models/Analysis');
const Payment = require('../../models/Payment');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');

class DataExportService {
  constructor() {
    this.exportPath = path.join(process.cwd(), 'exports');
    this.ensureExportDirectory();
  }

  /**
   * Crée le répertoire d'export s'il n'existe pas
   */
  async ensureExportDirectory() {
    try {
      await fs.mkdir(this.exportPath, { recursive: true });
    } catch (error) {
      console.error('Erreur création dossier exports:', error);
    }
  }

  /**
   * Export complet des données utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} format - Format d'export ('json', 'csv', 'pdf', 'all')
   * @returns {Promise<Object>} Chemin du fichier et infos d'export
   */
  async exportUserData(userId, format = 'json') {
    try {
      console.log(`📦 Export des données pour l'utilisateur ${userId} en format ${format}`);

      // Récupérer toutes les données
      const userData = await this.collectUserData(userId);
      
      if (!userData.user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Générer un ID unique pour cet export
      const exportId = crypto.randomBytes(16).toString('hex');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      let exportResults = {};

      // Exporter selon le format demandé
      switch (format.toLowerCase()) {
        case 'json':
          exportResults.json = await this.exportAsJSON(userData, exportId, timestamp);
          break;
          
        case 'csv':
          exportResults.csv = await this.exportAsCSV(userData, exportId, timestamp);
          break;
          
        case 'pdf':
          exportResults.pdf = await this.exportAsPDF(userData, exportId, timestamp);
          break;
          
        case 'all':
          // Export dans tous les formats
          exportResults.json = await this.exportAsJSON(userData, exportId, timestamp);
          exportResults.csv = await this.exportAsCSV(userData, exportId, timestamp);
          exportResults.pdf = await this.exportAsPDF(userData, exportId, timestamp);
          
          // Créer une archive ZIP
          exportResults.zip = await this.createZipArchive(
            Object.values(exportResults),
            exportId,
            timestamp
          );
          break;
          
        default:
          throw new Error(`Format non supporté: ${format}`);
      }

      // Enregistrer l'export dans l'historique
      await this.logExport(userId, exportId, format, exportResults);

      return {
        success: true,
        exportId,
        format,
        files: exportResults,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        message: 'Export généré avec succès. Les fichiers seront supprimés dans 24h.'
      };

    } catch (error) {
      console.error('❌ Erreur export données:', error);
      throw error;
    }
  }

  /**
   * Collecte toutes les données d'un utilisateur
   */
  async collectUserData(userId) {
    console.log('📊 Collecte des données...');

    // Données utilisateur
    const user = await User.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      return { user: null };
    }

    // Analyses de produits
    const analyses = await Analysis.find({ userId })
      .populate('productId', 'name brand barcode category imageUrl')
      .sort({ createdAt: -1 });

    // Produits scannés (sans analyse)
    const productIds = [...new Set(analyses.map(a => a.productId?._id).filter(id => id))];
    const products = await Product.find({ _id: { $in: productIds } });

    // Historique des paiements
    const payments = await Payment.find({ userId })
      .select('-metadata.card_number')
      .sort({ createdAt: -1 });

    // Statistiques d'utilisation
    const stats = await this.calculateUserStats(userId, analyses);

    return {
      user: this.sanitizeUserData(user.toObject()),
      analyses: analyses.map(a => this.sanitizeAnalysis(a.toObject())),
      products: products.map(p => this.sanitizeProduct(p.toObject())),
      payments: payments.map(p => this.sanitizePayment(p.toObject())),
      stats,
      exportDate: new Date().toISOString(),
      dataRetentionPolicy: {
        analyses: '2 ans',
        personalData: 'Jusqu\'à suppression du compte',
        payments: '10 ans (obligations légales)'
      }
    };
  }

  /**
   * Export au format JSON
   */
  async exportAsJSON(data, exportId, timestamp) {
    const filename = `ecolojia-export-${timestamp}.json`;
    const filepath = path.join(this.exportPath, filename);

    const jsonContent = JSON.stringify(data, null, 2);
    await fs.writeFile(filepath, jsonContent, 'utf8');

    return {
      filename,
      filepath,
      size: Buffer.byteLength(jsonContent),
      mimetype: 'application/json'
    };
  }

  /**
   * Export au format CSV
   */
  async exportAsCSV(data, exportId, timestamp) {
    const files = [];

    // 1. Informations utilisateur
    const userCsv = new json2csv({
      fields: ['email', 'firstName', 'lastName', 'tier', 'createdAt', 'lastLogin']
    });
    const userFilename = `ecolojia-user-${timestamp}.csv`;
    const userFilepath = path.join(this.exportPath, userFilename);
    await fs.writeFile(userFilepath, userCsv.parse([data.user]), 'utf8');
    files.push({
      filename: userFilename,
      filepath: userFilepath,
      type: 'user'
    });

    // 2. Analyses de produits
    if (data.analyses.length > 0) {
      const analysesCsv = new json2csv({
        fields: [
          'date',
          'productName',
          'productBrand',
          'productBarcode',
          'category',
          'method',
          'healthScore',
          'novaGroup',
          'nutriScore',
          'ecoScore',
          'concerns'
        ]
      });

      const analysesData = data.analyses.map(a => ({
        date: new Date(a.createdAt).toLocaleDateString('fr-FR'),
        productName: a.productId?.name || 'Produit inconnu',
        productBrand: a.productId?.brand || '',
        productBarcode: a.productId?.barcode || '',
        category: a.results?.category || '',
        method: a.method,
        healthScore: a.results?.scores?.health || '',
        novaGroup: a.results?.scores?.nova || '',
        nutriScore: a.results?.scores?.nutriscore || '',
        ecoScore: a.results?.scores?.ecoscore || '',
        concerns: a.results?.details?.concerns?.length || 0
      }));

      const analysesFilename = `ecolojia-analyses-${timestamp}.csv`;
      const analysesFilepath = path.join(this.exportPath, analysesFilename);
      await fs.writeFile(analysesFilepath, analysesCsv.parse(analysesData), 'utf8');
      files.push({
        filename: analysesFilename,
        filepath: analysesFilepath,
        type: 'analyses'
      });
    }

    // 3. Historique des paiements
    if (data.payments.length > 0) {
      const paymentsCsv = new json2csv({
        fields: ['date', 'amount', 'currency', 'status', 'type', 'invoiceUrl']
      });

      const paymentsData = data.payments.map(p => ({
        date: new Date(p.createdAt).toLocaleDateString('fr-FR'),
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        type: p.type,
        invoiceUrl: p.invoiceUrl || ''
      }));

      const paymentsFilename = `ecolojia-payments-${timestamp}.csv`;
      const paymentsFilepath = path.join(this.exportPath, paymentsFilename);
      await fs.writeFile(paymentsFilepath, paymentsCsv.parse(paymentsData), 'utf8');
      files.push({
        filename: paymentsFilename,
        filepath: paymentsFilepath,
        type: 'payments'
      });
    }

    return files;
  }

  /**
   * Export au format PDF
   */
  async exportAsPDF(data, exportId, timestamp) {
    const filename = `ecolojia-export-${timestamp}.pdf`;
    const filepath = path.join(this.exportPath, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Export de données ECOLOJIA',
          Author: 'ECOLOJIA',
          Subject: 'Export RGPD',
          CreationDate: new Date()
        }
      });

      const stream = doc.pipe(fs.createWriteStream(filepath));

      // En-tête avec logo
      this.addPDFHeader(doc);

      // Page 1: Informations personnelles
      this.addPersonalInfoSection(doc, data.user);
      
      // Page 2: Statistiques d'utilisation
      doc.addPage();
      this.addStatsSection(doc, data.stats);

      // Page 3+: Historique des analyses
      doc.addPage();
      this.addAnalysesSection(doc, data.analyses);

      // Page finale: Historique des paiements
      if (data.payments.length > 0) {
        doc.addPage();
        this.addPaymentsSection(doc, data.payments);
      }

      // Footer sur chaque page
      this.addPDFFooter(doc, data.exportDate);

      doc.end();

      stream.on('finish', () => {
        resolve({
          filename,
          filepath,
          mimetype: 'application/pdf'
        });
      });

      stream.on('error', reject);
    });
  }

  /**
   * Ajoute l'en-tête du PDF
   */
  addPDFHeader(doc) {
    // Titre principal
    doc.fontSize(24)
       .fillColor('#10B981')
       .text('ECOLOJIA', 50, 50);
    
    doc.fontSize(16)
       .fillColor('#374151')
       .text('Export de vos données personnelles', 50, 80);
    
    doc.moveDown(2);
    
    // Ligne de séparation
    doc.moveTo(50, 120)
       .lineTo(545, 120)
       .stroke('#E5E7EB');
  }

  /**
   * Ajoute la section informations personnelles
   */
  addPersonalInfoSection(doc, user) {
    doc.fontSize(18)
       .fillColor('#111827')
       .text('1. Vos informations personnelles', 50, 150);
    
    doc.fontSize(12)
       .fillColor('#4B5563');

    const infoY = 190;
    const lineHeight = 25;
    
    doc.text(`Nom : ${user.firstName} ${user.lastName}`, 50, infoY);
    doc.text(`Email : ${user.email}`, 50, infoY + lineHeight);
    doc.text(`Statut : ${user.tier === 'premium' ? 'Premium' : 'Gratuit'}`, 50, infoY + lineHeight * 2);
    doc.text(`Membre depuis : ${new Date(user.createdAt).toLocaleDateString('fr-FR')}`, 50, infoY + lineHeight * 3);
    
    if (user.preferences) {
      doc.text('Préférences alimentaires :', 50, infoY + lineHeight * 5);
      doc.fontSize(10);
      
      if (user.preferences.diet) {
        doc.text(`- Régime : ${user.preferences.diet}`, 70, infoY + lineHeight * 6);
      }
      if (user.preferences.allergies?.length > 0) {
        doc.text(`- Allergies : ${user.preferences.allergies.join(', ')}`, 70, infoY + lineHeight * 7);
      }
    }
  }

  /**
   * Ajoute la section statistiques
   */
  addStatsSection(doc, stats) {
    doc.fontSize(18)
       .fillColor('#111827')
       .text('2. Vos statistiques d\'utilisation', 50, 50);
    
    doc.fontSize(12)
       .fillColor('#4B5563');

    const statsY = 100;
    const colWidth = 180;
    
    // Colonne 1
    doc.text(`Analyses totales : ${stats.totalAnalyses}`, 50, statsY);
    doc.text(`Score santé moyen : ${stats.avgHealthScore}/100`, 50, statsY + 25);
    doc.text(`Produits alimentaires : ${stats.foodProducts}`, 50, statsY + 50);
    
    // Colonne 2
    doc.text(`Analyses ce mois : ${stats.monthlyAnalyses}`, 250, statsY);
    doc.text(`Produits cosmétiques : ${stats.cosmeticProducts}`, 250, statsY + 25);
    doc.text(`Produits ménagers : ${stats.detergentProducts}`, 250, statsY + 50);

    // Graphique simple des tendances
    if (stats.monthlyTrend) {
      doc.fontSize(14)
         .text('Évolution mensuelle', 50, statsY + 100);
      
      // Dessiner un mini graphique
      this.drawSimpleChart(doc, stats.monthlyTrend, 50, statsY + 130);
    }
  }

  /**
   * Ajoute la section analyses
   */
  addAnalysesSection(doc, analyses) {
    doc.fontSize(18)
       .fillColor('#111827')
       .text('3. Historique de vos analyses', 50, 50);
    
    if (analyses.length === 0) {
      doc.fontSize(12)
         .fillColor('#6B7280')
         .text('Aucune analyse enregistrée', 50, 100);
      return;
    }

    // Tableau des analyses
    const tableTop = 100;
    const rowHeight = 25;
    const colWidths = [120, 150, 60, 60, 60, 80];
    
    // En-têtes
    doc.fontSize(10)
       .fillColor('#374151')
       .font('Helvetica-Bold');
    
    doc.text('Date', 50, tableTop);
    doc.text('Produit', 170, tableTop);
    doc.text('Nova', 320, tableTop);
    doc.text('Nutri', 380, tableTop);
    doc.text('Santé', 440, tableTop);
    doc.text('Méthode', 500, tableTop);
    
    // Ligne sous les en-têtes
    doc.moveTo(50, tableTop + 15)
       .lineTo(545, tableTop + 15)
       .stroke('#E5E7EB');
    
    // Données
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#4B5563');
    
    analyses.slice(0, 15).forEach((analysis, index) => {
      const y = tableTop + 25 + (index * rowHeight);
      
      doc.text(
        new Date(analysis.createdAt).toLocaleDateString('fr-FR'),
        50, y
      );
      
      const productName = analysis.productId?.name || 'Produit inconnu';
      doc.text(
        productName.substring(0, 25) + (productName.length > 25 ? '...' : ''),
        170, y
      );
      
      doc.text(
        analysis.results?.scores?.nova || '-',
        320, y
      );
      
      doc.text(
        analysis.results?.scores?.nutriscore || '-',
        380, y
      );
      
      doc.text(
        analysis.results?.scores?.health ? `${analysis.results.scores.health}/100` : '-',
        440, y
      );
      
      doc.text(
        analysis.method || 'manuel',
        500, y
      );
      
      // Ligne de séparation
      if (index < analyses.length - 1) {
        doc.moveTo(50, y + 15)
           .lineTo(545, y + 15)
           .stroke('#F3F4F6');
      }
    });
    
    if (analyses.length > 15) {
      doc.fontSize(10)
         .fillColor('#6B7280')
         .text(`... et ${analyses.length - 15} autres analyses`, 50, tableTop + 25 + (15 * rowHeight));
    }
  }

  /**
   * Ajoute la section paiements
   */
  addPaymentsSection(doc, payments) {
    doc.fontSize(18)
       .fillColor('#111827')
       .text('4. Historique de vos paiements', 50, 50);
    
    const tableTop = 100;
    const rowHeight = 25;
    
    // En-têtes
    doc.fontSize(10)
       .fillColor('#374151')
       .font('Helvetica-Bold');
    
    doc.text('Date', 50, tableTop);
    doc.text('Montant', 150, tableTop);
    doc.text('Type', 250, tableTop);
    doc.text('Statut', 400, tableTop);
    
    // Données
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#4B5563');
    
    payments.forEach((payment, index) => {
      const y = tableTop + 25 + (index * rowHeight);
      
      doc.text(
        new Date(payment.createdAt).toLocaleDateString('fr-FR'),
        50, y
      );
      
      doc.text(
        `${payment.amount} ${payment.currency}`,
        150, y
      );
      
      doc.text(
        payment.type,
        250, y
      );
      
      doc.text(
        payment.status,
        400, y
      );
    });
  }

  /**
   * Ajoute le footer du PDF
   */
  addPDFFooter(doc, exportDate) {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Ligne de séparation
      doc.moveTo(50, 750)
         .lineTo(545, 750)
         .stroke('#E5E7EB');
      
      // Texte du footer
      doc.fontSize(8)
         .fillColor('#9CA3AF')
         .text(
           `Export généré le ${new Date(exportDate).toLocaleDateString('fr-FR')} à ${new Date(exportDate).toLocaleTimeString('fr-FR')}`,
           50, 760
         );
      
      doc.text(
        `Page ${i + 1} / ${pages.count}`,
        500, 760
      );
    }
  }

  /**
   * Dessine un graphique simple
   */
  drawSimpleChart(doc, data, x, y) {
    const width = 400;
    const height = 100;
    const padding = 10;
    
    // Cadre du graphique
    doc.rect(x, y, width, height)
       .stroke('#E5E7EB');
    
    // Calculer l'échelle
    const maxValue = Math.max(...data.map(d => d.value));
    const xStep = (width - 2 * padding) / (data.length - 1);
    const yScale = (height - 2 * padding) / maxValue;
    
    // Dessiner la courbe
    doc.moveTo(x + padding, y + height - padding - (data[0].value * yScale));
    
    data.forEach((point, index) => {
      const px = x + padding + (index * xStep);
      const py = y + height - padding - (point.value * yScale);
      
      if (index > 0) {
        doc.lineTo(px, py);
      }
      
      // Point
      doc.circle(px, py, 2)
         .fill('#10B981');
    });
    
    doc.stroke('#10B981');
    
    // Labels des mois
    doc.fontSize(7)
       .fillColor('#9CA3AF');
    
    data.forEach((point, index) => {
      if (index % 2 === 0) { // Afficher un mois sur deux
        const px = x + padding + (index * xStep);
        doc.text(point.month, px - 10, y + height + 5);
      }
    });
  }

  /**
   * Crée une archive ZIP
   */
  async createZipArchive(files, exportId, timestamp) {
    const zipFilename = `ecolojia-export-complete-${timestamp}.zip`;
    const zipFilepath = path.join(this.exportPath, zipFilename);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipFilepath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Compression maximale
      });

      output.on('close', () => {
        resolve({
          filename: zipFilename,
          filepath: zipFilepath,
          size: archive.pointer(),
          mimetype: 'application/zip'
        });
      });

      archive.on('error', reject);

      archive.pipe(output);

      // Ajouter tous les fichiers
      files.forEach(fileGroup => {
        if (Array.isArray(fileGroup)) {
          fileGroup.forEach(file => {
            archive.file(file.filepath, { name: file.filename });
          });
        } else if (fileGroup.filepath) {
          archive.file(fileGroup.filepath, { name: fileGroup.filename });
        }
      });

      // Ajouter un fichier README
      const readme = `ECOLOJIA - Export de données personnelles
========================================

Cet export contient toutes vos données personnelles conformément au RGPD.

Contenu de l'archive :
- Fichier JSON : Format complet avec toutes vos données structurées
- Fichiers CSV : Données tabulaires pour analyse dans Excel/Google Sheets
- Fichier PDF : Rapport formaté pour consultation et impression

Protection des données :
- Ces fichiers contiennent des données personnelles sensibles
- Conservez-les en lieu sûr et ne les partagez pas
- Supprimez-les après utilisation si nécessaire

Pour toute question : privacy@ecolojia.app

Date d'export : ${new Date().toLocaleString('fr-FR')}
`;

      archive.append(readme, { name: 'README.txt' });
      archive.finalize();
    });
  }

  /**
   * Nettoie les données utilisateur
   */
  sanitizeUserData(user) {
    const sanitized = { ...user };
    
    // Supprimer les champs sensibles
    delete sanitized.password;
    delete sanitized.refreshToken;
    delete sanitized.resetPasswordToken;
    delete sanitized.__v;
    
    return sanitized;
  }

  /**
   * Nettoie les données d'analyse
   */
  sanitizeAnalysis(analysis) {
    const sanitized = { ...analysis };
    
    // Garder seulement les champs pertinents
    return {
      id: sanitized._id,
      productId: sanitized.productId,
      method: sanitized.method,
      results: sanitized.results,
      createdAt: sanitized.createdAt
    };
  }

  /**
   * Nettoie les données produit
   */
  sanitizeProduct(product) {
    const sanitized = { ...product };
    
    // Supprimer les métadonnées internes
    delete sanitized.__v;
    delete sanitized.updatedAt;
    
    return sanitized;
  }

  /**
   * Nettoie les données de paiement
   */
  sanitizePayment(payment) {
    const sanitized = { ...payment };
    
    // Masquer les infos sensibles
    if (sanitized.metadata?.card_last_four) {
      sanitized.metadata.card_last_four = `****${sanitized.metadata.card_last_four}`;
    }
    
    delete sanitized.__v;
    
    return sanitized;
  }

  /**
   * Calcule les statistiques utilisateur
   */
  async calculateUserStats(userId, analyses) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Analyses ce mois
    const monthlyAnalyses = analyses.filter(a => 
      new Date(a.createdAt) >= thisMonth
    ).length;
    
    // Moyenne des scores santé
    const healthScores = analyses
      .map(a => a.results?.scores?.health)
      .filter(score => score !== undefined);
    
    const avgHealthScore = healthScores.length > 0
      ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
      : 0;
    
    // Répartition par catégorie
    const categories = analyses.reduce((acc, analysis) => {
      const cat = analysis.results?.category || 'unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    
    // Tendance mensuelle (6 derniers mois)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthAnalyses = analyses.filter(a => {
        const date = new Date(a.createdAt);
        return date >= monthStart && date <= monthEnd;
      });
      
      monthlyTrend.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'short' }),
        value: monthAnalyses.length
      });
    }
    
    return {
      totalAnalyses: analyses.length,
      monthlyAnalyses,
      avgHealthScore,
      foodProducts: categories.food || 0,
      cosmeticProducts: categories.cosmetics || 0,
      detergentProducts: categories.detergents || 0,
      monthlyTrend,
      firstAnalysis: analyses.length > 0 ? analyses[analyses.length - 1].createdAt : null,
      lastAnalysis: analyses.length > 0 ? analyses[0].createdAt : null
    };
  }

  /**
   * Enregistre l'export dans l'historique
   */
  async logExport(userId, exportId, format, files) {
    try {
      // Créer un modèle ExportLog si nécessaire
      const exportLog = {
        userId,
        exportId,
        format,
        files: Object.entries(files).map(([type, file]) => ({
          type,
          filename: Array.isArray(file) ? file.map(f => f.filename) : file.filename,
          size: Array.isArray(file) ? file.reduce((sum, f) => sum + (f.size || 0), 0) : file.size
        })),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      // Sauvegarder en base si vous avez un modèle ExportLog
      console.log('📝 Export enregistré:', exportLog);
      
    } catch (error) {
      console.error('Erreur log export:', error);
    }
  }

  /**
   * Nettoie les exports expirés
   */
  async cleanupExpiredExports() {
    try {
      const files = await fs.readdir(this.exportPath);
      const now = Date.now();
      
      for (const file of files) {
        const filepath = path.join(this.exportPath, file);
        const stats = await fs.stat(filepath);
        
        // Supprimer les fichiers de plus de 24h
        if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          await fs.unlink(filepath);
          console.log(`🗑️ Export expiré supprimé: ${file}`);
        }
      }
    } catch (error) {
      console.error('Erreur nettoyage exports:', error);
    }
  }

  /**
   * Supprime toutes les données d'un utilisateur (droit à l'oubli)
   */
  async deleteAllUserData(userId) {
    try {
      console.log(`🗑️ Suppression complète des données pour l'utilisateur ${userId}`);
      
      // Supprimer dans l'ordre pour respecter les contraintes
      await Analysis.deleteMany({ userId });
      await Payment.deleteMany({ userId });
      await User.findByIdAndDelete(userId);
      
      return {
        success: true,
        message: 'Toutes vos données ont été supprimées définitivement'
      };
      
    } catch (error) {
      console.error('Erreur suppression données:', error);
      throw new Error('Impossible de supprimer les données');
    }
  }
}

// Export singleton
module.exports = new DataExportService();
