import { Router } from 'express';
import multer from 'multer';
import { extractTextFromImage } from '../services/vision';

const upload = multer();
const router = Router();

router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    const { image } = req.body;
    let buffer: Buffer | null = null;

    if (req.file) buffer = req.file.buffer;
    else if (image && typeof image === 'string') {
      const base64 = image.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64, 'base64');
    }
    if (!buffer) return res.status(400).json({ error: 'image_required' });

    const data = await extractTextFromImage(buffer);
    res.json(data);
  } catch (e:any) {
    console.error('vision/analyze-image', e);
    res.status(500).json({ error: 'vision_failed' });
  }
});

export default router;
