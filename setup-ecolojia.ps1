# GUIDE POWERSHELL WINDOWS - FINALISATION ECOLOJIA
# =================================================

# 1. CONFIGURATION INITIALE
# -------------------------

# Définir le répertoire de base (adapter selon ton chemin)
$PROJECT_ROOT = "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN"
cd $PROJECT_ROOT

# Vérifier la structure
Write-Host "📁 Structure du projet:" -ForegroundColor Green
Get-ChildItem -Name

# 2. CRÉATION DES FICHIERS MANQUANTS
# -----------------------------------

# 2.1 Créer les dossiers nécessaires
Write-Host "`n📂 Création des dossiers..." -ForegroundColor Yellow

# Backend
New-Item -ItemType Directory -Force -Path "backend\src\routes" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\src\controllers" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\src\__tests__\unit" | Out-Null

# Frontend
New-Item -ItemType Directory -Force -Path "frontend\src\services\chat" | Out-Null

# Docs
New-Item -ItemType Directory -Force -Path ".github\workflows" | Out-Null
New-Item -ItemType Directory -Force -Path "docs\postman" | Out-Null

# 2.2 Créer les fichiers backend (Routes Cosmetics)
Write-Host "`n📝 Création des routes cosmétiques..." -ForegroundColor Yellow

@'
// PATH: backend/src/routes/cosmetics.routes.js
const express = require('express');
const router = express.Router();

const { 
  authOptional, 
  analysisLimiter, 
  checkQuota, 
  validateAnalysis, 
  asyncHandler 
} = require('../middleware');

// Controller (JS)
const { analyzeCosmeticController } = require('../controllers/cosmeticController');

// Health check
router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cosmetics', timestamp: new Date().toISOString() });
});

/**
 * POST /api/cosmetics/analyze
 * Body: { barcode?, name?, ingredients? | inciList?, language? }
 */
router.post(
  '/analyze',
  authOptional,
  analysisLimiter,
  asyncHandler
  ? asyncHandler(analyzeCosmeticController)
  : analyzeCosmeticController
);

module.exports = router;
'@ | Out-File -FilePath "backend\src\routes\cosmetics.routes.js" -Encoding UTF8

# 2.3 Créer les fichiers backend (Routes Detergents)
@'
// PATH: backend/src/routes/detergents.routes.js
const express = require('express');
const router = express.Router();

const { 
  authOptional, 
  analysisLimiter, 
  asyncHandler 
} = require('../middleware');

const { analyzeDetergentController } = require('../controllers/detergentController');

// Health check
router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'detergents', timestamp: new Date().toISOString() });
});

/**
 * POST /api/detergents/analyze
 * Body: { barcode?, name?, composition? | ingredients?, certifications?, language? }
 */
router.post(
  '/analyze',
  authOptional,
  analysisLimiter,
  asyncHandler
  ? asyncHandler(analyzeDetergentController)
  : analyzeDetergentController
);

module.exports = router;
'@ | Out-File -FilePath "backend\src\routes\detergents.routes.js" -Encoding UTF8

# 2.4 Créer les controllers
Write-Host "`n📝 Création des controllers..." -ForegroundColor Yellow

# Controller Cosmetic
@'
// PATH: backend/src/controllers/cosmeticController.js
const crypto = require('crypto');
const { Logger } = require('../utils/logger');
const CosmeticScorer = require('../scorers/cosmetic/cosmeticScorer');

const logger = new Logger('CosmeticController');

function normalizeIngredients(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(s => String(s).toUpperCase().trim()).filter(Boolean);
  return String(input)
    .replace(/INGRÉDIENTS?|INGREDIENTS?\s*[:;-]?\s*/i, '')
    .replace(/\([^)]*\)/g, '')
    .split(/[,;]\s*|\n+/)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
}

function labelFromScore(v) {
  if (v >= 90) return 'A';
  if (v >= 75) return 'B';
  if (v >= 60) return 'C';
  if (v >= 40) return 'D';
  return 'E';
}

function mapRisksFromCosmetic(raw) {
  const risks = [];
  try {
    const ra = raw?.risk_analysis || {};
    const allerg = raw?.allergen_analysis || {};
    if (Array.isArray(ra.endocrine_disruptors)) {
      ra.endocrine_disruptors.forEach(item => {
        const name = (item?.ingredient || item?.name || item || '').toString();
        const sev = (item?.risk || item?.severity || 'high').toString().toLowerCase();
        risks.push({ code: 'ENDOCRINE', ingredient: name, severity: sev, evidence: [item?.source || 'INCI/SCCS'] });
      });
    }
    if (Array.isArray(ra.toxic_ingredients)) {
      ra.toxic_ingredients.forEach(item => {
        const name = (item?.ingredient || item?.name || item || '').toString();
        const sev = (item?.risk || item?.severity || 'medium').toString().toLowerCase();
        risks.push({ code: 'TOXICITY', ingredient: name, severity: sev, evidence: [item?.source || 'EFSA/ANSES'] });
      });
    }
    if (Array.isArray(allerg.detected)) {
      allerg.detected.forEach(name => {
        risks.push({ code: 'ALLERGEN', ingredient: String(name), severity: 'medium', evidence: [allerg?.source || 'REVIDAL/SCCS'] });
      });
    }
  } catch (_) {}
  return risks;
}

function mapHighlights(raw) {
  const arr = raw?.highlights || [];
  return arr.map(h => (typeof h === 'string' ? h : (h?.message || h?.title || JSON.stringify(h))));
}

function extractSources(raw) {
  const meta = raw?.meta || {};
  const src = meta.sources || [];
  return Array.isArray(src) ? src : [];
}

exports.analyzeCosmeticController = async (req, res) => {
  try {
    const { barcode, name, ingredients, inciList, language = 'fr' } = req.body || {};
    const list = normalizeIngredients(ingredients || inciList);
    if (!list.length) {
      return res.status(400).json({ success: false, error: 'INGREDIENTS_REQUIRED' });
    }

    const scorer = new CosmeticScorer();
    const raw = await scorer.analyzeCosmetic({
      name: name || 'Produit',
      ingredients: list.join(', ')
    });

    const value = Math.round(raw?.score ?? 0);
    const out = {
      id: crypto.randomUUID(),
      category: 'cosmetic',
      product: { name: name || 'Produit', barcode: barcode || null },
      score: { value, label: raw?.grade || labelFromScore(value) },
      risks: mapRisksFromCosmetic(raw),
      highlights: mapHighlights(raw),
      recommendations: Array.isArray(raw?.recommendations) ? raw.recommendations : [],
      sources: extractSources(raw),
      raw
    };

    logger.info('Cosmetic analyzed', { product: out?.product?.name, score: out?.score?.value });
    return res.json({ success: true, data: out });
  } catch (err) {
    logger.error('Cosmetic analysis failed', { error: err?.message });
    return res.status(500).json({ success: false, error: 'COSMETIC_ANALYSIS_FAILED', details: err?.message });
  }
};
'@ | Out-File -FilePath "backend\src\controllers\cosmeticController.js" -Encoding UTF8

# Controller Detergent
@'
// PATH: backend/src/controllers/detergentController.js
const crypto = require('crypto');
const { Logger } = require('../utils/logger');
const { DetergentScorer } = require('../scorers/detergent/detergentScorer');

const logger = new Logger('DetergentController');

function normalizeIngredients(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(s => String(s).toUpperCase().trim()).filter(Boolean);
  return String(input)
    .replace(/INGRÉDIENTS?|INGREDIENTS?\s*[:;-]?\s*/i, '')
    .replace(/\([^)]*\)/g, '')
    .split(/[,;]\s*|\n+/)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
}

function labelFromScore(v) {
  if (v >= 90) return 'A';
  if (v >= 75) return 'B';
  if (v >= 60) return 'C';
  if (v >= 40) return 'D';
  return 'E';
}

function mapRisksFromDetergent(raw) {
  const risks = [];
  try {
    const det = raw || {};
    const detected = det.detected_issues || [];
    detected.forEach(issue => {
      if (issue?.type && issue?.ingredient) {
        risks.push({
          code: String(issue.type).toUpperCase(),
          ingredient: issue.ingredient,
          severity: (issue.severity || 'medium').toLowerCase(),
          evidence: [issue.source || 'ECHA/CLP']
        });
      }
    });
    // Also surface ecotoxicity penalties as risks
    const eco = det.breakdown?.ecotoxicity?.penalties || [];
    eco.forEach(p => {
      risks.push({
        code: 'ECOTOX',
        ingredient: p.ingredient || 'unknown',
        severity: p.penalty <= -30 ? 'high' : p.penalty <= -15 ? 'mid' : 'low',
        evidence: [p.source || 'EU 648/2004']
      });
    });
  } catch (_) {}
  return risks;
}

exports.analyzeDetergentController = async (req, res) => {
  try {
    const { barcode, name, composition, ingredients, certifications = [], language = 'fr' } = req.body || {};
    const list = normalizeIngredients(composition || ingredients);
    if (!list.length) {
      return res.status(400).json({ success: false, error: 'COMPOSITION_OR_INGREDIENTS_REQUIRED' });
    }

    const scorer = new DetergentScorer();
    const raw = await scorer.analyzeDetergent(list, name || 'Produit ménager', certifications);

    const value = Math.round(raw?.score ?? 0);
    const out = {
      id: crypto.randomUUID(),
      category: 'detergent',
      product: { name: name || 'Produit ménager', barcode: barcode || null },
      score: { value, label: labelFromScore(value) },
      risks: mapRisksFromDetergent(raw),
      highlights: Array.isArray(raw?.insights) ? raw.insights.map(i => (i?.title || i?.content || JSON.stringify(i))) : [],
      recommendations: Array.isArray(raw?.alternatives) ? raw.alternatives.map(a => a?.title || a) : [],
      sources: ['REACH', 'ECHA 2024', 'EU Ecolabel'], // plus those in penalties
      raw
    };

    logger.info('Detergent analyzed', { product: out?.product?.name, score: out?.score?.value });
    return res.json({ success: true, data: out });
  } catch (err) {
    logger.error('Detergent analysis failed', { error: err?.message });
    return res.status(500).json({ success: false, error: 'DETERGENT_ANALYSIS_FAILED', details: err?.message });
  }
};
'@ | Out-File -FilePath "backend\src\controllers\detergentController.js" -Encoding UTF8

# 2.5 Créer les fichiers de configuration
Write-Host "`n📝 Création des fichiers de configuration..." -ForegroundColor Yellow

# .env.example à la racine
@'
# Root .env.example

# ---------- Backend ----------
NODE_ENV=development
PORT=5001
JWT_SECRET=change-me
JWT_EXPIRES=7d
CORS_ORIGINS=http://localhost:5173,https://frontendvf.netlify.app

MONGODB_URI=mongodb+srv://user:pass@cluster/dbname?retryWrites=true&w=majority

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/gcv-service-account.json

# Algolia
ALGOLIA_APP_ID=APPID
ALGOLIA_API_KEY=xxxx
ALGOLIA_INDEX=products

# LemonSqueezy
LEMONSQUEEZY_API_KEY=lsq_xxx
LEMONSQUEEZY_STORE_ID=xxxx
LEMONSQUEEZY_VARIANT_ID=xxxx
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_xxx
FRONTEND_BASE_URL=http://localhost:5173

# DeepSeek
DEEPSEEK_API_KEY=ds_xxx

# ---------- Frontend ----------
# Must include `/api` at the end
VITE_API_URL=http://localhost:5001/api
'@ | Out-File -FilePath ".env.example" -Encoding UTF8

# CI/CD
@'
name: CI

on:
  push:
    branches: [ "**" ]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint || true
      - run: npm test --silent

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build --if-present
'@ | Out-File -FilePath ".github\workflows\ci.yml" -Encoding UTF8

# 3. MISE À JOUR DU SERVER.JS
# ----------------------------
Write-Host "`n🔧 Mise à jour de server.js..." -ForegroundColor Yellow

# Sauvegarder l'original
Copy-Item "backend\src\server.js" "backend\src\server.js.backup" -Force

# Insérer les nouvelles routes dans server.js
$serverPath = "backend\src\server.js"
$serverContent = Get-Content $serverPath -Raw

# Chercher où insérer les nouvelles routes (après Vision)
$insertPoint = "loadRoute('Vision', './routes/vision.routes', '/api/vision');"
$newRoutes = @"
loadRoute('Vision', './routes/vision.routes', '/api/vision');

// Routes cosmétiques et détergents - NOUVEAU
loadRoute('Cosmetics', './routes/cosmetics.routes', '/api/cosmetics');
loadRoute('Detergents', './routes/detergents.routes', '/api/detergents');
"@

$serverContent = $serverContent -replace [regex]::Escape($insertPoint), $newRoutes
$serverContent | Out-File -FilePath $serverPath -Encoding UTF8

# 4. MISE À JOUR DU CHATSERVICE
# ------------------------------
Write-Host "`n🔧 Sauvegarde du ChatService existant..." -ForegroundColor Yellow

# Copier le nouveau ChatService depuis ton document
Copy-Item "frontend\src\services\chat\ChatService.ts" "frontend\src\services\chat\ChatService.ts.backup" -Force

# (Le ChatService amélioré a déjà été créé dans l'artifact précédent)

# 5. TESTS UNITAIRES
# ------------------
Write-Host "`n📝 Création des tests unitaires..." -ForegroundColor Yellow

# Test Cosmetic Controller
@'
// PATH: backend/src/__tests__/unit/cosmeticController.test.js
const { analyzeCosmeticController } = require('../../controllers/cosmeticController');

// Mock scorer module to avoid heavy computation
jest.mock('../../scorers/cosmetic/cosmeticScorer', () => {
  return function CosmeticScorer() {
    return {
      analyzeCosmetic: async () => ({
        score: 82,
        grade: 'B',
        highlights: ['Hydratation élevée'],
        recommendations: ['Éviter le parfum si peau sensible'],
        meta: { sources: ['INCI Database'] },
        risk_analysis: { endocrine_disruptors: [{ ingredient: 'BHT', risk: 'medium', source: 'EFSA' }], toxic_ingredients: [] },
        allergen_analysis: { detected: ['LIMONENE'], source: 'SCCS' }
      })
    };
  };
});

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => { res.statusCode = code; return res; };
  res.jsonPayload = null;
  res.json = (payload) => { res.jsonPayload = payload; return res; };
  return res;
}

describe('analyzeCosmeticController', () => {
  test('maps scorer output to normalized response', async () => {
    const req = { body: { name: 'Crème X', ingredients: 'AQUA, BHT, LIMONENE' } };
    const res = mockRes();

    await analyzeCosmeticController(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonPayload.success).toBe(true);
    const data = res.jsonPayload.data;
    expect(data.category).toBe('cosmetic');
    expect(data.score.value).toBe(82);
    expect(data.score.label).toBe('B');
    expect(Array.isArray(data.risks)).toBe(true);
    expect(data.sources).toContain('INCI Database');
  });

  test('returns 400 if no ingredients', async () => {
    const req = { body: {} };
    const res = mockRes();

    await analyzeCosmeticController(req, res);
    expect(res.statusCode).toBe(400);
  });
});
'@ | Out-File -FilePath "backend\src\__tests__\unit\cosmeticController.test.js" -Encoding UTF8

# 6. INSTALLATION DES DÉPENDANCES
# --------------------------------
Write-Host "`n📦 Installation des dépendances..." -ForegroundColor Green

# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install

cd $PROJECT_ROOT

# 7. DÉMARRAGE DES SERVICES
# --------------------------
Write-Host "`n🚀 Démarrage des services..." -ForegroundColor Green

# Ouvrir 2 terminaux PowerShell
Write-Host "`n📌 Ouvrir 2 nouveaux terminaux PowerShell et exécuter:" -ForegroundColor Cyan
Write-Host "Terminal 1 (Backend):" -ForegroundColor Yellow
Write-Host "cd '$PROJECT_ROOT\backend'"
Write-Host "npm run dev"
Write-Host ""
Write-Host "Terminal 2 (Frontend):" -ForegroundColor Yellow
Write-Host "cd '$PROJECT_ROOT\frontend'"
Write-Host "npm run dev"

# 8. TESTS API AVEC CURL
# ----------------------
Write-Host "`n🧪 Tests API (à exécuter après démarrage):" -ForegroundColor Green

# Test Health
Write-Host "`nTest Health:" -ForegroundColor Yellow
Write-Host 'curl http://localhost:5001/health'

# Test Cosmetics
Write-Host "`nTest Cosmetics:" -ForegroundColor Yellow
Write-Host @'
curl -X POST http://localhost:5001/api/cosmetics/analyze `
  -H "Content-Type: application/json" `
  -d '{"name":"Crème test","ingredients":"AQUA, GLYCERIN, LIMONENE"}'
'@

# Test Detergents
Write-Host "`nTest Detergents:" -ForegroundColor Yellow
Write-Host @'
curl -X POST http://localhost:5001/api/detergents/analyze `
  -H "Content-Type: application/json" `
  -d '{"name":"Lessive test","composition":"SODIUM LAURYL SULFATE"}'
'@

# 9. CRÉATION COLLECTION POSTMAN
# ------------------------------
Write-Host "`n📄 Création collection Postman..." -ForegroundColor Yellow

@'
{
  "info": {
    "name": "ECOLOJIA API - Cosmetics & Detergents",
    "_postman_id": "c5c8c1e8-0000-4000-9000-ecolojia",
    "description": "Collection pour tester les nouvelles routes d'analyse cosmétique et détergent, ainsi que le chat IA.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Cosmetics - Analyze",
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "url": { "raw": "{{base_url}}/api/cosmetics/analyze", "host": ["{{base_url}}"], "path": ["api","cosmetics","analyze"] },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Crème visage\",\n  \"ingredients\": \"AQUA, NIACINAMIDE, LIMONENE\",\n  \"language\": \"fr\"\n}"
        }
      }
    },
    {
      "name": "Detergents - Analyze",
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "url": { "raw": "{{base_url}}/api/detergents/analyze", "host": ["{{base_url}}"], "path": ["api","detergents","analyze"] },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Lessive\",\n  \"composition\": \"SODIUM LAURYL SULFATE, COCO GLUCOSIDE\",\n  \"language\": \"fr\"\n}"
        }
      }
    },
    {
      "name": "AI - Chat",
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "url": { "raw": "{{base_url}}/api/ai/chat", "host": ["{{base_url}}"], "path": ["api","ai","chat"] },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"message\": \"Conseils pour peau sensible ?\",\n  \"context\": {\"productName\":\"Crème visage\",\"healthScore\":82}\n}"
        }
      }
    }
  ],
  "variable": [
    { "key": "base_url", "value": "http://localhost:5001" }
  ]
}
'@ | Out-File -FilePath "docs\postman\ECOLOJIA.postman_collection.json" -Encoding UTF8

# 10. VÉRIFICATION FINALE
# -----------------------
Write-Host "`n✅ Checklist de vérification:" -ForegroundColor Green
Write-Host "[ ] Backend démarre sans erreur sur http://localhost:5001"
Write-Host "[ ] Frontend démarre sans erreur sur http://localhost:5173"
Write-Host "[ ] Route /api/cosmetics/analyze répond correctement"
Write-Host "[ ] Route /api/detergents/analyze répond correctement"
Write-Host "[ ] Chat IA fonctionne avec fallback intelligent"
Write-Host "[ ] Pas d'erreurs CORS entre frontend et backend"

# 11. COMMANDES GIT
# -----------------
Write-Host "`n📌 Commandes Git pour sauvegarder:" -ForegroundColor Cyan
Write-Host "git add ."
Write-Host 'git commit -m "feat: ajout analyses cosmétiques/détergents + chat IA amélioré"'
Write-Host "git push origin main"

# 12. TROUBLESHOOTING
# -------------------
Write-Host "`n⚠️ En cas de problème:" -ForegroundColor Red
Write-Host "1. Vérifier les logs du backend pour les erreurs"
Write-Host "2. Vérifier que MongoDB est accessible"
Write-Host "3. Vérifier les variables d'environnement (.env)"
Write-Host "4. S'assurer que les ports 5001 et 5173 sont libres"
Write-Host "5. Vérifier les imports dans les controllers"

Write-Host "`n🎉 Configuration terminée!" -ForegroundColor Green
Write-Host "Suivez les instructions ci-dessus pour démarrer et tester le projet."