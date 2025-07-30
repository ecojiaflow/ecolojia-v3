import express from 'express';
import { ProductUpdateSchema } from '../types';
import prisma from '../../lib/prisma';

const router = express.Router();

router.put('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const validatedData = ProductUpdateSchema.parse(req.body);

    // Determine confidence color based on percentage
    let confidence_color = '🔴'; // Default red
    if (validatedData.confidence_pct >= 70) {
      confidence_color = '🟢';
    } else if (validatedData.confidence_pct >= 50) {
      confidence_color = '🟡';
    }

    // Determine verification status based on confidence
    const verification_status = validatedData.confidence_pct >= 50 ? 'verified' : 'manual_review';

    // Update product in database
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        resume_fr: validatedData.resume_fr,
        resume_en: validatedData.resume_en,
        ethicalScore: validatedData.eco_score,
        confidence_pct: validatedData.confidence_pct,
        confidence_color,
        criteria_score: validatedData.criteria_score,
        verification_status,
        suggested_by_ai: true,
        updatedAt: new Date()
      }
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }

    res.status(500).json({ 
      error: 'Failed to update product',
      details: error.message 
    });
  }
});

export default router;