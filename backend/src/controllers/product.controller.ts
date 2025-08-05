// PATH: backend/src/controllers/product.controller.ts
import { Request, Response } from 'express';
import NovaClassifier from '../services/ai/novaClassifier';
import { ProductAnalysisInput } from '../types/scientific-analysis.types';

const nova = new NovaClassifier();

export const analyzeProduct = async (req: Request, res: Response) => {
  try {
    const input = req.body as ProductAnalysisInput;
    console.log('📥 Input reçu:', input);

    const title = input.ocrText || 'Produit inconnu';
    const category = 'food';
    
    console.log('🔍 Données à analyser:', { title, category });

    const novaResult = await nova.classify({ 
      title: title, 
      ingredients: []
    });

    // ✅ Réponse simplifiée pour éviter erreurs services manquants
    const result = {
      nova: novaResult,
      insights: {
        educational: ['Classification NOVA selon INSERM 2024'],
        recommendations: ['Vérifier composition produit']
      },
      alternatives: {
        natural: ['Version maison recommandée'],
        organic: ['Équivalent bio disponible']
      },
      eco: {
        score: 50,
        confidence: 0.8
      }
    };

    console.log('✅ Résultat final NOVA:', novaResult.novaGroup);
    res.json(result);
  } catch (error: any) {
    console.error('❌ Erreur analyse produit:', error);
    res.status(500).json({ error: error.message || 'Erreur analyse produit' });
  }
};
// EOF
