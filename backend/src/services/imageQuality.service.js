/**
 * IMAGE QUALITY SERVICE V1.0
 * Validation qualité photo avant analyse IA
 * Détection flou + résolution + format
 * Constitution Ecolojia - Pas de gaspillage IA sur photos inexploitables
 */

const sharp = require('sharp');

class ImageQualityService {
  /**
   * Analyse qualité complète d'une image
   * @param {Buffer} imageBuffer - Image en buffer
   * @returns {Promise<QualityResult>}
   */
  static async analyzeQuality(imageBuffer) {
    try {
      const startTime = Date.now();
      
      // 1. Validation format et métadonnées
      const metadata = await sharp(imageBuffer).metadata();
      const formatValidation = this._validateFormat(metadata);
      
      if (!formatValidation.isValid) {
        return {
          isValid: false,
          quality: 0,
          issues: formatValidation.issues,
          metadata: {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height
          },
          processingTime: Date.now() - startTime
        };
      }
      
      // 2. Validation résolution minimum
      const resolutionValidation = this._validateResolution(metadata);
      
      // 3. Détection flou (Laplacian variance)
      const blurScore = await this._detectBlur(imageBuffer);
      
      // 4. Calcul qualité globale (0-100)
      const qualityScore = this._calculateQualityScore(
        resolutionValidation,
        blurScore
      );
      
      // 5. Compilation issues
      const allIssues = [
        ...formatValidation.issues,
        ...resolutionValidation.issues,
        ...blurScore.issues
      ];
      
      // 6. LOG DÉTAILLÉ pour diagnostic
      console.log('📊 [ImageQuality] Détails analyse:');
      console.log('   - Format:', metadata.format);
      console.log('   - Résolution:', metadata.width + 'x' + metadata.height);
      console.log('   - Variance Laplacian:', blurScore.score.toFixed(2));
      console.log('   - Seuil flou:', '10');
      console.log('   - Issues résolution:', resolutionValidation.issues);
      console.log('   - Issues flou:', blurScore.issues);
      console.log('   - Score qualité global:', qualityScore);

      // 6. Décision finale
      // Validation robuste : accepter si score >= 50 ET pas d'erreur CRITIQUE
      // Issues "sous-optimale" ou "flou léger" ne bloquent pas
      const criticalIssues = allIssues.filter(issue => 
        issue.includes('Format non supporté') || 
        issue.includes('Résolution trop faible')
      );
      const isValid = criticalIssues.length === 0 && qualityScore >= 50;
      
      return {
        isValid,
        quality: qualityScore,
        issues: allIssues,
        details: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          blurScore: blurScore.score,
          blurThreshold: 10 // Seuil variance Laplacian (ajusté)
        },
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('❌ ImageQuality analysis error:', error.message);
      return {
        isValid: false,
        quality: 0,
        issues: [`Erreur analyse: ${error.message}`],
        processingTime: 0
      };
    }
  }
  
  /**
   * Validation format image
   * @private
   */
  static _validateFormat(metadata) {
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    const format = metadata.format?.toLowerCase();
    
    if (!format || !allowedFormats.includes(format)) {
      return {
        isValid: false,
        issues: [`Format non supporté: ${format}. Formats acceptés: JPEG, PNG, WebP`]
      };
    }
    
    return {
      isValid: true,
      issues: []
    };
  }
  
  /**
   * Validation résolution minimum
   * @private
   */
  static _validateResolution(metadata) {
    const MIN_WIDTH = 800;
    const MIN_HEIGHT = 600;
    const OPTIMAL_WIDTH = 1920;
    const OPTIMAL_HEIGHT = 1080;
    
    const issues = [];
    let score = 100;
    
    const { width, height } = metadata;
    
    // Résolution trop basse
    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      issues.push(
        `Résolution trop faible: ${width}x${height}. Minimum requis: ${MIN_WIDTH}x${MIN_HEIGHT}`
      );
      score = 0;
    }
    // Résolution basse mais acceptable
    else if (width < OPTIMAL_WIDTH || height < OPTIMAL_HEIGHT) {
      issues.push(
        `Résolution sous-optimale: ${width}x${height}. Recommandé: ${OPTIMAL_WIDTH}x${OPTIMAL_HEIGHT}`
      );
      score = 60;
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      score
    };
  }
  
  /**
   * Détection flou via variance Laplacian
   * @private
   */
  static async _detectBlur(imageBuffer) {
    try {
      // Convertir en niveaux de gris
      const { data, info } = await sharp(imageBuffer)
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Calculer variance Laplacian (détection contours)
      const laplacianVariance = this._calculateLaplacianVariance(
        data,
        info.width,
        info.height
      );
      
      // Seuil de flou (empirique)
      const BLUR_THRESHOLD = 10;
      const isBlurry = laplacianVariance < BLUR_THRESHOLD;
      
      const issues = [];
      let score = 100;
      
      if (isBlurry) {
        issues.push(
          `Photo floue détectée (score: ${laplacianVariance.toFixed(2)}). Rapprochez-vous du produit`
        );
        score = Math.min(50, (laplacianVariance / BLUR_THRESHOLD) * 100);
      }
      
      return {
        score: laplacianVariance,
        isBlurry,
        issues
      };
      
    } catch (error) {
      console.error('❌ Blur detection error:', error.message);
      return {
        score: 0,
        isBlurry: true,
        issues: ['Impossible de détecter le flou']
      };
    }
  }
  
  /**
   * Calcul variance Laplacian
   * @private
   */
  static _calculateLaplacianVariance(pixels, width, height) {
    // Kernel Laplacian 3x3
    const kernel = [
      0, 1, 0,
      1, -4, 1,
      0, 1, 0
    ];
    
    let sum = 0;
    let sumSquared = 0;
    let count = 0;
    
    // Parcourir pixels (ignorer bordures)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let laplacian = 0;
        
        // Appliquer kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = (y + ky) * width + (x + kx);
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            laplacian += pixels[pixelIndex] * kernel[kernelIndex];
          }
        }
        
        sum += laplacian;
        sumSquared += laplacian * laplacian;
        count++;
      }
    }
    
    // Calculer variance
    const mean = sum / count;
    const variance = (sumSquared / count) - (mean * mean);
    
    return variance;
  }
  
  /**
   * Calcul score qualité global
   * @private
   */
  static _calculateQualityScore(resolutionValidation, blurScore) {
    // Moyenne pondérée
    const resolutionWeight = 0.4;
    const blurWeight = 0.6;
    
    const resolutionScore = resolutionValidation.score;
    const blurQuality = blurScore.isBlurry ? 0 : 100;
    
    const finalScore = Math.round(
      (resolutionScore * resolutionWeight) +
      (blurQuality * blurWeight)
    );
    
    return Math.max(0, Math.min(100, finalScore));
  }
  
  /**
   * Instructions utilisateur selon problème détecté
   * @static
   */
  static getInstructions(issues) {
    const instructions = [];
    
    if (issues.some(i => i.includes('floue'))) {
      instructions.push('📸 Stabilisez votre appareil et rapprochez-vous du produit');
    }
    
    if (issues.some(i => i.includes('Résolution'))) {
      instructions.push('📱 Utilisez un appareil avec meilleure caméra ou éclairage');
    }
    
    if (issues.some(i => i.includes('Format'))) {
      instructions.push('🖼️ Prenez une photo au format JPEG, PNG ou WebP');
    }
    
    return instructions;
  }
}

module.exports = ImageQualityService;



