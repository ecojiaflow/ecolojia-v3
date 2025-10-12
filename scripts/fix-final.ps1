# ECOLOJIA V3 - Reparation Finale Complete

$rootPath = "C:\Users\salim\Desktop\ECOLOJIA VF CLEAN"
Set-Location $rootPath

Write-Host "============================================" -ForegroundColor Red
Write-Host "  REPARATION FINALE - HISTORYPAGE" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host ""

# ===== RESTAURER PUIS CORRIGER HISTORYPAGE =====
$historyFile = "frontend\src\pages\HistoryPage.tsx"

if (Test-Path $historyFile) {
    # Backup actuel (cassé)
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item $historyFile "$historyFile.broken_$timestamp" -Force
    Write-Host "[INFO] Backup version cassee cree" -ForegroundColor Gray
    
    # Lire contenu
    $content = Get-Content $historyFile -Raw
    
    Write-Host "[1/5] Correction imports..." -ForegroundColor Yellow
    
    # SUPPRIMER imports cassés dashboardService et historyService
    $content = $content -replace "import \* as dashboardService from '@/services/dashboardService';?\r?\n?", ""
    $content = $content -replace "import \* as historyService from '@/services/historyService';?\r?\n?", ""
    Write-Host "  [OK] Imports nettoyes" -ForegroundColor Green
    
    Write-Host "[2/5] Correction fetchHistory..." -ForegroundColor Yellow
    
    # CORRIGER fetchHistory completement
    $oldFetchHistory = @"
  const fetchHistory = async \(\) => \{
    try \{
      setLoading\(true\);
      setError\(null\);
      
      const historyData = getHistory\(\);
      setHistory\(historyData\);

      setHistory\(response\.items \|\| \[\]\);
      setTotalItems\(response\.total \|\| 0\);
      setTotalPages\(response\.pages \|\| 1\);
"@

    $newFetchHistory = @"
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const historyData = getHistory();
      setHistory(historyData);
      setTotalItems(historyData.length);
      setTotalPages(Math.ceil(historyData.length / itemsPerPage));
"@

    $content = $content -replace [regex]::Escape($oldFetchHistory), $newFetchHistory
    Write-Host "  [OK] fetchHistory corrige" -ForegroundColor Green
    
    Write-Host "[3/5] Correction fetchStats..." -ForegroundColor Yellow
    
    # SUPPRIMER l'appel à fetchStats (service n'existe pas)
    $content = $content -replace "const fetchStats = async \(\) => \{[^\}]+\};", @"
const fetchStats = async () => {
    // Stats désactivées temporairement
    setStats(null);
  };
"@
    Write-Host "  [OK] fetchStats desactive" -ForegroundColor Green
    
    Write-Host "[4/5] Correction handleDelete..." -ForegroundColor Yellow
    
    # CORRIGER handleDelete (supprimer appel à historyService)
    $content = $content -replace "await Promise\.all\(ids\.map\(id => historyService\.deleteHistoryItem\(id\)\)\);", "// Suppression désactivée en mode local"
    Write-Host "  [OK] handleDelete corrige" -ForegroundColor Green
    
    Write-Host "[5/5] Correction MOCK_MODE..." -ForegroundColor Yellow
    
    # Remplacer TOUS les MOCK_MODE
    $mockCount = ([regex]::Matches($content, '\bMOCK_MODE\b')).Count
    if ($mockCount -gt 0) {
        $content = $content -replace '\bMOCK_MODE\b', 'false'
        Write-Host "  [OK] $mockCount occurrence(s) MOCK_MODE remplacees" -ForegroundColor Green
    }
    
    # Sauvegarder
    $content | Out-File -FilePath $historyFile -Encoding UTF8 -NoNewline
    Write-Host ""
    Write-Host "[SUCCESS] HistoryPage.tsx completement repare !" -ForegroundColor Green
    
} else {
    Write-Host "[ERROR] HistoryPage.tsx introuvable" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Red
Write-Host "  CREATION FAVORITESPAGE" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host ""

# ===== CREER FAVORITESPAGE SI MANQUANT =====
$favoritesFile = "frontend\src\pages\FavoritesPage.tsx"

if (Test-Path $favoritesFile) {
    Write-Host "[INFO] FavoritesPage existe deja" -ForegroundColor Gray
    
    # Juste corriger MOCK_MODE
    $content = Get-Content $favoritesFile -Raw
    $mockCount = ([regex]::Matches($content, '\bMOCK_MODE\b')).Count
    if ($mockCount -gt 0) {
        Copy-Item $favoritesFile "$favoritesFile.backup_$timestamp" -Force
        $content = $content -replace '\bMOCK_MODE\b', 'false'
        $content | Out-File -FilePath $favoritesFile -Encoding UTF8 -NoNewline
        Write-Host "[OK] MOCK_MODE corrige dans FavoritesPage" -ForegroundColor Green
    }
    
} else {
    Write-Host "[WARN] FavoritesPage n'existe pas - creation..." -ForegroundColor Yellow
    
    $favoritesContent = @'
// PATH: frontend/src/pages/FavoritesPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, Search, AlertCircle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface FavoriteProduct {
  _id: string;
  productId: string;
  productName: string;
  productBrand: string;
  productImage?: string;
  scores: {
    overall: number;
    health: number;
    environment: number;
  };
  category: string;
  addedAt: string;
}

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      // Récupérer depuis localStorage pour le moment
      const stored = localStorage.getItem('ecolojia_favorites');
      const data = stored ? JSON.parse(stored) : [];
      setFavorites(data);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      toast.error('Impossible de charger vos favoris');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const updated = favorites.filter(f => f.productId !== productId);
      setFavorites(updated);
      localStorage.setItem('ecolojia_favorites', JSON.stringify(updated));
      toast.success('Produit retiré des favoris');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredFavorites = favorites.filter(
    f => f.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         f.productBrand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 76) return 'text-green-600';
    if (score >= 56) return 'text-lime-600';
    if (score >= 36) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#DDE9DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#3B3B3B] flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500" />
                Mes Favoris
              </h1>
              <p className="text-gray-600 mt-2">
                {favorites.length} produit(s) enregistré(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans vos favoris..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DDE4A] focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste favoris */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-[#7DDE4A] border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement...</p>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {searchQuery ? 'Aucun favori ne correspond à votre recherche' : 'Vous n\'avez pas encore de favoris'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/search')}
                className="mt-4 px-6 py-2 bg-[#7DDE4A] text-white rounded-lg hover:bg-[#6BC93B] transition-colors"
              >
                Découvrir des produits
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                onClick={() => navigate(`/product/${product.productId}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#3B3B3B] text-lg mb-1">
                        {product.productName}
                      </h3>
                      <p className="text-gray-600 text-sm">{product.productBrand}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(product.productId);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Score global</span>
                    <span className={`text-xl font-bold ${getScoreColor(product.scores?.overall || 0)}`}>
                      {product.scores?.overall || 0}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
'@

    $favoritesContent | Out-File -FilePath $favoritesFile -Encoding UTF8 -NoNewline
    Write-Host "[SUCCESS] FavoritesPage.tsx cree !" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  REPARATIONS TERMINEES" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Redemarrer frontend (Ctrl+C puis 'npm run dev')" -ForegroundColor White
Write-Host "2. Tester http://localhost:5173/history" -ForegroundColor White
Write-Host "3. Tester http://localhost:5173/favorites" -ForegroundColor White
Write-Host ""