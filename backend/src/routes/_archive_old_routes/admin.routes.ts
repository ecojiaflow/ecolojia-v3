// PATH: backend/src/routes/admin.routes.ts
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ðŸ” DonnÃ©es simulÃ©es (temporaire)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const logs = [
  {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    status: 'success',
    productsProcessed: 25,
    productsSuccess: 23,
    productsFailed: 2,
    duration: 63,
    fileName: 'openfood-2025-07-17.json.gz'
  }
];

const products = [...Array(10)].map((_, i) => ({
  id: uuidv4(),
  title: `Produit ${i + 1}`,
  slug: `produit-${i + 1}`,
  category: ['alimentaire', 'cosmetic', 'detergent'][i % 3],
  brand: 'Marque DÃ©mo',
  eco_score: Math.floor(Math.random() * 100),
  ai_confidence: Math.floor(Math.random() * 20 + 70),
  confidence_color: ['green', 'orange', 'red'][i % 3] as 'green' | 'orange' | 'red',
  verified_status: 'pending',
  created_at: new Date().toISOString(),
  image_url: 'https://via.placeholder.com/64'
}));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ðŸ“Š /dashboard
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalProducts: 10421,
      totalImports: 19,
      lastImportDate: new Date().toISOString(),
      successRate: 92.5,
      averageConfidence: 84.2,
      productsByCategory: {
        alimentaire: 8800,
        cosmetic: 1021,
        detergent: 600
      },
      recentActivity: [
        { date: '2025-07-16', action: 'import', count: 2300 },
        { date: '2025-07-15', action: 'scan', count: 112 },
        { date: '2025-07-14', action: 'delete', count: 7 }
      ]
    }
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ðŸ“¦ /recent-products
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/recent-products', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  res.json({ success: true, data: products.slice(0, limit) });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ðŸ“„ /import-logs
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/import-logs', (req, res) => {
  res.json({ success: true, data: logs });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ðŸš€ /trigger-import
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/trigger-import', (req, res) => {
  const importId = uuidv4();
  console.log(`ðŸ§  Simulation import dÃ©clenchÃ©e ID: ${importId}`);
  res.json({ success: true, data: { message: 'Import simulÃ© lancÃ©', importId } });
});

export default router;
// EOF
