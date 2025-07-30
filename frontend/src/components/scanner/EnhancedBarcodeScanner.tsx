// PATH: frontend/ecolojiaFrontV3/src/components/scanner/EnhancedBarcodeScanner.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, RotateCw, Zap, Upload, Eye, CheckCircle, AlertTriangle, FlashOff, Flash } from 'lucide-react';
import { universalSearchEngine } from '../../services/search/UniversalSearchService';
import { analyzePhotos } from '../../api/realApi';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface EnhancedBarcodeScannerProps {
  onScanSuccess: (barcode: string, productData?: any) => void;
  onClose: () => void;
  isOpen: boolean;
  allowPhotoFallback?: boolean;
  allowManualEntry?: boolean;
}

interface ScanResult {
  type: 'barcode' | 'ocr' | 'manual';
  data: string;
  confidence: number;
  productInfo?: any;
}

interface OCRResult {
  text: string;
  confidence: number;
  ingredients?: string[];
  detectedBarcode?: string;
}

// ============================================================================
// DETECTION ENGINES
// ============================================================================

class BarcodeDetectionEngine {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private isScanning = false;
  private scanCount = 0;
  private consecutiveDetections: { [code: string]: number } = {};
  private animationFrameId: number | null = null;

  async initialize(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<boolean> {
    this.video = videoElement;
    this.canvas = canvasElement;

    try {
      console.log('🎥 Initialisation caméra...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { min: 640, ideal: 1920, max: 1920 },
          height: { min: 480, ideal: 1080, max: 1080 }
        }
      });

      this.video.srcObject = this.stream;
      
      return new Promise((resolve) => {
        this.video!.onloadedmetadata = async () => {
          try {
            await this.video!.play();
            console.log('✅ Caméra initialisée');
            resolve(true);
          } catch (playError) {
            console.error('❌ Erreur play caméra:', playError);
            resolve(false);
          }
        };
        
        this.video!.onerror = () => {
          console.error('❌ Erreur caméra');
          resolve(false);
        };
      });

    } catch (error) {
      console.error('❌ Erreur initialisation caméra:', error);
      return false;
    }
  }

  async startScanning(onDetection: (barcode: string, confidence: number) => void): Promise<void> {
    if (!this.video || !this.canvas || this.isScanning) return;

    this.isScanning = true;
    this.scanCount = 0;
    this.consecutiveDetections = {};

    console.log('🔍 Démarrage scan code-barres...');

    const scanFrame = () => {
      if (!this.isScanning || !this.video || !this.canvas) return;

      try {
        // Capturer frame vidéo
        const context = this.canvas.getContext('2d');
        if (!context) return;

        // Redimensionner canvas selon vidéo
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        // Dessiner frame courante
        context.drawImage(this.video, 0, 0);

        // Simuler détection de code-barres (en réalité, utiliser une lib comme QuaggaJS)
        const detectedBarcode = this.simulateBarcodeDetection(context);
        
        if (detectedBarcode) {
          const { barcode, confidence } = detectedBarcode;
          
          // Confirmer détection multiple
          if (this.consecutiveDetections[barcode]) {
            this.consecutiveDetections[barcode]++;
          } else {
            this.consecutiveDetections[barcode] = 1;
          }

          // Déclencher callback si détection confirmée
          if (this.consecutiveDetections[barcode] >= 3) {
            console.log('✅ Code-barres détecté:', barcode);
            onDetection(barcode, confidence);
            this.stopScanning();
            return;
          }
        }

        this.scanCount++;
        
        // Continuer scan
        this.animationFrameId = requestAnimationFrame(scanFrame);

      } catch (error) {
        console.error('❌ Erreur scan frame:', error);
      }
    };

    // Démarrer boucle de scan
    this.animationFrameId = requestAnimationFrame(scanFrame);
  }

  private simulateBarcodeDetection(context: CanvasRenderingContext2D): { barcode: string; confidence: number } | null {
    // SIMULATION : En production, remplacer par vraie lib de détection
    // Comme QuaggaJS, ZXing, ou @zxing/library
    
    if (this.scanCount % 60 === 0) { // Simulation toutes les 60 frames
      // Codes-barres de test
      const testBarcodes = [
        '3017620425035', // Nutella
        '7622210074164', // Toblerone
        '3029330003533', // Lu Petit Beurre
        '8712100849718', // Produit test
      ];
      
      const randomBarcode = testBarcodes[Math.floor(Math.random() * testBarcodes.length)];
      const confidence = 0.85 + Math.random() * 0.15; // 85-100%
      
      return { barcode: randomBarcode, confidence };
    }
    
    return null;
  }

  stopScanning(): void {
    this.isScanning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('🛑 Scan arrêté');
  }

  cleanup(): void {
    this.stopScanning();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.video = null;
    this.canvas = null;
    
    console.log('🧹 Scanner nettoyé');
  }

  async toggleFlash(): Promise<boolean> {
    if (!this.stream) return false;
    
    try {
      const videoTrack = this.stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      
      if (capabilities.torch) {
        const constraints = { advanced: [{ torch: !videoTrack.getSettings().torch }] };
        await videoTrack.applyConstraints(constraints);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️ Flash non supporté:', error);
      return false;
    }
  }
}

// ============================================================================
// OCR ENGINE (FALLBACK)
// ============================================================================

class OCREngine {
  async extractTextFromImage(imageFile: File): Promise<OCRResult> {
    try {
      console.log('🔍 Extraction OCR depuis image...');
      
      // Utiliser l'API existante
      const analysisResult = await analyzePhotos([imageFile]);
      
      if (analysisResult && analysisResult.extracted_text) {
        const extractedText = analysisResult.extracted_text;
        
        // Rechercher code-barres dans le texte
        const barcodeMatch = extractedText.match(/\b\d{8,13}\b/);
        const detectedBarcode = barcodeMatch ? barcodeMatch[0] : undefined;
        
        // Extraire ingrédients potentiels
        const ingredients = this.extractIngredients(extractedText);
        
        return {
          text: extractedText,
          confidence: 0.7,
          ingredients,
          detectedBarcode
        };
      }
      
      throw new Error('Aucun texte extrait');
      
    } catch (error) {
      console.error('❌ Erreur OCR:', error);
      throw error;
    }
  }

  private extractIngredients(text: string): string[] {
    // Rechercher patterns d'ingrédients
    const ingredientPatterns = [
      /ingrédients?\s*:?\s*([^.]+)/gi,
      /composition\s*:?\s*([^.]+)/gi,
      /ingredients?\s*:?\s*([^.]+)/gi
    ];
    
    const ingredients: string[] = [];
    
    for (const pattern of ingredientPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const ingredientList = match.split(':')[1]?.trim();
          if (ingredientList) {
            const individualIngredients = ingredientList
              .split(/[,;]/)
              .map(ing => ing.trim())
              .filter(ing => ing.length > 2);
            
            ingredients.push(...individualIngredients);
          }
        });
      }
    }
    
    return [...new Set(ingredients)]; // Dédupliquer
  }
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const EnhancedBarcodeScanner: React.FC<EnhancedBarcodeScannerProps> = ({
  onScanSuccess,
  onClose,
  isOpen,
  allowPhotoFallback = true,
  allowManualEntry = true
}) => {
  // ========== STATE ==========
  const [scanState, setScanState] = useState<'idle' | 'initializing' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'photo' | 'manual'>('camera');
  const [manualBarcode, setManualBarcode] = useState('');
  const [detectedText, setDetectedText] = useState<string>('');
  
  // ========== REFS ==========
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeEngineRef = useRef<BarcodeDetectionEngine | null>(null);
  const ocrEngineRef = useRef<OCREngine | null>(null);

  // ========== EFFECTS ==========
  
  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      cleanup();
    }
    
    return cleanup;
  }, [isOpen]);

  // ========== SCANNER METHODS ==========

  const initializeScanner = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setScanState('initializing');
    setError(null);

    try {
      // Vérifier support caméra
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Caméra non supportée par ce navigateur');
      }

      // Initialiser moteurs
      barcodeEngineRef.current = new BarcodeDetectionEngine();
      ocrEngineRef.current = new OCREngine();

      // Initialiser caméra
      const cameraInitialized = await barcodeEngineRef.current.initialize(
        videoRef.current,
        canvasRef.current
      );

      if (cameraInitialized) {
        setHasCamera(true);
        setScanState('scanning');
        startScanning();
      } else {
        throw new Error('Impossible d\'initialiser la caméra');
      }

    } catch (err) {
      console.error('❌ Erreur initialisation scanner:', err);
      setError(err instanceof Error ? err.message : 'Erreur initialisation scanner');
      setScanState('error');
      setHasCamera(false);
    }
  }, []);

  const startScanning = useCallback(async () => {
    if (!barcodeEngineRef.current) return;

    try {
      await barcodeEngineRef.current.startScanning(async (barcode, confidence) => {
        setScanState('processing');
        
        try {
          console.log('🔍 Code-barres détecté, recherche produit...');
          
          // Rechercher produit via moteur universel
          const productInfo = await universalSearchEngine.searchByBarcode(barcode);
          
          setScanState('success');
          onScanSuccess(barcode, productInfo);
          
        } catch (searchError) {
          console.warn('⚠️ Produit non trouvé, mais code-barres valide:', searchError);
          setScanState('success');
          onScanSuccess(barcode, null); // Transmettre code-barres même si produit non trouvé
        }
      });
    } catch (err) {
      setError('Erreur démarrage scan');
      setScanState('error');
    }
  }, [onScanSuccess]);

  const handlePhotoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ocrEngineRef.current) return;

    setScanState('processing');

    try {
      const ocrResult = await ocrEngineRef.current.extractTextFromImage(file);
      setDetectedText(ocrResult.text);

      if (ocrResult.detectedBarcode) {
        // Code-barres détecté dans l'image
        console.log('📊 Code-barres détecté via OCR:', ocrResult.detectedBarcode);
        
        const productInfo = await universalSearchEngine.searchByBarcode(ocrResult.detectedBarcode);
        setScanState('success');
        onScanSuccess(ocrResult.detectedBarcode, productInfo);
        
      } else {
        // Pas de code-barres, mais texte détecté
        setScanState('idle');
        setScanMode('manual');
        alert(`Texte détecté :\n${ocrResult.text.substring(0, 200)}...\n\nVeuillez saisir manuellement le code-barres.`);
      }

    } catch (err) {
      setError('Erreur analyse photo');
      setScanState('error');
    }
  }, [onScanSuccess]);

  const handleManualSubmit = useCallback(async () => {
    if (!manualBarcode.trim()) return;

    setScanState('processing');

    try {
      const productInfo = await universalSearchEngine.searchByBarcode(manualBarcode);
      setScanState('success');
      onScanSuccess(manualBarcode, productInfo);
    } catch (err) {
      setError('Code-barres invalide ou produit non trouvé');
      setScanState('error');
    }
  }, [manualBarcode, onScanSuccess]);

  const toggleFlash = useCallback(async () => {
    if (barcodeEngineRef.current) {
      const flashToggled = await barcodeEngineRef.current.toggleFlash();
      if (flashToggled) {
        setFlashEnabled(!flashEnabled);
      }
    }
  }, [flashEnabled]);

  const cleanup = useCallback(() => {
    if (barcodeEngineRef.current) {
      barcodeEngineRef.current.cleanup();
      barcodeEngineRef.current = null;
    }
    setScanState('idle');
    setError(null);
    setHasCamera(false);
  }, []);

  // ========== RENDER ==========

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <h2 className="text-lg font-semibold">Scanner Code-barres</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corps principal */}
        <div className="relative w-full h-full">
          {scanMode === 'camera' ? (
            <>
              {/* Vue caméra */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              
              {/* Canvas pour traitement */}
              <canvas
                ref={canvasRef}
                className="hidden"
              />

              {/* Overlay scan */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Cadre de scan */}
                  <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                    <div className="absolute inset-0 border-4 border-transparent">
                      {/* Coins animés */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                    </div>
                    
                    {/* Ligne de scan animée */}
                    {scanState === 'scanning' && (
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-500 animate-pulse"></div>
                    )}
                  </div>

                  {/* Instructions */}
                  <p className="text-white text-center mt-4">
                    {scanState === 'initializing' && 'Initialisation caméra...'}
                    {scanState === 'scanning' && 'Pointez vers le code-barres'}
                    {scanState === 'processing' && 'Traitement...'}
                    {scanState === 'success' && '✅ Code-barres détecté !'}
                    {scanState === 'error' && '❌ Erreur de scan'}
                  </p>
                </div>
              </div>

              {/* Contrôles caméra */}
              <div className="absolute bottom-20 left-0 right-0 flex justify-center space-x-4">
                <button
                  onClick={toggleFlash}
                  className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                >
                  {flashEnabled ? <Flash className="w-6 h-6" /> : <FlashOff className="w-6 h-6" />}
                </button>
                
                <button
                  onClick={() => setScanMode('photo')}
                  className="p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                >
                  <Upload className="w-6 h-6" />
                </button>
              </div>
            </>
          ) : scanMode === 'photo' ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8">
              <Upload className="w-16 h-16 mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Analyser une photo</h3>
              <p className="text-gray-300 text-center mb-6">
                Prenez une photo du code-barres ou de la liste d'ingrédients
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanState === 'processing'}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-500 transition-all mb-4"
              >
                {scanState === 'processing' ? 'Analyse en cours...' : 'Choisir une photo'}
              </button>
              
              <button
                onClick={() => setScanMode('camera')}
                className="px-4 py-2 text-gray-300 hover:text-white transition-all"
              >
                ← Retour au scanner
              </button>
              
              {detectedText && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg max-w-full">
                  <h4 className="font-semibold mb-2">Texte détecté :</h4>
                  <p className="text-sm text-gray-300">{detectedText.substring(0, 200)}...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8">
              <Eye className="w-16 h-16 mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Saisie manuelle</h3>
              <p className="text-gray-300 text-center mb-6">
                Entrez le code-barres manuellement
              </p>
              
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Code-barres (8-13 chiffres)"
                className="w-full max-w-xs px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-green-500 focus:outline-none mb-4"
              />
              
              <button
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim() || scanState === 'processing'}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-500 transition-all mb-4"
              >
                {scanState === 'processing' ? 'Recherche...' : 'Rechercher produit'}
              </button>
              
              <button
                onClick={() => setScanMode('camera')}
                className="px-4 py-2 text-gray-300 hover:text-white transition-all"
              >
                ← Retour au scanner
              </button>
            </div>
          )}
        </div>

        {/* Bottom tabs */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setScanMode('camera')}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                scanMode === 'camera' ? 'text-green-500' : 'text-gray-400'
              }`}
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs">Scanner</span>
            </button>
            
            {allowPhotoFallback && (
              <button
                onClick={() => setScanMode('photo')}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  scanMode === 'photo' ? 'text-green-500' : 'text-gray-400'
                }`}
              >
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs">Photo</span>
              </button>
            )}
            
            {allowManualEntry && (
              <button
                onClick={() => setScanMode('manual')}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  scanMode === 'manual' ? 'text-green-500' : 'text-gray-400'
                }`}
              >
                <Eye className="w-6 h-6 mb-1" />
                <span className="text-xs">Manuel</span>
              </button>
            )}
          </div>
        </div>

        {/* Erreur overlay */}
        {error && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="bg-red-600 text-white p-6 rounded-lg max-w-sm mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 mr-2" />
                <h3 className="font-semibold">Erreur</h3>
              </div>
              <p className="mb-4">{error}</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setError(null);
                    setScanState('idle');
                    initializeScanner();
                  }}
                  className="px-4 py-2 bg-white text-red-600 rounded hover:bg-gray-100 transition-all"
                >
                  Réessayer
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedBarcodeScanner;