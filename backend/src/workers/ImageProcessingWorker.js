// backend/src/workers/ImageProcessingWorker.js
const queueService = require('../services/queue/QueueService');
const visionService = require('../services/vision/VisionService');
const cloudinaryService = require('../services/upload/CloudinaryService');
const Product = require('../models/Product');
const Analysis = require('../models/Analysis');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');

// Logger simple
const logger = {
  info: (...args) => console.log('[ImageWorker]', ...args),
  error: (...args) => console.error('[ImageWorker ERROR]', ...args),
  warn: (...args) => console.warn('[ImageWorker WARN]', ...args)
};

// Import des analyseurs
let universalAnalyzer;
try {
  universalAnalyzer = require('../services/analysis/universalAnalyzer');
} catch (error) {
  logger.warn('UniversalAnalyzer not found');
}

class ImageProcessingWorker {
  async start() {
    try {
      logger.info('Starting ImageProcessingWorker...');
      
      // Initialiser VisionService
      await visionService.initialize();
      
      // Créer le worker
      const worker = await queueService.createWorker(
        'image-analysis',
        this.processJob.bind(this),
        {
          concurrency: 3, // Traiter 3 images en parallèle max
          maxStalledCount: 3,
          stalledInterval: 30000
        }
      );

      logger.info('✅ ImageProcessingWorker started');
      return worker;
    } catch (error) {
      logger.error('Failed to start ImageProcessingWorker:', error);
      throw error;
    }
  }

  async processJob(job) {
    const { userId, imageUrl, analysisId, productId, source } = job.data;
    
    logger.info(`Processing job ${job.id} for user ${userId}`);
    
    let tempFilePath = null;
    
    try {
      // Mettre à jour le statut de l'analyse
      if (analysisId) {
        await Analysis.findByIdAndUpdate(analysisId, {
          'visionAnalysis.status': 'processing',
          'visionAnalysis.startedAt': new Date()
        });
      }

      // Mettre à jour la progression
      await job.updateProgress(10);

      // 1. Télécharger l'image
      tempFilePath = await this.downloadImage(imageUrl, job.id);
      await job.updateProgress(30);

      // 2. Analyser avec VisionService
      const visionResult = await visionService.analyzeImage(tempFilePath);
      await job.updateProgress(60);

      // 3. Traiter les résultats
      const processedData = await this.processVisionResults(visionResult, {
        userId,
        productId,
        source
      });
      await job.updateProgress(80);

      // 4. Déclencher une analyse complète si on a trouvé des ingrédients
      if (processedData.hasValidData && universalAnalyzer) {
        await this.triggerProductAnalysis(processedData, userId);
      }
      await job.updateProgress(90);

      // 5. Sauvegarder les résultats
      const savedResult = await this.saveResults({
        analysisId,
        userId,
        visionResult,
        processedData,
        imageUrl
      });

      // Nettoyer le fichier temporaire
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }

      await job.updateProgress(100);

      logger.info(`Job ${job.id} completed successfully`);
      return savedResult;

    } catch (error) {
      logger.error(`Job ${job.id} failed:`, error);
      
      // Mettre à jour le statut en cas d'erreur
      if (analysisId) {
        await Analysis.findByIdAndUpdate(analysisId, {
          'visionAnalysis.status': 'failed',
          'visionAnalysis.error': error.message,
          'visionAnalysis.completedAt': new Date()
        });
      }

      // Nettoyer le fichier temporaire
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }

      throw error;
    }
  }

  async downloadImage(imageUrl, jobId) {
    try {
      logger.info(`Downloading image: ${imageUrl}`);
      
      // Créer le dossier temp s'il n'existe pas
      const tempDir = path.join(__dirname, '../../temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const tempFilePath = path.join(tempDir, `image_${jobId}_${Date.now()}.jpg`);
      
      // Si c'est une URL Cloudinary, on peut la télécharger directement
      if (imageUrl.includes('cloudinary.com')) {
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'stream'
        });
        
        const writer = require('fs').createWriteStream(tempFilePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
      } 
      // Si c'est un data URL (base64)
      else if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(tempFilePath, buffer);
      }
      // Autre URL
      else {
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer'
        });
        
        await fs.writeFile(tempFilePath, response.data);
      }
      
      logger.info(`Image downloaded to: ${tempFilePath}`);
      return tempFilePath;
      
    } catch (error) {
      logger.error('Failed to download image:', error);
      throw new Error(`Impossible de télécharger l'image: ${error.message}`);
    }
  }

  async processVisionResults(visionResult, context) {
    const { data } = visionResult;
    const { extractedData, productType, confidence } = data;
    
    const processed = {
      productName: extractedData.productName,
      brand: extractedData.brand,
      barcode: extractedData.barcode,
      category: productType === 'unknown' ? 'food' : productType,
      ingredients: extractedData.ingredients,
      nutritionalInfo: extractedData.nutritionalInfo,
      allergens: extractedData.allergens,
      weight: extractedData.weight,
      expiryDate: extractedData.expiryDate,
      confidence: confidence.overall,
      hasValidData: false,
      warnings: []
    };
    
    // Vérifier la qualité des données
    if (!processed.productName && !processed.ingredients) {
      processed.warnings.push('Aucune information produit détectée');
    } else {
      processed.hasValidData = true;
    }
    
    if (confidence.overall < 60) {
      processed.warnings.push('Confiance faible dans l\'analyse');
    }
    
    if (!processed.ingredients) {
      processed.warnings.push('Liste d\'ingrédients non détectée');
    }
    
    // Essayer de retrouver le produit par code-barres
    if (processed.barcode && context.productId === 'auto') {
      try {
        const existingProduct = await Product.findOne({ barcode: processed.barcode });
        if (existingProduct) {
          context.productId = existingProduct._id;
          processed.productFound = true;
          processed.productData = existingProduct;
        }
      } catch (error) {
        logger.warn('Error finding product by barcode:', error);
      }
    }
    
    return processed;
  }

  async triggerProductAnalysis(processedData, userId) {
    try {
      if (!processedData.ingredients) {
        logger.warn('No ingredients to analyze');
        return null;
      }
      
      const analysisData = {
        userId,
        productData: {
          name: processedData.productName || 'Produit scanné',
          brand: processedData.brand,
          barcode: processedData.barcode,
          ingredients: processedData.ingredients,
          category: processedData.category
        },
        source: 'vision'
      };
      
      // Si on a un analyseur universel, l'utiliser
      if (universalAnalyzer) {
        const analysis = await universalAnalyzer.analyze(analysisData);
        return analysis;
      }
      
      // Sinon, ajouter à la queue d'analyse
      await queueService.addJob('product-analysis', 'analyze', analysisData);
      
      return null;
    } catch (error) {
      logger.error('Failed to trigger product analysis:', error);
      return null;
    }
  }

  async saveResults({ analysisId, userId, visionResult, processedData, imageUrl }) {
    try {
      const resultData = {
        userId,
        visionAnalysis: {
          status: 'completed',
          completedAt: new Date(),
          imageUrl,
          ocrResult: {
            rawText: visionResult.data.rawText,
            confidence: visionResult.data.confidence.ocr,
            language: visionResult.data.language
          },
          extractedData: processedData,
          warnings: processedData.warnings
        }
      };
      
      // Si on a un ID d'analyse existant, mettre à jour
      if (analysisId) {
        const updatedAnalysis = await Analysis.findByIdAndUpdate(
          analysisId,
          resultData,
          { new: true }
        );
        
        return {
          success: true,
          analysisId: updatedAnalysis._id,
          data: processedData
        };
      }
      
      // Sinon, créer une nouvelle analyse
      const newAnalysis = await Analysis.create({
        ...resultData,
        method: 'vision',
        timestamp: new Date()
      });
      
      return {
        success: true,
        analysisId: newAnalysis._id,
        data: processedData
      };
      
    } catch (error) {
      logger.error('Failed to save results:', error);
      throw error;
    }
  }
}

// Export singleton
module.exports = new ImageProcessingWorker();
