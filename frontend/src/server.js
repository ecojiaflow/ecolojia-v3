require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'ecolojia-secret-2024';

// Configuration Multer pour upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté'));
    }
  }
});

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas connecté'))
  .catch(err => console.log('❌ MongoDB erreur:', err.message));

// Middleware Auth
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.userId || decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ========== ROUTES HEALTH ==========
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ECOLOJIA Backend Running',
    version: '2.0',
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      vision: 'ready',
      analysis: 'ready'
    }
  });
});

// ========== ROUTES AUTH ==========
app.post('/api/auth/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  // Pour le test, créer un utilisateur fake
  const user = {
    id: Date.now().toString(),
    email,
    firstName,
    lastName,
    tier: 'free',
    quotas: { scansUsed: 0, scansLimit: 30 }
  };
  
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    success: true,
    user,
    token,
    accessToken: token
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Login simplifié pour tests
  if (email && password) {
    const user = {
      id: '123',
      userId: '123',
      email,
      tier: 'free',
      quotas: { scansUsed: 5, scansLimit: 30 }
    };
    
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      user,
      token,
      accessToken: token
    });
  } else {
    res.status(400).json({ error: 'Email et password requis' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

// ========== ROUTES VISION (OCR) ==========
app.post('/api/vision/analyze-image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    // Simuler une analyse OCR
    const jobId = 'job-' + Date.now();
    
    res.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Analyse lancée'
    });

    // Simuler le résultat après 2 secondes
    setTimeout(() => {
      global.ocrResults = global.ocrResults || {};
      global.ocrResults[jobId] = {
        status: 'completed',
        result: {
          productId: 'prod-' + Date.now(),
          extractedData: {
            name: 'Nutella 400g',
            brand: 'Ferrero',
            ingredients: 'Sucre, huile de palme, noisettes 13%, cacao maigre, lait écrémé en poudre',
            category: 'food'
          },
          confidence: 0.92
        }
      };
    }, 2000);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vision/status/:jobId', authMiddleware, (req, res) => {
  const { jobId } = req.params;
  const result = global.ocrResults?.[jobId];
  
  if (result) {
    res.json({
      success: true,
      jobId,
      ...result
    });
  } else {
    res.json({
      success: true,
      jobId,
      status: 'processing'
    });
  }
});

// ========== ROUTES ANALYSE ==========
app.post('/api/analysis/barcode', authMiddleware, async (req, res) => {
  const { barcode } = req.body;
  
  // Base de produits de test
  const products = {
    '8000500037466': {
      name: 'Nutella 400g',
      brand: 'Ferrero',
      novaGroup: 4,
      nutriScore: 'E',
      healthScore: 25
    },
    '5449000000996': {
      name: 'Coca-Cola',
      brand: 'Coca-Cola Company',
      novaGroup: 4,
      nutriScore: 'E',
      healthScore: 15
    }
  };
  
  const product = products[barcode] || {
    name: `Produit ${barcode}`,
    brand: 'Marque inconnue',
    novaGroup: 3,
    nutriScore: 'C',
    healthScore: 50
  };
  
  res.json({
    success: true,
    data: {
      productId: 'prod-' + barcode,
      barcode,
      ...product,
      ingredients: ['Ingrédient 1', 'Ingrédient 2'],
      additives: [
        { code: 'E330', name: 'Acide citrique', risk: 'low' }
      ],
      allergens: [],
      environmentScore: 60,
      ethicsScore: 55,
      overallScore: 50
    }
  });
});

app.post('/api/analysis/manual', authMiddleware, async (req, res) => {
  const { name, ingredients, category } = req.body;
  
  // Analyse simulée
  const novaGroup = ingredients?.includes('huile de palme') ? 4 : 3;
  const healthScore = Math.floor(Math.random() * 50) + 30;
  
  res.json({
    success: true,
    data: {
      productId: 'prod-manual-' + Date.now(),
      name,
      category,
      novaGroup,
      nutriScore: novaGroup === 4 ? 'D' : 'C',
      healthScore,
      ingredients: ingredients?.split(',').map(i => i.trim()) || [],
      additives: [],
      allergens: [],
      environmentScore: 65,
      ethicsScore: 70,
      overallScore: 60
    }
  });
});

app.get('/api/analysis/:productId', authMiddleware, async (req, res) => {
  const { productId } = req.params;
  
  // Retourner des données de test
  res.json({
    success: true,
    data: {
      productId,
      name: 'Produit Test',
      brand: 'Marque Test',
      novaGroup: 3,
      nutriScore: 'C',
      healthScore: 65,
      environmentScore: 70,
      ethicsScore: 60,
      overallScore: 65,
      ingredients: ['Ingrédient 1', 'Ingrédient 2'],
      additives: [],
      allergens: []
    }
  });
});

// ========== ROUTES DASHBOARD ==========
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  const { range = 'month' } = req.query;
  
  res.json({
    success: true,
    data: {
      overview: {
        totalScans: 45,
        monthlyScans: 12,
        averageScore: 72,
        trendsUp: true
      },
      recentScans: [
        {
          id: '1',
          productName: 'Nutella',
          scanDate: new Date(),
          healthScore: 25,
          novaGroup: 4
        }
      ],
      categoryBreakdown: [
        { category: 'food', count: 30, percentage: 66.7 },
        { category: 'cosmetic', count: 10, percentage: 22.2 },
        { category: 'detergent', count: 5, percentage: 11.1 }
      ],
      healthScoreTrend: [
        { date: '2024-01', score: 65 },
        { date: '2024-02', score: 68 },
        { date: '2024-03', score: 72 }
      ],
      quotaUsage: {
        used: req.user.quotas?.scansUsed || 12,
        limit: req.user.quotas?.scansLimit || 30,
        percentage: 40
      }
    }
  });
});

// ========== ROUTES QUOTA ==========
app.get('/api/quota/status', authMiddleware, (req, res) => {
  res.json({
    quotas: {
      scansUsed: 12,
      scansLimit: 30,
      scansRemaining: 18,
      aiQuestionsUsed: 2,
      aiQuestionsLimit: 5,
      aiQuestionsRemaining: 3
    }
  });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║           ECOLOJIA Backend V2.0                    ║
╠════════════════════════════════════════════════════╣
║  🚀 Server:     http://localhost:${PORT}            ║
║  📊 Status:     Running (Full Mode)                ║
║  🔧 Features:   All endpoints active               ║
║  📸 OCR:        Simulation mode                    ║
║  🔍 Analysis:   Test data mode                     ║
╚════════════════════════════════════════════════════╝
  `);
});

// Store OCR results in memory
global.ocrResults = {};
