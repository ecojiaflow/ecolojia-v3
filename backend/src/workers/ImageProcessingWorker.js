// backend/src/workers/ImageProcessingWorker.js
const queueService = require('../services/queue/QueueService');
const visionService = require('../services/vision/VisionService');
const cloudinaryService = require('../services/upload/CloudinaryService');
const universalAnalyzer = require('../services/analysis/universalAnalyzer');
const Product = require('../models/Product');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const sharp = require('sharp');

// Logger simple
const logger = {
  info: (...args) => console.log('[ImageWorker]', new Date().toISOString(), ...args),
  error: (...args) => console.error('[ImageWorker ERROR]', new Date().toISOString(), ...args),
  warn: (...args) => console.warn('[ImageWorker WARN]', new Date().toISOString(), ...args),
  debug: (...args) => process.env.NODE_ENV === 'development' && console.log('[ImageWorker DEBUG]', ...args)
};

class ImageProcessingWorker {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  async start() {
    try {
      logger.info('Starting ImageProcessingWorker...');
      
      // Creer le dossier temp s'il n'existe pas
      await this.ensureTempDir();
      
      // Initialiser VisionService
      await visionService.initialize();
      
      // Creer le worker
      const worker = await queueService.createWorker(
        'image-analysis',
        this.processJob.bind(this),
        {
          concurrency: 3, // Traiter 3 images en parallele max
          maxStalledCount: 3,
          stalledInterval: 30000,
          removeOnComplete: {
            age: 24 * 3600, // 24h
            count: 100
          },
          removeOnFail: {
            age: 7 * 24 * 3600 // 7 jours
          }
        }
      );

      // Gerer les evenements du worker
      worker.on('completed', (job, result) => {
        logger.info(`Job ${job.id} completed successfully`);
      });

      worker.on('failed', (job, err) => {
        logger.error(`Job ${job.id} failed:`, err.message);
      });

      worker.on('stalled', (jobId) => {
        console.warn(`Job ${jobId} stalled and will be retried`);
      });

      logger.info('âœ… ImageProcessingWorker started successfully');
      return worker;
    } catch (error) {
      logger.error('Failed to start ImageProcessingWorker:', error);
      throw error;
    }
  }

  async processJob(job) {
    const startTime = Date.now();
    const { userId, imageUrl, analysisId, productId, source = 'upload' } = job.data;
    
    logger.info(`Processing job ${job.id} for user ${userId}`);
    logger.debug('Job data:', job.data);
    
    let tempFilePath = null;
    let optimizedImagePath = null;
    
    try {
      // Verifier les quotas utilisateur
      await this.checkUserQuota(userId);
      
      // Mettre   jour le statut de l'analyse
      if (analysisId) {
        await this.updateAnalysisStatus(analysisId, 'processing', {
          startedAt: new Date()
        });
      }

      // Mettre   jour la progression
      await job.updateProgress(10);

      // 1. Telecharger et optimiser l'image
      logger.info('Downloading image...');
      tempFilePath = await this.downloadImage(imageUrl, job.id);
      await job.updateProgress(20);

      // 2. Optimiser l'image pour l'OCR
      logger.info('Optimizing image for OCR...');
      optimizedImagePath = await this.optimizeImageForOCR(tempFilePath, job.id);
      await job.updateProgress(30);

      // 3. Analyser avec VisionService
      logger.info('Analyzing with VisionService...');
      const visionResult = await this.analyzeWithVision(optimizedImagePath);
      await job.updateProgress(50);

      // 4. Traiter les resultats Vision
      logger.info('Processing vision results...');
      const processedData = await this.processVisionResults(visionResult, {
        userId,
        productId,
        source
      });
      await job.updateProgress(60);

      // 5. Rechercher ou creer le produit
      let product = null;
      if (processedData.barcode || processedData.productName) {
        logger.info('Finding or creating product...');
        product = await this.findOrCreateProduct(processedData, userId);
        await job.updateProgress(70);
      }

      // 6. Analyser avec UniversalAnalyzer si on a trouve des donnees
      let analysisResult = null;
      if (product && processedData.hasValidData) {
        logger.info('Running universal analysis...');
        analysisResult = await this.runUniversalAnalysis(product, processedData, userId);
        await job.updateProgress(85);
      }

      // 7. Sauvegarder les resultats complets
      logger.info('Saving results...');
      const savedResult = await this.saveCompleteResults({
        analysisId,
        userId,
        visionResult,
        processedData,
        analysisResult,
        product,
        imageUrl,
        processingTime: Date.now() - startTime
      });

      // 8. Mettre   jour les quotas
      await this.updateUserQuota(userId, 'vision');

      // Nettoyer les fichiers temporaires
      await this.cleanupTempFiles([tempFilePath, optimizedImagePath]);

      await job.updateProgress(100);

      logger.info(`Job ${job.id} completed in ${Date.now() - startTime}ms`);
      
      return {
        success: true,
        analysisId: savedResult._id,
        productId: product?._id,
        data: {
          product: product ? {
            id: product._id,
            name: product.name,
            brand: product.brand,
            barcode: product.barcode,
            category: product.category
          } : null,
          analysis: analysisResult ? {
            scores: analysisResult.scores,
            summary: analysisResult.summary,
            recommendations: analysisResult.recommendations
          } : null,
          vision: {
            confidence: processedData.confidence,
            extractedText: visionResult.data.rawText?.substring(0, 200) + '...',
            dataFound: processedData.hasValidData
          }
        },
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      logger.error(`Job ${job.id} failed:`, error);
      
      // Mettre   jour le statut en cas d'erreur
      if (analysisId) {
        await this.updateAnalysisStatus(analysisId, 'failed', {
          error: error.message,
          completedAt: new Date()
        });
      }

      // Nettoyer les fichiers temporaires
      await this.cleanupTempFiles([tempFilePath, optimizedImagePath]);

      // Analyser le type d'erreur pour decider si on retry
      if (this.shouldRetry(error)) {
        throw error; // BullMQ va retry
      } else {
        // Erreur non-recuperable
        return {
          success: false,
          error: error.message,
          errorType: this.classifyError(error)
        };
      }
    }
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create temp directory:', error);
    }
  }

  async checkUserQuota(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('Utilisateur non trouve');

      // Verifier les quotas de scans
      if (user.tier === 'free' && user.quotas.scansUsed >= user.quotas.scansLimit) {
        throw new Error('QUOTA_EXCEEDED: Limite de scans atteinte');
      }

      return true;
    } catch (error) {
      logger.error('Quota check failed:', error);
      throw error;
    }
  }

  async downloadImage(imageUrl, jobId) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    try {
      logger.debug(`Downloading image from: ${imageUrl}`);
      
      const tempFilePath = path.join(this.tempDir, `image_${jobId}_${Date.now()}.jpg`);
      
      // Si c'est une URL Cloudinary
      if (imageUrl.includes('cloudinary.com')) {
        // Ajouter des transformations pour optimiser le telechargement
        const optimizedUrl = imageUrl.replace('/upload/', '/upload/f_jpg,q_auto:good/');
        
        const response = await axios({
          method: 'GET',
          url: optimizedUrl,
          responseType: 'stream',
          timeout: 30000,
          maxContentLength: maxSize,
          headers: {
            'User-Agent': 'ECOLOJIA-ImageProcessor/1.0'
          }
        });
        
        const writer = require('fs').createWriteStream(tempFilePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
          response.data.on('error', reject);
        });
      } 
      // Si c'est un data URL (base64)
      else if (imageUrl.startsWith('data:')) {
        const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) throw new Error('Format data URL invalide');
        
        const [, format, base64Data] = matches;
        const buffer = Buffer.from(base64Data, 'base64');
        
        if (buffer.length > maxSize) {
          throw new Error('Image trop grande');
        }
        
        await fs.writeFile(tempFilePath, buffer);
      }
      // URL externe
      else {
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer',
          timeout: 30000,
          maxContentLength: maxSize,
          headers: {
            'User-Agent': 'ECOLOJIA-ImageProcessor/1.0'
          }
        });
        
        await fs.writeFile(tempFilePath, response.data);
      }
      
      // Verifier que le fichier existe et est valide
      const stats = await fs.stat(tempFilePath);
      logger.debug(`Image downloaded: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        throw new Error('Fichier telecharge vide');
      }
      
      return tempFilePath;
      
    } catch (error) {
      logger.error('Failed to download image:', error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout lors du telechargement de l\'image');
      } else if (error.response?.status === 404) {
        throw new Error('Image non trouvee');
      } else if (error.message.includes('maxContentLength')) {
        throw new Error('Image trop grande (max 10MB)');
      }
      
      throw new Error(`Impossible de telecharger l'image: ${error.message}`);
    }
  }

  async optimizeImageForOCR(inputPath, jobId) {
    try {
      const outputPath = path.join(this.tempDir, `optimized_${jobId}_${Date.now()}.jpg`);
      
      await sharp(inputPath)
        .resize(2000, 2000, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .grayscale() // Convertir en niveaux de gris
        .normalize() // Normaliser le contraste
        .sharpen() // Ameliorer la nettete
        .jpeg({ 
          quality: 95,
          progressive: true 
        })
        .toFile(outputPath);
      
      logger.debug('Image optimized for OCR');
      return outputPath;
      
    } catch (error) {
      logger.error('Failed to optimize image:', error);
      // En cas d'erreur, retourner l'image originale
      return inputPath;
    }
  }

  async analyzeWithVision(imagePath) {
    try {
      const result = await visionService.analyzeImage(imagePath);
      
      if (!result.success) {
        throw new Error(result.error || 'Vision analysis failed');
      }
      
      return result;
    } catch (error) {
      logger.error('Vision analysis error:', error);
      
      // Retry avec timeout plus long
      if (error.message.includes('timeout')) {
        console.warn('Retrying vision analysis with longer timeout...');
        return await visionService.analyzeImage(imagePath, { timeout: 60000 });
      }
      
      throw error;
    }
  }

  async processVisionResults(visionResult, context) {
    const { data } = visionResult;
    const { extractedData, productType, confidence } = data;
    
    const processed = {
      // Donnees extraites
      productName: this.cleanText(extractedData.productName),
      brand: this.cleanText(extractedData.brand),
      barcode: this.validateBarcode(extractedData.barcode),
      category: this.mapProductType(productType),
      ingredients: this.cleanIngredients(extractedData.ingredients),
      nutritionalInfo: this.processNutritionalInfo(extractedData.nutritionalInfo),
      allergens: this.processAllergens(extractedData.allergens),
      weight: extractedData.weight,
      expiryDate: this.parseDate(extractedData.expiryDate),
      
      // Metadonnees
      confidence: confidence.overall,
      ocrConfidence: confidence.ocr,
      language: data.language,
      hasValidData: false,
      warnings: [],
      
      // Donnees brutes pour reference
      rawText: data.rawText
    };
    
    // Validation de la qualite des donnees
    const validation = this.validateExtractedData(processed);
    processed.hasValidData = validation.isValid;
    processed.warnings = validation.warnings;
    processed.dataQuality = validation.quality;
    
    // Enrichissement avec le contexte
    if (context.productId && context.productId !== 'auto') {
      processed.providedProductId = context.productId;
    }
    
    return processed;
  }

  cleanText(text) {
    if (!text) return null;
    
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-\u00C0-\u017F]/g, '') // Garder les accents
      .substring(0, 200); // Limiter la longueur
  }

  validateBarcode(barcode) {
    if (!barcode) return null;
    
    // Nettoyer le code-barres
    const cleaned = barcode.replace(/[^0-9]/g, '');
    
    // Valider la longueur (EAN-8, EAN-13, UPC-A, UPC-E)
    if ([8, 12, 13, 14].includes(cleaned.length)) {
      // Verifier le checksum pour EAN-13
      if (cleaned.length === 13) {
        const checksum = this.calculateEAN13Checksum(cleaned.substring(0, 12));
        if (checksum === parseInt(cleaned[12])) {
          return cleaned;
        }
      }
      return cleaned;
    }
    
    return null;
  }

  calculateEAN13Checksum(code) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
  }

  mapProductType(type) {
    const mapping = {
      'food': 'food',
      'cosmetic': 'cosmetic',
      'detergent': 'detergent',
      'alimentaire': 'food',
      'cosmetique': 'cosmetic',
      'menager': 'detergent',
      'unknown': null
    };
    
    return mapping[type?.toLowerCase()] || null;
  }

  cleanIngredients(ingredients) {
    if (!ingredients) return null;
    
    if (typeof ingredients === 'string') {
      return ingredients
        .replace(/ingredients?\s*:?\s*/i, '')
        .replace(/ingredients?\s*:?\s*/i, '')
        .trim();
    }
    
    if (Array.isArray(ingredients)) {
      return ingredients
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0)
        .join(', ');
    }
    
    return null;
  }

  processNutritionalInfo(info) {
    if (!info || typeof info !== 'object') return null;
    
    const processed = {};
    
    // Mapper les champs nutritionnels standards
    const fieldMapping = {
      'energy': ['energy', 'energie', 'calories', 'kcal'],
      'fat': ['fat', 'graisses', 'lipides'],
      'saturated_fat': ['saturated', 'satures', 'acides_gras_satures'],
      'carbohydrates': ['carbohydrates', 'glucides', 'carbs'],
      'sugars': ['sugars', 'sucres', 'sugar'],
      'fiber': ['fiber', 'fibres', 'fibre'],
      'proteins': ['proteins', 'proteines', 'protein'],
      'salt': ['salt', 'sel', 'sodium']
    };
    
    for (const [standard, variants] of Object.entries(fieldMapping)) {
      for (const variant of variants) {
        if (info[variant] !== undefined) {
          processed[standard] = this.parseNutritionalValue(info[variant]);
          break;
        }
      }
    }
    
    return Object.keys(processed).length > 0 ? processed : null;
  }

  parseNutritionalValue(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Extraire la valeur numerique
      const match = value.match(/(\d+(?:[.,]\d+)?)/);
      if (match) {
        return parseFloat(match[1].replace(',', '.'));
      }
    }
    return null;
  }

  processAllergens(allergens) {
    if (!allergens) return [];
    
    if (typeof allergens === 'string') {
      return allergens
        .split(/[,;]/)
        .map(a => a.trim().toLowerCase())
        .filter(a => a.length > 0);
    }
    
    if (Array.isArray(allergens)) {
      return allergens
        .map(a => (typeof a === 'string' ? a : a.name || '').trim().toLowerCase())
        .filter(a => a.length > 0);
    }
    
    return [];
  }

  parseDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      // Essayer differents formats de date
      const formats = [
        /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
        /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      ];
      
      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    } catch (error) {
      logger.debug('Failed to parse date:', dateStr);
    }
    
    return null;
  }

  validateExtractedData(data) {
    const warnings = [];
    let quality = 100;
    
    // Verifier les champs essentiels
    if (!data.productName) {
      warnings.push('Nom du produit non detecte');
      quality -= 30;
    }
    
    if (!data.barcode && !data.ingredients) {
      warnings.push('Ni code-barres ni ingredients detectes');
      quality -= 40;
    }
    
    // Verifier la confiance OCR
    if (data.ocrConfidence < 60) {
      warnings.push('Confiance OCR faible');
      quality -= 20;
    }
    
    // Verifier la categorie
    if (!data.category) {
      warnings.push('Categorie du produit non identifiee');
      quality -= 10;
    }
    
    // Determiner si les donnees sont valides
    const isValid = quality >= 30 && (data.productName || data.barcode || data.ingredients);
    
    return {
      isValid,
      quality: Math.max(0, quality),
      warnings
    };
  }

  async findOrCreateProduct(processedData, userId) {
    try {
      let product = null;
      
      // 1. Chercher par code-barres
      if (processedData.barcode) {
        product = await Product.findOne({ barcode: processedData.barcode });
        if (product) {
          logger.info(`Product found by barcode: ${processedData.barcode}`);
          
          // Mettre   jour avec de nouvelles donnees si disponibles
          if (processedData.ingredients && !product.ingredients?.text) {
            product.ingredients = {
              text: processedData.ingredients,
              list: this.parseIngredientsList(processedData.ingredients)
            };
            await product.save();
          }
          
          return product;
        }
      }
      
      // 2. Chercher par nom et marque (similarite)
      if (processedData.productName) {
        const searchQuery = {
          name: new RegExp(processedData.productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        };
        
        if (processedData.brand) {
          searchQuery.brand = new RegExp(processedData.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }
        
        product = await Product.findOne(searchQuery);
        if (product) {
          logger.info(`Product found by name/brand: ${processedData.productName}`);
          return product;
        }
      }
      
      // 3. Creer un nouveau produit
      logger.info('Creating new product from vision data');
      
      const newProduct = new Product({
        name: processedData.productName || 'Produit scanne',
        brand: processedData.brand || 'Marque inconnue',
        barcode: processedData.barcode,
        category: processedData.category || 'food', // Par defaut
        ingredients: processedData.ingredients ? {
          text: processedData.ingredients,
          list: this.parseIngredientsList(processedData.ingredients)
        } : undefined,
        nutritionFacts: processedData.nutritionalInfo,
        allergens: processedData.allergens,
        source: 'vision_scan',
        status: 'pending_verification',
        metadata: {
          createdAt: new Date(),
          createdBy: userId,
          scanCount: 1,
          visionConfidence: processedData.confidence,
          extractedFromImage: true
        },
        visionData: {
          hasBeenScanned: true,
          lastImageAnalysis: new Date(),
          extractedText: processedData.rawText?.substring(0, 1000),
          confidence: processedData.confidence
        }
      });
      
      await newProduct.save();
      logger.info(`New product created: ${newProduct._id}`);
      
      return newProduct;
      
    } catch (error) {
      logger.error('Error finding/creating product:', error);
      throw error;
    }
  }

  parseIngredientsList(ingredientsText) {
    if (!ingredientsText) return [];
    
    return ingredientsText
      .split(/[,;]/)
      .map(ing => ing.trim())
      .filter(ing => ing.length > 0)
      .map((ing, index) => ({
        name: ing,
        position: index + 1,
        percentage: null // € enrichir plus tard si possible
      }));
  }

  async runUniversalAnalysis(product, visionData, userId) {
    try {
      const analysisData = {
        productId: product._id,
        barcode: product.barcode,
        name: product.name,
        ingredients: product.ingredients?.text || visionData.ingredients,
        category: product.category,
        userId,
        method: 'vision',
        source: 'image_analysis'
      };
      
      // Appeler l'analyseur universel
      const result = await universalAnalyzer.analyze(analysisData);
      
      logger.info(`Universal analysis completed. Category: ${result.metadata.category}`);
      
      return result;
      
    } catch (error) {
      logger.error('Universal analysis failed:', error);
      // Ne pas faire echouer le job si l'analyse echoue
      return null;
    }
  }

  async saveCompleteResults(data) {
    const {
      analysisId,
      userId,
      visionResult,
      processedData,
      analysisResult,
      product,
      imageUrl,
      processingTime
    } = data;
    
    try {
      let analysis;
      
      // Si on a un ID d'analyse existant, mettre   jour
      if (analysisId) {
        analysis = await Analysis.findById(analysisId);
        if (!analysis) {
          throw new Error('Analysis not found');
        }
      } else {
        // Creer une nouvelle analyse
        analysis = new Analysis({
          userId,
          productId: product?._id,
          timestamp: new Date(),
          method: 'vision'
        });
      }
      
      // Construire les resultats complets
      analysis.visionAnalysis = {
        status: 'completed',
        completedAt: new Date(),
        processingTime,
        imageUrl,
        ocrResult: {
          rawText: visionResult.data.rawText,
          confidence: visionResult.data.confidence.ocr,
          language: visionResult.data.language,
          textAnnotations: visionResult.data.textAnnotations?.length || 0
        },
        extractedData: {
          productName: processedData.productName,
          brand: processedData.brand,
          barcode: processedData.barcode,
          category: processedData.category,
          ingredients: processedData.ingredients,
          nutritionalInfo: processedData.nutritionalInfo,
          allergens: processedData.allergens,
          confidence: processedData.confidence,
          dataQuality: processedData.dataQuality
        },
        warnings: processedData.warnings
      };
      
      // Si on a des resultats d'analyse universelle
      if (analysisResult) {
        analysis.results = {
          category: analysisResult.metadata.category,
          scores: analysisResult.scores,
          summary: analysisResult.summary,
          details: analysisResult.details,
          recommendations: analysisResult.recommendations,
          personalizedRecommendations: analysisResult.personalizedRecommendations,
          alternatives: analysisResult.alternatives
        };
      } else {
        // Resultats minimaux si pas d'analyse
        analysis.results = {
          category: product?.category || 'unknown',
          scores: {},
          summary: {
            fr: processedData.hasValidData ? 
              'Produit identifie, analyse detaillee non disponible' : 
              'Donnees insuffisantes pour une analyse complete'
          },
          details: {},
          recommendations: []
        };
      }
      
      await analysis.save();
      
      // Mettre   jour les statistiques du produit
      if (product) {
        await Product.findByIdAndUpdate(product._id, {
          $inc: { 'stats.scanCount': 1 },
          $set: { 'stats.lastScanned': new Date() }
        });
      }
      
      logger.info(`Analysis saved: ${analysis._id}`);
      return analysis;
      
    } catch (error) {
      logger.error('Failed to save results:', error);
      throw error;
    }
  }

  async updateAnalysisStatus(analysisId, status, updates = {}) {
    try {
      await Analysis.findByIdAndUpdate(analysisId, {
        'visionAnalysis.status': status,
        ...updates
      });
    } catch (error) {
      logger.error('Failed to update analysis status:', error);
    }
  }

  async updateUserQuota(userId, type = 'scan') {
    try {
      await User.findByIdAndUpdate(userId, {
        $inc: { 
          'quotas.scansUsed': 1,
          'stats.totalScansAllTime': 1
        },
        $set: {
          'metadata.lastActivityAt': new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to update user quota:', error);
    }
  }

  async cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
      if (filePath) {
        try {
          await fs.unlink(filePath);
          logger.debug(`Cleaned up temp file: ${filePath}`);
        } catch (error) {
          logger.debug(`Failed to cleanup ${filePath}:`, error.message);
        }
      }
    }
  }

  shouldRetry(error) {
    // Erreurs qui meritent un retry
    const retryableErrors = [
      'ECONNRESET',
      'ECONNABORTED', 
      'ETIMEDOUT',
      'ENOTFOUND',
      'timeout',
      'socket hang up'
    ];
    
    return retryableErrors.some(e => 
      error.code === e || error.message.toLowerCase().includes(e)
    );
  }

  classifyError(error) {
    if (error.message.includes('QUOTA_EXCEEDED')) {
      return 'quota_exceeded';
    } else if (error.message.includes('Image trop grande')) {
      return 'file_too_large';
    } else if (error.message.includes('non trouve')) {
      return 'not_found';
    } else if (error.message.includes('timeout')) {
      return 'timeout';
    } else if (error.message.includes('Invalid') || error.message.includes('invalide')) {
      return 'invalid_input';
    } else {
      return 'processing_error';
    }
  }

  async stop() {
    logger.info('Stopping ImageProcessingWorker...');
    // Nettoyer le dossier temp
    try {
      const files = await fs.readdir(this.tempDir);
      for (const file of files) {
        await fs.unlink(path.join(this.tempDir, file));
      }
    } catch (error) {
      logger.error('Error cleaning temp directory:', error);
    }
  }
}

// Export singleton
module.exports = new ImageProcessingWorker();
