import React, { useState, useCallback, useRef } from 'react';
import { Camera, Search, Barcode, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// Configuration API
const API_URL = 'https://ecolojia-backendvf.onrender.com';
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dma0ywmfb/image/upload';
const CLOUDINARY_PRESET = 'ecolojia_unsigned';

// Types
type ScanMode = 'barcode' | 'photo' | 'manual';

interface ScanResult {
  productId?: string;
  product?: any;
  analysis?: any;
  confidence?: number;
  error?: string;
}

interface ScanState {
  mode: ScanMode;
  loading: boolean;
  error: string | null;
  success: boolean;
  result: ScanResult | null;
}

// Hook personnalisÃ© pour gÃ©rer le scan
const useScanner = () => {
  const [state, setState] = useState<ScanState>({
    mode: 'barcode',
    loading: false,
    error: null,
    success: false,
    result: null
  });

  const resetState = () => {
    setState(prev => ({
      ...prev,
      loading: false,
      error: null,
      success: false,
      result: null
    }));
  };

  const handleBarcodeScanned = async (code: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`${API_URL}/api/products/barcode/${code}`);
      const data = await response.json();
      
      if (response.ok && data.product) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          success: true,
          result: data 
        }));
        
        // Redirection aprÃ¨s 1 seconde
        setTimeout(() => {
          window.location.href = `/product/${data.product._id}`;
        }, 1000);
      } else {
        throw new Error(data.message || 'Produit non trouvÃ©');
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Erreur lors du scan du code-barres'
      }));
    }
  };

  const handlePhotoAnalysis = async (file: File) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // 1. Upload vers Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_PRESET);

      const cloudinaryRes = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData
      });
      const cloudinaryData = await cloudinaryRes.json();
      const imageUrl = cloudinaryData.secure_url;

      // 2. Analyse via backend
      const analysisRes = await fetch(`${API_URL}/api/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl,
          method: 'photo',
          source: 'web',
          category: 'food'
        })
      });
      const analysisData = await analysisRes.json();

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        success: true,
        result: analysisData 
      }));

      // Si un produit est identifiÃ©, rediriger
      if (analysisData.productId) {
        setTimeout(() => {
          window.location.href = `/product/${analysisData.productId}`;
        }, 1000);
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Erreur lors de l\'analyse de l\'image'
      }));
    }
  };

  const handleManualSearch = async (query: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`${API_URL}/api/algolia/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (response.ok && data.products && data.products.length > 0) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          success: true,
          result: { products: data.products }
        }));
      } else {
        throw new Error('Aucun produit trouvÃ©');
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Erreur lors de la recherche'
      }));
    }
  };

  return {
    state,
    setState,
    resetState,
    handleBarcodeScanned,
    handlePhotoAnalysis,
    handleManualSearch
  };
};

// Composants des diffÃ©rents modes
const BarcodeScanner: React.FC<{ onScan: (code: string) => void }> = ({ onScan }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [manualCode, setManualCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
        <Barcode className="w-16 h-16 mx-auto mb-4 text-green-600" />
        <p className="text-gray-700 mb-4">
          Scannez le code-barres avec votre camÃ©ra ou entrez-le manuellement
        </p>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors opacity-50 cursor-not-allowed" disabled>
          Activer la camÃ©ra (bientÃ´t disponible)
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ou entrez le code-barres manuellement :
          </label>
          <input
            ref={inputRef}
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ex: 3017620422003"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            pattern="[0-9]*"
            maxLength={13}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!manualCode.trim()}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Rechercher le produit
        </button>
      </div>
    </div>
  );
};

const PhotoCapture: React.FC<{ onCapture: (file: File) => void }> = ({ onCapture }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      onCapture(file);
    }
  };

  const resetCapture = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 text-center cursor-pointer hover:shadow-lg transition-shadow"
        >
          <Camera className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <p className="text-gray-700 mb-2">Prenez une photo du produit</p>
          <p className="text-sm text-gray-500">Cliquez pour choisir une image</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden">
            <img src={preview} alt="AperÃ§u" className="w-full h-64 object-cover" />
            <button
              onClick={resetCapture}
              className="absolute top-2 right-2 bg-white/80 p-2 rounded-full hover:bg-white transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleAnalyze}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Analyser cette image
          </button>
        </div>
      )}
    </div>
  );
};

const ManualSearch: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
        <Search className="w-16 h-16 mx-auto mb-4 text-purple-600" />
        <p className="text-gray-700">
          Recherchez un produit par son nom, sa marque ou ses ingrÃ©dients
        </p>
      </div>
      
      <div className="space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: Nutella, Coca Cola, yaourt nature..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          onClick={handleSubmit}
          disabled={!query.trim()}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Rechercher
        </button>
      </div>
    </div>
  );
};

// Composant principal
export default function ScanPage() {
  const { 
    state, 
    setState, 
    resetState,
    handleBarcodeScanned, 
    handlePhotoAnalysis, 
    handleManualSearch 
  } = useScanner();

  const renderContent = () => {
    if (state.loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mb-4" />
          <p className="text-gray-600">Analyse en cours...</p>
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <p className="text-red-800">{state.error}</p>
              <button
                onClick={resetState}
                className="text-red-600 underline text-sm mt-1"
              >
                RÃ©essayer
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (state.success) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800">Produit trouvÃ© ! Redirection...</p>
          </div>
        </div>
      );
    }

    // Affichage des rÃ©sultats de recherche manuelle
    if (state.result?.products) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">RÃ©sultats de recherche :</h3>
          {state.result.products.map((product: any) => (
            <div
              key={product._id}
              onClick={() => window.location.href = `/product/${product._id}`}
              className="bg-white border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
            >
              <h4 className="font-medium">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.brand}</p>
              {product.nutriscore && (
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Nutri-Score: {product.nutriscore}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Contenu principal selon le mode
    switch (state.mode) {
      case 'barcode':
        return <BarcodeScanner onScan={handleBarcodeScanned} />;
      case 'photo':
        return <PhotoCapture onCapture={handlePhotoAnalysis} />;
      case 'manual':
        return <ManualSearch onSearch={handleManualSearch} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Scanner un produit
        </h1>

        {/* SÃ©lecteur de mode */}
        <div className="flex gap-2 mb-6">
          {[
            { mode: 'barcode' as ScanMode, icon: Barcode, label: 'Code-barres' },
            { mode: 'photo' as ScanMode, icon: Camera, label: 'Photo' },
            { mode: 'manual' as ScanMode, icon: Search, label: 'Recherche' }
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => {
                setState(prev => ({ ...prev, mode }));
                resetState();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
                state.mode === mode
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Contenu dynamique */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {renderContent()}
        </div>

        {/* Aide contextuelle */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            {state.mode === 'barcode' && "Le code-barres se trouve gÃ©nÃ©ralement au dos du produit"}
            {state.mode === 'photo' && "Prenez une photo claire du produit, de prÃ©fÃ©rence de face"}
            {state.mode === 'manual' && "Entrez le nom exact ou des mots-clÃ©s du produit"}
          </p>
        </div>
      </div>
    </div>
  );
}

