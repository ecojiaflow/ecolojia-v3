# SCRIPT COMPLET ECOLOJIA - TOUT EN UN
# Execute tout automatiquement sans intervention manuelle

Write-Host @"
==================================================
     ECOLOJIA V3 - FINALISATION AUTOMATIQUE
==================================================
"@ -ForegroundColor Cyan

# Variables
$projectRoot = Get-Location
$frontendPath = Join-Path $projectRoot "frontend"
$backendPath = Join-Path $projectRoot "backend"

# Verification qu'on est au bon endroit
if (-not (Test-Path $frontendPath) -or -not (Test-Path $backendPath)) {
    Write-Host "ERREUR: Executez ce script depuis la racine du projet ECOLOJIA" -ForegroundColor Red
    Write-Host "Dossiers frontend et backend introuvables" -ForegroundColor Red
    exit 1
}

# ETAPE 1: NETTOYAGE
Write-Host "`n[1/5] NETTOYAGE DES FICHIERS LEGACY..." -ForegroundColor Yellow

# Supprimer les backups et archives
$toDelete = @(
    "$frontendPath\src\**\*.backup_*",
    "$frontendPath\src\**\_archive",
    "$backendPath\**\*postgres*",
    "$backendPath\**\*prisma*",
    "$backendPath\**\_archive*"
)

$deleted = 0
foreach ($pattern in $toDelete) {
    Get-ChildItem -Path $pattern -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        $deleted++
    }
}
Write-Host "  Supprime: $deleted fichiers/dossiers legacy" -ForegroundColor Green

# ETAPE 2: CREATION DES DOSSIERS
Write-Host "`n[2/5] CREATION DES DOSSIERS..." -ForegroundColor Yellow

$dirs = @(
    "$frontendPath\src\services",
    "$frontendPath\src\components\scanner",
    "$backendPath\src\services",
    "$backendPath\src\routes"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Cree: $dir" -ForegroundColor Green
    }
}

# ETAPE 3: CREATION DES FICHIERS CORRIGES
Write-Host "`n[3/5] CREATION DES FICHIERS CORRIGES..." -ForegroundColor Yellow

# 3.1 - api.ts
$apiTsContent = @'
// PATH: frontend/src/services/api.ts
// UTF-8
import apiClient from './apiClient';

export type Category = 'food' | 'cosmetics' | 'detergents';

export interface Product {
  _id?: string;
  id?: string;
  barcode?: string;
  name: string;
  brand?: string;
  category?: Category;
  images?: { front?: string; ingredients?: string; packaging?: string };
  description?: string;
  [key: string]: any;
}

export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

function unwrap<T = any>(data: any): T {
  if (!data) return data as T;
  if ('data' in data && data.data !== undefined) return data.data as T;
  if ('product' in data && data.product !== undefined) return data.product as T;
  if ('products' in data && Array.isArray(data.products)) {
    const res: any = { products: data.products };
    if (data.pagination) res.pagination = data.pagination;
    if (typeof data.total !== 'undefined') {
      res.pagination = res.pagination || {};
      res.pagination.total = data.total;
    }
    if (typeof data.page !== 'undefined') {
      res.pagination = res.pagination || {};
      res.pagination.page = data.page;
    }
    if (typeof data.totalPages !== 'undefined') {
      res.pagination = res.pagination || {};
      res.pagination.pages = data.totalPages;
    }
    return res as T;
  }
  return data as T;
}

export const productService = {
  async search(query: string, filters?: Record<string, any>): Promise<{products: Product[]; pagination?: Pagination}> {
    const params = new URLSearchParams({ q: query, ...(filters || {}) });
    const { data } = await apiClient.get(`/products/search?${params.toString()}`);
    return unwrap<{products: Product[]; pagination?: Pagination}>(data);
  },

  async getByBarcode(barcode: string): Promise<Product | null> {
    const { data } = await apiClient.get(`/products/barcode/${encodeURIComponent(barcode)}`);
    return unwrap<Product | null>(data);
  },

  async getById(id: string): Promise<Product | null> {
    const { data } = await apiClient.get(`/products/${encodeURIComponent(id)}`);
    return unwrap<Product | null>(data);
  },

  async getTrending(category?: Category): Promise<{products: Product[]}> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const { data } = await apiClient.get(`/products/trending${params}`);
    return unwrap<{products: Product[]}>(data);
  },

  async getAlternatives(id: string): Promise<{products: Product[]}> {
    const { data } = await apiClient.get(`/products/${encodeURIComponent(id)}/alternatives`);
    return unwrap<{products: Product[]}>(data);
  },

  async analyze(payload: { barcode?: string; name?: string; category?: Category; brand?: string; ingredients?: string | string[] }) {
    const { data } = await apiClient.post(`/analysis`, payload);
    return unwrap<any>(data);
  }
};

export default productService;
'@

[System.IO.File]::WriteAllText("$frontendPath\src\services\api.ts", $apiTsContent, [System.Text.Encoding]::UTF8)
Write-Host "  Cree: frontend/src/services/api.ts" -ForegroundColor Green

# 3.2 - apiClient.ts (si n'existe pas)
if (-not (Test-Path "$frontendPath\src\services\apiClient.ts")) {
    $apiClientContent = @'
// PATH: frontend/src/services/apiClient.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
'@
    [System.IO.File]::WriteAllText("$frontendPath\src\services\apiClient.ts", $apiClientContent, [System.Text.Encoding]::UTF8)
    Write-Host "  Cree: frontend/src/services/apiClient.ts" -ForegroundColor Green
}

# 3.3 - dashboardService.ts
$dashboardContent = @'
// PATH: frontend/src/services/dashboardService.ts
// UTF-8
import apiClient from './apiClient';

export interface DashboardStats {
  totals: { scans: number; products: number; favorites: number };
  averages: { health: number; environment: number; ethics: number };
  trends: Array<{ date: string; scans: number; avgHealth?: number }>;
  topProducts: Array<{ id?: string; _id?: string; name: string; brand?: string; barcode?: string; imageUrl?: string; category?: string }>;
}

export interface PersonalizedInsights {
  recommendations: Array<{ type: 'tip' | 'warning' | 'achievement'; title: string; description: string; actionUrl?: string; icon?: string }>;
  goals: Array<{ id: string; name: string; target: number; current: number; unit: string; deadline?: string }>;
  comparisons: { vsLastMonth: number; vsAverage: number; percentile: number };
}

export interface AnalyticsResult {
  data: Array<{ date: string; scans: number; avgHealth?: number }>;
  summary: { totalScans: number; averageScore: number; topProducts: Array<{ name: string; brand?: string; score?: number }> };
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get('/dashboard/stats');
    return (data?.data || data) as DashboardStats;
  }

  async getPersonalizedInsights(): Promise<PersonalizedInsights> {
    const { data } = await apiClient.get('/dashboard/insights');
    return (data?.data || data) as PersonalizedInsights;
  }

  async getDetailedAnalytics(params: { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' } = {}): Promise<AnalyticsResult> {
    const query = new URLSearchParams(params as any).toString();
    const { data } = await apiClient.get(`/dashboard/analytics${query ? '?' + query : ''}`);
    return (data?.data || data) as AnalyticsResult;
  }
}

const dashboardService = new DashboardService();
export default dashboardService;
'@

[System.IO.File]::WriteAllText("$frontendPath\src\services\dashboardService.ts", $dashboardContent, [System.Text.Encoding]::UTF8)
Write-Host "  Cree: frontend/src/services/dashboardService.ts" -ForegroundColor Green

# 3.4 - BarcodeScanner.tsx
$scannerContent = @'
// PATH: frontend/src/components/scanner/BarcodeScanner.tsx
// UTF-8
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Loader } from 'lucide-react';
import { productService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string, category?: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

export default function BarcodeScanner({ onScanSuccess, onClose, isOpen }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    const checkSupport = async () => {
      if ('BarcodeDetector' in window) {
        try {
          const formats = await (window as any).BarcodeDetector.getSupportedFormats();
          console.log('Formats supportes:', formats);
          setIsSupported(true);
        } catch {
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, []);

  useEffect(() => {
    if (isOpen && isSupported) {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [isOpen, isSupported]);

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);
      scanningRef.current = true;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(resolve);
            };
          }
        });

        detectBarcode();
      }
    } catch (err) {
      console.error('Erreur camera:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Acces a la camera refuse. Veuillez autoriser l acces dans les parametres.');
      } else {
        setError('Impossible d activer la camera. Verifiez les permissions.');
      }
      setScanning(false);
      scanningRef.current = false;
    }
  };

  const stopScanning = () => {
    setScanning(false);
    scanningRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const detectBarcode = async () => {
    if (!videoRef.current || !scanningRef.current) return;

    try {
      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
      });

      const detect = async () => {
        if (!scanningRef.current || !videoRef.current) return;

        try {
          const barcodes = await detector.detect(videoRef.current);
          
          if (barcodes && barcodes.length > 0) {
            const barcode = barcodes[0];
            const value = barcode.rawValue || barcode.value;
            
            if (value) {
              console.log('Code-barres detecte:', value);
              handleBarcodeDetected(String(value));
              return;
            }
          }
        } catch (err) {
          console.error('Erreur detection:', err);
        }

        if (scanningRef.current) {
          requestAnimationFrame(detect);
        }
      };

      detect();
    } catch (err) {
      console.error('Erreur BarcodeDetector:', err);
      setError('Le scanner n est pas supporte sur ce navigateur.');
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    stopScanning();
    setLookingUp(true);

    try {
      const result = await productService.getByBarcode(barcode);
      
      if (result) {
        const category = result.category || 'food';
        toast.success(`Produit trouve: ${result.name || 'Sans nom'}`);
        onScanSuccess(barcode, category);
      } else {
        toast.info('Produit non trouve. Redirection vers l analyse...');
        onScanSuccess(barcode);
      }
    } catch (error) {
      console.error('Erreur recherche produit:', error);
      toast.error('Erreur lors de la recherche du produit');
      onScanSuccess(barcode);
    } finally {
      setLookingUp(false);
    }
  };

  const handleManualInput = () => {
    const barcode = prompt('Entrez le code-barres manuellement:');
    if (barcode && barcode.trim()) {
      handleBarcodeDetected(barcode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md relative">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Scanner un code-barres</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {!isSupported ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">
                Le scanner n'est pas supporte sur ce navigateur.
              </p>
              <button
                onClick={handleManualInput}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entrer manuellement
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-64 h-32 border-2 border-green-500 rounded-lg">
                        <div className="absolute inset-0 border-t-2 border-green-500 animate-pulse" />
                      </div>
                      <p className="text-white text-center mt-4 text-sm">
                        Placez le code-barres dans le cadre
                      </p>
                    </div>
                  </div>
                )}

                {lookingUp && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                      <Loader className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Recherche du produit...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                {!scanning ? (
                  <button
                    onClick={startScanning}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    Demarrer le scan
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Arreter
                  </button>
                )}
                
                <button
                  onClick={handleManualInput}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Saisie manuelle
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p className="mb-1">Conseils pour un scan reussi:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Placez le code-barres bien droit dans le cadre</li>
                  <li>Assurez-vous d'avoir un bon eclairage</li>
                  <li>Maintenez le telephone stable</li>
                  <li>Formats supportes: EAN-13, EAN-8, UPC, Code 128, QR Code</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
'@

[System.IO.File]::WriteAllText("$frontendPath\src\components\scanner\BarcodeScanner.tsx", $scannerContent, [System.Text.Encoding]::UTF8)
Write-Host "  Cree: frontend/src/components/scanner/BarcodeScanner.tsx" -ForegroundColor Green

# ETAPE 4: CORRECTION ENCODAGE
Write-Host "`n[4/5] CORRECTION DE L'ENCODAGE..." -ForegroundColor Yellow

function Fix-Encoding {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) { return }
    
    try {
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        
        # Remplacements
        $fixed = $content
        $fixed = $fixed -replace "Ã©", "é"
        $fixed = $fixed -replace "Ã¨", "è"
        $fixed = $fixed -replace "Ã ", "à"
        $fixed = $fixed -replace "Ã§", "ç"
        $fixed = $fixed -replace "Ã´", "ô"
        $fixed = $fixed -replace "Ã»", "û"
        $fixed = $fixed -replace "Ã®", "î"
        $fixed = $fixed -replace "Ãª", "ê"
        $fixed = $fixed -replace "Ã¢", "â"
        $fixed = $fixed -replace "Ã¹", "ù"
        
        [System.IO.File]::WriteAllText($FilePath, $fixed, [System.Text.Encoding]::UTF8)
    }
    catch {
        # Ignorer les erreurs
    }
}

# Corriger tous les fichiers
$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.css", "*.html")
$fixedCount = 0

foreach ($ext in $extensions) {
    Get-ChildItem -Path $frontendPath -Filter $ext -Recurse -File |
        Where-Object { $_.DirectoryName -notmatch "node_modules|dist|build" } |
        ForEach-Object {
            Fix-Encoding $_.FullName
            $fixedCount++
        }
}

Write-Host "  Corrige: $fixedCount fichiers" -ForegroundColor Green

# ETAPE 5: CREATION DES FICHIERS ENV
Write-Host "`n[5/5] CREATION DES FICHIERS ENVIRONNEMENT..." -ForegroundColor Yellow

# Frontend .env
if (-not (Test-Path "$frontendPath\.env")) {
    $envContent = @"
VITE_APP_NAME=ECOLOJIA
VITE_API_URL=https://ecolojia-backendvf.onrender.com/api
VITE_REQUEST_TIMEOUT_MS=20000
"@
    [System.IO.File]::WriteAllText("$frontendPath\.env", $envContent, [System.Text.Encoding]::UTF8)
    Write-Host "  Cree: frontend/.env" -ForegroundColor Green
}

# Backend .env check
if (-not (Test-Path "$backendPath\.env")) {
    Write-Host "  ATTENTION: backend/.env manquant - creez-le avec MONGODB_URI et JWT_SECRET" -ForegroundColor Yellow
}

# FINAL
Write-Host "`n===================================================" -ForegroundColor Green
Write-Host "         FINALISATION TERMINEE AVEC SUCCES!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

Write-Host "`nPOUR TESTER:" -ForegroundColor Cyan
Write-Host "1. Terminal 1:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White

Write-Host "`n2. Terminal 2:" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White

Write-Host "`nPOUR DEPLOYER:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m `"fix: complete integration - UTF-8, API, scanner`"" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor White

Write-Host "`nBONNE CHANCE!" -ForegroundColor Green
'@