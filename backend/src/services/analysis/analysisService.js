// PATH: backend\src\services\analysis\analysisService.js
const Product = require('../../models/Product');

// ---------- require Algolia tolerant (plusieurs chemins + stub) ----------
function loadAlgoliaService() {
  const candidates = [
    '../algoliaService',
    '../algolia/algoliaService',
    '../algolia/index',
    '../algolia',
    '../../integrations/algoliaService',
  ];
  for (const p of candidates) {
    try {
      const svc = require(p);
      console.log('[analysisService] âœ… Algolia charge depuis', p);
      return svc;
    } catch (_) {}
  }
  console.warn('[analysisService] âš ï¸ Algolia non trouve â†’ stub no-op');
  return {
    updateProduct: async () => {},
    indexProduct: async () => {},
    searchByBarcode: async () => ({ hits: [] }),
  };
}
const algoliaService = loadAlgoliaService();

// ---------- lazy-load surs ----------
function lazyNew(modPath, fallbackFactory) {
  try {
    const Ctor = require(modPath);
    return new Ctor();
  } catch (e) {
    console.warn(`[analysisService] Module manquant/KO: ${modPath} â†’ fallback:`, e.message);
    return fallbackFactory();
  }
}

// ---------- NOVA (robuste   divers exports) ----------
let novaClassifierModule = null;
try { novaClassifierModule = require('./novaClassifier'); }
catch { console.warn('[analysisService] novaClassifier introuvable â†’ fallback simple'); }

function normalizeNovaResult(res) {
  if (res == null) return null;
  if (typeof res === 'number') return { group: res, label: `NOVA ${res}`, confidence: 0.75, reason: '' };
  const group = res.group ?? res.nova;
  if (!group) return null;
  return {
    group,
    label: res.label ?? `NOVA ${group}`,
    reason: res.reason ?? (Array.isArray(res.reasons) ? res.reasons.join(' Â· ') : ''),
    confidence: typeof res.confidence === 'number' ? res.confidence : 0.75,
    markers: res.markers || res.flags || [],
  };
}

function simpleNovaFromText(raw = '') {
  const t = String(raw || '').toLowerCase();
  const addCount = (t.match(/\be ?\d{3,4}[a-z]?\b/g) || []).length;
  const up = /(sirop de (glucose|fructose|glucose-fructose)|maltodextrine|amidon modifi|hydrog|isolat de proteine|agent de charge)/.test(t);
  const proc = /(ar[oo]me|colorant|conservateur|emulsifiant|emulsifiant|stabilisant|correcteur d.?acidit|edulcorant|edulcorant)/.test(t);
  let group = 1, label = 'Non transforme', reason = 'Ingredient unique';
  if (up || addCount >= 3 || (addCount >= 1 && proc)) { group = 4; label = 'Ultra-transforme'; reason = 'Marqueur U.P. ou â‰¥3 additifs'; }
  else if (addCount >= 1 || proc) { group = 3; label = 'Transforme'; reason = 'Presence d'additifs/procedes'; }
  else if (t.split(/,|;|\bet\b/gi).map(s => s.trim()).filter(Boolean).length > 1) { group = 2; label = 'Transforme simple'; reason = 'Plusieurs ingredients'; }
  return { group, label, confidence: group === 4 ? 0.85 : 0.75, markers: [], reason };
}

function runNovaClassifier(ingredientsText = '', additivesTags = []) {
  try {
    if (!novaClassifierModule) return simpleNovaFromText(ingredientsText);
    let candidate = novaClassifierModule;
    if (candidate && candidate.default) candidate = candidate.default;

    if (candidate && typeof candidate.classify === 'function') {
      return normalizeNovaResult(candidate.classify({ ingredients: ingredientsText, additives_tags: additivesTags })) || simpleNovaFromText(ingredientsText);
    }
    if (typeof candidate === 'function') {
      return normalizeNovaResult(candidate({ ingredients: ingredientsText, additives_tags: additivesTags })) || simpleNovaFromText(ingredientsText);
    }
    if (candidate && typeof candidate.predict === 'function') {
      return normalizeNovaResult(candidate.predict({ ingredients: ingredientsText, additives_tags: additivesTags })) || simpleNovaFromText(ingredientsText);
    }
    if (candidate && typeof candidate.analyze === 'function') {
      return normalizeNovaResult(candidate.analyze({ ingredients: ingredientsText, additives_tags: additivesTags })) || simpleNovaFromText(ingredientsText);
    }
    return simpleNovaFromText(ingredientsText);
  } catch (e) {
    console.warn('[analysisService] Erreur NOVA â†’ fallback simple:', e.message);
    return simpleNovaFromText(ingredientsText);
  }
}

class AnalysisService {
  constructor() {
    this._food = null;
    this._cosm = null;
    this._detg = null;
  }
  get foodAnalyzer() {
    if (!this._food) {
      this._food = lazyNew('./FoodAnalysisService', () => ({ analyze: async () => ({ category: 'food', timestamp: new Date(), scores: {}, details: {}, recommendations: [] }) }));
    }
    return this._food;
  }
  get cosmeticAnalyzer() {
    if (!this._cosm) {
      this._cosm = lazyNew('./CosmeticAnalysisService', () => ({ analyze: async () => ({ category: 'cosmetics', timestamp: new Date(), scores: {}, details: {}, recommendations: [] }) }));
    }
    return this._cosm;
  }
  get detergentAnalyzer() {
    if (!this._detg) {
      this._detg = lazyNew('./DetergentAnalysisService', () => ({ analyze: async () => ({ category: 'detergents', timestamp: new Date(), scores: {}, details: {}, recommendations: [] }) }));
    }
    return this._detg;
  }

  // -------- Heuristiques simples par defaut (fallback) --------
  estimateNutriScore(ingredientsRaw = '', nutrition = null) {
    // âš ï¸ Ultra simplifie: sucre/cereales chocolat â†’ C ; sinon B par defaut
    const t = String(ingredientsRaw || '').toLowerCase();
    if (/sucre|glucose|fructose|cacao|chocolat/.test(t)) return 'C';
    return 'B';
  }
  estimateEcoScore(productData = {}) {
    // âš ï¸ Ultra simplifie: par defaut C ; si "bio" detecte â†’ B
    const name = (productData.name || '').toLowerCase();
    const brand = (productData.brand || '').toLowerCase();
    if (/bio|organic|ecologique/.test(name) || /bio|organic/.test(brand)) return 'B';
    return 'C';
  }

  async analyzeProduct(productData, options = {}) {
    const {
      category = this.detectCategory(productData),
      updateDatabase = true,
      updateAlgolia = true,
    } = options;

    console.log(`ðŸ”¬ Analyse du produit: ${productData.name || 'Sans nom'} [${category}]`);

    let analysis = {
      category,
      timestamp: new Date(),
      scores: {},
      details: {},
      recommendations: [],
    };

    try {
      switch (category) {
        case 'food':
        case 'alimentaire':
          analysis = await this.foodAnalyzer.analyze(productData);
          break;
        case 'cosmetics':
        case 'cosmetique':
          analysis = await this.cosmeticAnalyzer.analyze(productData);
          break;
        case 'detergents':
        case 'detergents':
          analysis = await this.detergentAnalyzer.analyze(productData);
          break;
        default:
          analysis.scores = { healthScore: 50, environmentScore: 50 };
          analysis.details = { message: 'Categorie non reconnue' };
      }

      // â€”â€” NOVA + Nutri/Eco par defaut + texte brut conserve â€”â€”
      if (category === 'food' || category === 'alimentaire') {
        const ingredientsRaw =
          typeof productData.ingredients === 'string'
            ? productData.ingredients
            : (productData.ingredients?.text || '');
        const additives = productData.additives_tags || productData.additivesTags || [];

        // NOVA
        const nova = runNovaClassifier(ingredientsRaw || '', additives);
        analysis.details = {
          ...analysis.details,
          ingredientsTextRaw: ingredientsRaw || null,
          nova: nova.group,
          novaLabel: nova.label,
          novaReason: nova.reason,
          novaMarkers: nova.markers,
          novaConfidence: nova.confidence,
        };
        analysis.scores = { ...analysis.scores, nova: nova.group };

        // HealthScore si absent
        if (typeof analysis.scores.healthScore !== 'number') {
          const byNova = { 1: 85, 2: 70, 3: 55, 4: 45 };
          analysis.scores.healthScore = byNova[nova.group] || 55;
        }
        // EnvScore si absent
        if (typeof analysis.scores.environmentScore !== 'number') {
          analysis.scores.environmentScore = 60;
        }

        // Nutri/Eco: si non calcules par le sous-service, on met un fallback conservateur
        if (!analysis.details.nutriscore && !analysis.scores.nutriscore) {
          const nutri = this.estimateNutriScore(ingredientsRaw, productData.foodData?.nutrition);
          analysis.details.nutriscore = nutri;
          analysis.scores.nutriscore = nutri;
        }
        if (!analysis.details.ecoscore && !analysis.scores.ecoscore) {
          const eco = this.estimateEcoScore(productData);
          analysis.details.ecoscore = eco;
          analysis.scores.ecoscore = eco;
        }
      }

      analysis.globalScore = this.calculateGlobalScore(analysis);
      analysis.confidence = this.calculateConfidence(productData, analysis);

      if (updateDatabase && productData._id) {
        await this.updateProductAnalysis(productData._id, analysis);
      }
      if (updateAlgolia && productData._id) {
        await algoliaService.updateProduct(productData._id, {
          scores: analysis.scores,
          healthScore: analysis.scores.healthScore || 50,
          environmentScore: analysis.scores.environmentScore || 50,
          nova: analysis.scores.nova || analysis.details.nova || null,
          nutriscore: analysis.details.nutriscore || analysis.scores.nutriscore || null,
          ecoscore: analysis.details.ecoscore || analysis.scores.ecoscore || null,
        });
      }

      return analysis;
    } catch (error) {
      console.error('âŒ Erreur analyse:', error);
      // Fallback de secours
      const ingredientsRaw =
        typeof productData.ingredients === 'string'
          ? productData.ingredients
          : (productData.ingredients?.text || '');
      const nova = simpleNovaFromText(ingredientsRaw || '');
      const healthByNova = { 1: 85, 2: 70, 3: 55, 4: 45 };
      const nutri = this.estimateNutriScore(ingredientsRaw, productData.foodData?.nutrition);
      const eco = this.estimateEcoScore(productData);
      return {
        category,
        timestamp: new Date(),
        scores: {
          nova: nova.group,
          healthScore: healthByNova[nova.group] ?? 55,
          environmentScore: 60,
          nutriscore: nutri,
          ecoscore: eco,
        },
        details: {
          ingredientsTextRaw: ingredientsRaw || null,
          nova: nova.group,
          novaLabel: nova.label,
          novaReason: nova.reason,
          novaConfidence: nova.confidence,
          nutriscore: nutri,
          ecoscore: eco,
        },
        recommendations: [],
        globalScore: this.calculateGlobalScore({ scores: { healthScore: healthByNova[nova.group] ?? 55, environmentScore: 60 } }),
        confidence: 0.8,
      };
    }
  }

  async analyzeByBarcode(barcode, userId = null) {
    let product = await Product.findOne({ barcode });
    if (!product) {
      const algoliaResult = await algoliaService.searchByBarcode(barcode);
      if (algoliaResult.hits?.length > 0) {
        product = await Product.findById(algoliaResult.hits[0].objectID);
      }
    }
    if (!product) throw new Error('Produit non trouve');

    if (userId) {
      await Product.findByIdAndUpdate(product._id, {
        $inc: { 'metadata.scanCount': 1 },
        $addToSet: { 'metadata.scannedBy': userId },
      });
    }

    if (product.analysis?.timestamp) {
      const ageInDays = (Date.now() - new Date(product.analysis.timestamp)) / 86400000;
      if (ageInDays < 30) return product.analysis;
    }
    return await this.analyzeProduct(product);
  }

  async analyzeManual(data, userId = null) {
    const { name, brand, category, ingredients, barcode, nutritionalInfo } = data;

    const tempProduct = {
      name, brand,
      category: category || 'food',
      barcode,
      ingredients: { text: ingredients },
      foodData: nutritionalInfo ? { nutrition: nutritionalInfo } : null,
    };

    const analysis = await this.analyzeProduct(tempProduct, { updateDatabase: false, updateAlgolia: false });

    if (data.createProduct && userId) {
      await new Product({
        ...tempProduct,
        createdBy: userId,
        source: 'manual',
        analysis,
        metadata: { createdAt: new Date(), updatedAt: new Date() },
      }).save().then(async (newProduct) => {
        try { await algoliaService.indexProduct(newProduct); } catch {}
        analysis.productId = newProduct._id;
      });
    }
    return analysis;
  }

  async analyzeFromImage(imageData, userId = null) {
    const { extractedData, confidence } = imageData;
    if (extractedData.barcode) {
      try {
        const analysis = await this.analyzeByBarcode(extractedData.barcode, userId);
        return { ...analysis, source: 'barcode', ocrConfidence: confidence };
      } catch { console.log('Produit non trouve par code-barres, analyse manuelle...'); }
    }
    return await this.analyzeManual({ ...extractedData, createProduct: confidence > 0.8 }, userId);
  }

  detectCategory(productData) {
    const name = (productData.name || '').toLowerCase();
    const category = productData.category?.toLowerCase();
    if (category) {
      if (category.includes('food') || category.includes('aliment')) return 'food';
      if (category.includes('cosm') || category.includes('beauty')) return 'cosmetics';
      if (category.includes('deterg') || category.includes('clean')) return 'detergents';
    }
    const foodKeywords = ['chocolat', 'biscuit', 'yaourt', 'lait', 'pain', 'pates', 'riz', 'sauce', 'huile', 'sucre', 'farine'];
    const cosmeticKeywords = ['creme', 'shampoing', 'gel', 'savon', 'lotion', 'parfum', 'deodorant', 'dentifrice'];
    const detergentKeywords = ['lessive', 'detergent', 'nettoyant', 'javel', 'liquide vaisselle'];
    if (foodKeywords.some(kw => name.includes(kw))) return 'food';
    if (cosmeticKeywords.some(kw => name.includes(kw))) return 'cosmetics';
    if (detergentKeywords.some(kw => name.includes(kw))) return 'detergents';
    return 'food';
  }

  calculateGlobalScore(analysis) {
    const weights = { healthScore: 0.4, environmentScore: 0.3, ethicalScore: 0.2, qualityScore: 0.1 };
    let totalScore = 0, totalWeight = 0;
    Object.entries(weights).forEach(([k, w]) => {
      if (analysis.scores[k] !== undefined) { totalScore += analysis.scores[k] * w; totalWeight += w; }
    });
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  }

  calculateConfidence(productData, analysis) {
    let c = 0.5;
    if (productData.barcode) c += 0.1;
    if (productData.ingredients?.text) c += 0.1;
    if (productData.brand) c += 0.05;
    if (productData.images?.front) c += 0.05;
    if (analysis.scores?.nova != null) c += 0.1;
    if (analysis.details?.nutriscore) c += 0.1;
    return Math.min(0.95, c);
  }

  async updateProductAnalysis(productId, analysis) {
    try {
      await Product.findByIdAndUpdate(productId, {
        analysis: { ...analysis, updatedAt: new Date() },
        'metadata.lastAnalyzedAt': new Date(),
      });
      console.log(`âœ… Analyse mise   jour pour le produit ${productId}`);
    } catch (error) {
      console.error('âŒ Erreur mise   jour analyse:', error);
    }
  }
}

module.exports = new AnalysisService();

