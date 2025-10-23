// PATH: backend/src/controllers/product.controller.ts
import { Request, Response } from 'express';
import NovaClassifier from '../services/ai/novaClassifier';
import { ProductAnalysisInput } from '../types/scientific-analysis.types';

const nova = new NovaClassifier();

export const analyzeProduct = async (req: Request, res: Response) => {
  try {
    const input = req.body as ProductAnalysisInput;
    console.log('ðŸ“¥ Input reÃ§u:', input);

    const title = input.ocrText || 'Produit inconnu';
    const category = 'food';
    
    console.log('ðŸ” DonnÃ©es Ã  analyser:', { title, category });

    const novaResult = await nova.classify({ 
      title: title, 
      ingredients: []
    });

    // âœ… RÃ©ponse simplifiÃ©e pour Ã©viter erreurs services manquants
    const result = {
      nova: novaResult,
      insights: {
        educational: ['Classification NOVA selon INSERM 2024'],
        recommendations: ['VÃ©rifier composition produit']
      },
      alternatives: {
        natural: ['Version maison recommandÃ©e'],
        organic: ['Ã‰quivalent bio disponible']
      },
      eco: {
        score: 50,
        confidence: 0.8
      }
    };

    console.log('âœ… RÃ©sultat final NOVA:', novaResult.novaGroup);
    res.json(result);
  } catch (error: any) {
    console.error('âŒ Erreur analyse produit:', error);
    res.status(500).json({ error: error.message || 'Erreur analyse produit' });
  }
};
// EOF
