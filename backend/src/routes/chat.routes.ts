import { Router } from 'express';
import { deepseekChat } from '../controllers/deepseek.controller';

const router = Router();

router.get('/health', (_req, res) => {
  const enabled = process.env.ENABLE_CHAT === '1';
  const provider = process.env.AI_PROVIDER || 'none';
  res.json({
    status: enabled ? 'ready' : 'disabled',
    provider,
    modelHints: ['deepseek-chat']
  });
});

router.post('/deepseek', deepseekChat);

export default router;
