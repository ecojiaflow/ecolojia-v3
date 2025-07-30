import express from 'express';
import { ProductCreateSchema } from './types';
import prisma from '../lib/prisma';
import axios from 'axios';

const router = express.Router();

// Middleware to validate API key
const validateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

router.post('/', validateApiKey, async (req: express.Request, res: express.Response) => {
  try {
    // Validate request body
    const validatedData = ProductCreateSchema.parse(req.body);
    
    // Create product in database
    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        currency: validatedData.currency,
        ethicalScore: 0, // Will be updated by AI enrichment
        affiliateLink: validatedData.affiliate_url,
        category: validatedData.category,
        tags: validatedData.tags,
        certifications: validatedData.certifications
      }
    });

    // Send to n8n webhook for AI enrichment
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await axios.post(process.env.N8N_WEBHOOK_URL, {
          productId: product.id,
          name: product.name,
          description: product.description,
          lang: validatedData.lang,
          zones_dispo: validatedData.zones_dispo
        });
      } catch (error) {
        console.error('Failed to send product to n8n webhook:', error);
        // Don't fail the request if webhook fails
      }
    }

    res.status(201).json(product);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;