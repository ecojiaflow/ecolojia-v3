import { Router } from 'express';
import { analyzeAutoSvc } from '../services/analyzeService';

const router = Router();

router.post('/auto', async (req, res) => {
  try {
    const { barcode, name, ingredients, category } = req.body || {};
    if (!category) return res.status(400).json({ error: 'category required' });
    const data = await analyzeAutoSvc({ barcode, name, ingredients, category });
    res.json(data);
  } catch (e:any) {
    console.error('analyze/auto', e);
    res.status(500).json({ error: 'analysis_failed' });
  }
});

export default router;
