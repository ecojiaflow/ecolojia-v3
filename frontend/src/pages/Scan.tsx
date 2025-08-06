import React, { useState } from 'react';
import { Camera, Barcode, Search, AlertCircle, Loader2, Upload, X } from 'lucide-react';

type ScanMode = 'barcode' | 'photo' | 'manual';

interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
}

// Composant BarcodeScanner intégré
const BarcodeScanner = ({ onScanSuccess, onError }: any) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const handleManualSubmit = () => {
    if (manualCode.length >= 8) {
      onScanSuccess(manualCode);
    } else {
      onError('Code-barres invalide');
    }
  };

  return (
    <div className="text-center">
      <div className="bg-gray-100 rounded-lg p-8 mb-4">
        <Barcode className="h-24 w-24 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Scanner de code-barres</p>
        <p className="text-xs text-gray-500 mt-2">Camera non disponible dans cette démo</p>
      </div>
      
      <div className="mt-6">
        <p className="text-sm text-gray-600 mb-2">Ou entrez le code manuellement :</p>
        <div className="flex gap-2 max-w-xs mx-auto">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ex: 8000500037466"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={handleManualSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant PhotoCapture intégré
const PhotoCapture = ({ onCapture, onError }: any) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      onError(new Error('Fichier trop volumineux (max 10MB)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setTimeout(() => onCapture(file), 500);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setPreview(null);
  };

  if (preview) {
    return (
      <div className="relative">
        <img src={preview} alt="Preview" className="w-full h-auto max-h-96 object-contain rounded-lg" />
        <button
          onClick={reset}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
    >
      <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-green-500' : 'text-gray-400'}`} />
      <p className="mt-2 text-sm text-gray-600">
        Glissez-déposez une photo du produit ici
      </p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
      >
        Choisir un fichier
      </label>
    </div>
  );
};

// Composant ManualSearch intégré
const ManualSearch = ({ onSubmit }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'food',
    ingredients: '',
    barcode: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du produit *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder="Ex: Nutella 400g"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marque
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder="Ex: Ferrero"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          >
            <option value="food">Alimentaire</option>
            <option value="cosmetic">Cosmétique</option>
            <option value="detergent">Produit ménager</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ingrédients
          </label>
          <textarea
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            placeholder="Liste des ingrédients..."
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700"
        >
          Analyser le produit
        </button>
      </div>
    </div>
  );
};

// Composant principal ScanPage
export default function ScanPage() {
  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    error: null
  });

  // Simulation des handlers (à remplacer par les vrais appels API)
  const handleBarcodeScanned = async (barcode: string) => {
    setAnalysisState({
      isAnalyzing: true,
      progress: 20,
      currentStep: 'Recherche du produit...',
      error: null
    });

    // Simuler l'analyse
    setTimeout(() => {
      console.log('Barcode scanned:', barcode);
      setAnalysisState({
        isAnalyzing: false,
        progress: 100,
        currentStep: '',
        error: null
      });
      alert(`Produit trouvé ! Code: ${barcode}`);
    }, 2000);
  };

  const handlePhotoCapture = async (file: File) => {
    setAnalysisState({
      isAnalyzing: true,
      progress: 10,
      currentStep: 'Upload de l\'image...',
      error: null
    });

    // Simuler l'analyse OCR
    let progress = 10;
    const interval = setInterval(() => {
      progress += 20;
      setAnalysisState(prev => ({
        ...prev,
        progress: Math.min(progress, 90),
        currentStep: progress < 50 ? 'Upload de l\'image...' : 'Analyse en cours...'
      }));
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      console.log('Photo analyzed:', file.name);
      setAnalysisState({
        isAnalyzing: false,
        progress: 100,
        currentStep: '',
        error: null
      });
      alert(`Image analysée : ${file.name}`);
    }, 3000);
  };

  const handleManualSearch = async (data: any) => {
    setAnalysisState({
      isAnalyzing: true,
      progress: 50,
      currentStep: 'Analyse du produit...',
      error: null
    });

    // Simuler l'analyse
    setTimeout(() => {
      console.log('Manual search:', data);
      setAnalysisState({
        isAnalyzing: false,
        progress: 100,
        currentStep: '',
        error: null
      });
      alert(`Produit analysé : ${data.name}`);
    }, 1500);
  };

  const scanMethods = [
    { id: 'barcode' as ScanMode, label: 'Code-barres', icon: Barcode },
    { id: 'photo' as ScanMode, label: 'Photo', icon: Camera },
    { id: 'manual' as ScanMode, label: 'Manuel', icon: Search }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Scanner un produit</h1>

        {/* Sélecteur de mode */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-sm">
          {scanMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setScanMode(method.id)}
              disabled={analysisState.isAnalyzing}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
                scanMode === method.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${analysisState.isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <method.icon className="h-5 w-5" />
              <span className="font-medium">{method.label}</span>
            </button>
          ))}
        </div>

        {/* Zone de scan */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {!analysisState.isAnalyzing ? (
            <div>
              {scanMode === 'barcode' && (
                <BarcodeScanner
                  onScanSuccess={handleBarcodeScanned}
                  onError={(error: string) => setAnalysisState({ ...analysisState, error })}
                />
              )}

              {scanMode === 'photo' && (
                <PhotoCapture
                  onCapture={handlePhotoCapture}
                  onError={(error: Error) => setAnalysisState({ ...analysisState, error: error.message })}
                />
              )}

              {scanMode === 'manual' && (
                <ManualSearch onSubmit={handleManualSearch} />
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {analysisState.currentStep}
              </p>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysisState.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {analysisState.progress}%
              </p>
            </div>
          )}

          {/* Erreurs */}
          {analysisState.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{analysisState.error}</p>
                <button
                  onClick={() => setAnalysisState({ ...analysisState, error: null })}
                  className="text-sm text-red-600 hover:text-red-500 mt-1 font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Conseils */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Conseils</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {scanMode === 'barcode' && (
              <>
                <li>• Placez le code-barres dans le cadre</li>
                <li>• Assurez-vous d'avoir un bon éclairage</li>
                <li>• Gardez votre appareil stable</li>
              </>
            )}
            {scanMode === 'photo' && (
              <>
                <li>• Prenez en photo la face avant du produit</li>
                <li>• Le nom et les ingrédients doivent être visibles</li>
                <li>• Évitez les reflets et les ombres</li>
              </>
            )}
            {scanMode === 'manual' && (
              <>
                <li>• Entrez le nom exact du produit</li>
                <li>• Ajoutez la liste des ingrédients si possible</li>
                <li>• Sélectionnez la bonne catégorie</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}