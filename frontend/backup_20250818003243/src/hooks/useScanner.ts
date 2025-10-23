import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanService, ScanResult, ScanError } from '../services/scanService';

export type ScanMode = 'barcode' | 'photo' | 'manual';

interface UseScannerState {
  mode: ScanMode;
  loading: boolean;
  error: ScanError | null;
  result: ScanResult | null;
  progress: number;
  status: string;
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

  const scanBarcode = useCallback(async (code: string) => {
    setState(prev => ({ ...prev, loading: true, error: null, status: 'Recherche du produit...' }));
    
    try {
      const result = await scanService.scanBarcode(code);
      setState(prev => ({
        ...prev,
        loading: false,
        result,
        status: 'Produit trouve !'
      }));
      
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

  const analyzePhoto = useCallback(async (file: File, useOCR: boolean = false) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      progress: 10,
      status: 'Upload de l\'image...' 
    }));
    
    try {
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
        status: 'Analyse terminee !'
      }));
      
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

  const searchProducts = useCallback(async (query: string, categorya: string) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      status: 'Recherche en cours...'
    }));
    
    try {
      const result = await scanService.searchProducts(query, { category });
      setState(prev => ({
        ...prev,
        loading: false,
        result,
        status: `${result.products?.length || 0} produits trouves`
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as ScanError
      }));
    }
  }, [scanService]);

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
    ...state,
    setMode,
    scanBarcode,
    analyzePhoto,
    searchProducts,
    reset,
    isScanning: state.loading,
    hasResult: !!state.result,
    hasError: !!state.error
  };
}



