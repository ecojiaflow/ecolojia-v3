// frontend/src/services/scanService.ts
import axios from 'axios';

// Configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com';
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL || 'https://api.cloudinary.com/v1_1/dma0ywmfb/image/upload';
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ecolojia_unsigned';

// Types
export interface ScanResult {
  productId?: string;
  product?: any;
  analysis?: any;
  products?: any[]; // Pour la recherche manuelle
  confidence?: number;
  extractedData?: {
    name?: string;
    ingredients?: string;
    brand?: string;
    category?: string;
  };
}

export interface ScanError {
  code: string;
  message: string;
  details?: any;
}

// Service principal
export class ScanService {
  private static instance: ScanService;

  static getInstance(): ScanService {
    if (!ScanService.instance) {
      ScanService.instance = new ScanService();
    }
    return ScanService.instance;
  }

  // Scan par code-barres
  async scanBarcode(code: string): Promise<ScanResult> {
    try {
      // Essayer d'abord de récupérer le produit
      const response = await axios.get(`${API_URL}/api/products/barcode/${code}`);
      
      if (response.data.product) {
        return {
          productId: response.data.product._id,
          product: response.data.product,
          confidence: 1.0
        };
      }
      
      // Si pas trouvé, lancer une analyse
      const analysisResponse = await axios.post(`${API_URL}/api/analysis`, {
        barcode: code,
        method: 'barcode',
        source: 'web'
      });
      
      return analysisResponse.data;
    } catch (error: any) {
      throw this.handleError(error, 'BARCODE_SCAN_FAILED');
    }
  }

  // Analyse par photo
  async analyzePhoto(file: File, useOCR: boolean = false): Promise<ScanResult> {
    try {
      // 1. Upload vers Cloudinary
      const imageUrl = await this.uploadToCloudinary(file);
      
      // 2. Choisir l'endpoint selon le mode
      const endpoint = useOCR ? '/api/vision/analyze-image' : '/api/analysis';
      
      // 3. Analyser l'image
      const response = await axios.post(`${API_URL}${endpoint}`, {
        imageUrl,
        method: 'photo',
        source: 'web',
        category: 'food', // À détecter automatiquement plus tard
        extractText: useOCR
      });
      
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'PHOTO_ANALYSIS_FAILED');
    }
  }

  // Recherche manuelle
  async searchProducts(query: string, options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ScanResult> {
    try {
      const response = await axios.get(`${API_URL}/api/products/search`, {
        params: {
          q: query,
          ...options
        }
      });
      
      return {
        products: response.data.products || [],
        confidence: response.data.confidence || 0.8
      };
    } catch (error: any) {
      throw this.handleError(error, 'SEARCH_FAILED');
    }
  }

  // Upload vers Cloudinary
  private async uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    formData.append('folder', 'ecolojia/products');
    
    try {
      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data.secure_url;
    } catch (error) {
      throw new Error('Échec de l\'upload de l\'image');
    }
  }

  // Gestion des erreurs
  private handleError(error: any, code: string): ScanError {
    return {
      code,
      message: error.response?.data?.message || error.message || 'Une erreur est survenue',
      details: error.response?.data
    };
  }

  // Méthode pour valider un code-barres
  static isValidBarcode(code: string): boolean {
    // Validation basique : 8, 12 ou 13 chiffres
    return /^(\d{8}|\d{12}|\d{13})$/.test(code);
  }

  // Méthode pour détecter la catégorie d'un produit à partir de son nom
  static detectCategory(productName: string): string {
    const categories = {
      food: ['yaourt', 'lait', 'pain', 'pâtes', 'riz', 'chocolat', 'biscuit', 'céréales'],
      cosmetic: ['crème', 'shampoing', 'savon', 'dentifrice', 'déodorant', 'parfum'],
      detergent: ['lessive', 'liquide vaisselle', 'nettoyant', 'javel']
    };
    
    const lowerName = productName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    
    return 'food'; // Par défaut
  }
}

// Hook personnalisé pour React
// frontend/src/hooks/useScanner.ts
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanService, ScanResult, ScanError } from '../services/scanService';

export type ScanMode = 'barcode' | 'photo' | 'manual';

interface UseScannerState {
  mode: ScanMode;
  loading: boolean;
  error: ScanError | null;
  result: ScanResult | null;
  progress: number; // 0-100
  status: string; // Message de statut
}

export function useScanner() {
  const navigate = useNavigate();
  const scanService = ScanService.getInstance();
  
  const [state, setState] = useState<UseScannerState>({
    mode: 'barcode',
    loading: false,
    error: null,
    result: null,
    progress: 0,
    status: ''
  });

  // Changer de mode
  const setMode = useCallback((mode: ScanMode) => {
    setState(prev => ({
      ...prev,
      mode,
      error: null,
      result: null,
      progress: 0,
      status: ''
    }));
  }, []);

  // Scanner un code-barres
  const scanBarcode = useCallback(async (code: string) => {
    if (!ScanService.isValidBarcode(code)) {
      setState(prev => ({
        ...prev,
        error: {
          code: 'INVALID_BARCODE',
          message: 'Code-barres invalide. Vérifiez le format.'
        }
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, status: 'Recherche du produit...' }));
    
    try {
      const result = await scanService.scanBarcode(code);
      
      setState(prev => ({
        ...prev,
        loading: false,
        result,
        status: 'Produit trouvé !'
      }));
      
      // Redirection automatique si produit trouvé
      if (result.productId) {
        setTimeout(() => {
          navigate(`/product/${result.productId}`);
        }, 1000);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as ScanError
      }));
    }
  }, [scanService, navigate]);

  // Analyser une photo
  const analyzePhoto = useCallback(async (file: File, useOCR: boolean = false) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      progress: 10,
      status: 'Upload de l\'image...' 
    }));
    
    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 80)
        }));
      }, 300);

      const result = await scanService.analyzePhoto(file, useOCR);
      
      clearInterval(progressInterval);
      
      setState(prev => ({
        ...prev,
        loading: false,
        result,
        progress: 100,
        status: 'Analyse terminée !'
      }));
      
      // Redirection si produit identifié
      if (result.productId) {
        setTimeout(() => {
          navigate(`/product/${result.productId}`);
        }, 1000);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as ScanError,
        progress: 0
      }));
    }
  }, [scanService, navigate]);

  // Recherche manuelle
  const searchProducts = useCallback(async (query: string, category?: string) => {
    if (query.trim().length < 2) {
      setState(prev => ({
        ...prev,
        error: {
          code: 'QUERY_TOO_SHORT',
          message: 'Entrez au moins 2 caractères'
        }
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      status: 'Recherche en cours...'
    }));
    
    try {
      const detectedCategory = category || ScanService.detectCategory(query);
      const result = await scanService.searchProducts(query, { 
        category: detectedCategory,
        limit: 10 
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        result,
        status: `${result.products?.length || 0} produits trouvés`
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as ScanError
      }));
    }
  }, [scanService]);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      loading: false,
      error: null,
      result: null,
      progress: 0,
      status: ''
    }));
  }, []);

  return {
    // État
    ...state,
    
    // Actions
    setMode,
    scanBarcode,
    analyzePhoto,
    searchProducts,
    reset,
    
    // Helpers
    isScanning: state.loading,
    hasResult: !!state.result,
    hasError: !!state.error
  };
}