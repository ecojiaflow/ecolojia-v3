// src/services/aiAnalysisService.ts
// Service FRONTEND pour gérer l'historique et les analyses côté client

interface AnalysisHistory {
  product: {
    name: string;
    brand?: string;
    category: 'food' | 'cosmetics' | 'detergents';
    barcode?: string;
  };
  analysis: {
    healthScore: number;
    category: string;
    recommendations: string[];
  };
  timestamp?: Date;
}

class AIAnalysisService {
  private readonly HISTORY_KEY = 'ecolojia_analysis_history';
  private readonly API_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com/api';

  // Méthodes localStorage (pour mode offline/demo)
  async getHistory(limit: number = 50): Promise<AnalysisHistory[]> {
    try {
      const historyStr = localStorage.getItem(this.HISTORY_KEY);
      if (!historyStr) return [];
      
      const history = JSON.parse(historyStr) as AnalysisHistory[];
      return history.slice(0, limit);
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  async saveToHistory(analysis: AnalysisHistory): Promise<void> {
    try {
      const history = await this.getHistory(100);
      const newHistory = [analysis, ...history].slice(0, 100);
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  async clearHistory(): Promise<void> {
    localStorage.removeItem(this.HISTORY_KEY);
  }

  // Méthodes API (pour production)
  async analyzeWithAI(productData: any): Promise<any> {
    try {
      const response = await fetch(`${this.API_URL}/analyze/auto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        throw new Error('Erreur analyse');
      }

      const result = await response.json();
      
      // Sauvegarder dans l'historique local aussi
      await this.saveToHistory({
        product: productData,
        analysis: result,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      throw error;
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();