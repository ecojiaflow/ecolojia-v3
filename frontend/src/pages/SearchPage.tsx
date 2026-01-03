import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Package, Loader2, AlertCircle } from 'lucide-react';
import { useDeviceContext } from '../hooks/useDeviceContext';

/**
 * ECOLOJIA SearchPage V2.0 — Philosophie Ecolojia
 * 
 * Pas un moteur de decouverte. Un outil utilitaire pour :
 * 1. Retrouver un produit specifique
 * 2. Acceder rapidement a sa Constitution
 * 3. Comprendre en 10 secondes quoi faire
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com';

interface SearchResult {
  _id: string;
  barcode: string;
  name: string;
  brand: string;
  categoryType: string;
  subcategory: string;
  image: string | null;
  score: number | null;
  level: number | null;
  levelLabel: string | null;
}

interface SearchResponse {
  success: boolean;
  query: string;
  method: string;
  total: number;
  count: number;
  products: SearchResult[];
  error?: string;
}

// Couleurs et labels selon le niveau (philosophie Ecolojia)
const getLevelStyle = (level: number | null) => {
  switch (level) {
    case 1:
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500'
      };
    case 2:
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-500'
      };
    case 3:
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-500'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-600',
        dot: 'bg-gray-400'
      };
  }
};

const ProductCard: React.FC<{ product: SearchResult }> = ({ product }) => {
  const navigate = useNavigate();
  const levelStyle = getLevelStyle(product.level);

  return (
    <div
      onClick={() => navigate(`/product/${product.barcode || product._id}`)}
      className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200 active:scale-[0.98]"
    >
      {/* Image */}
      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <Package className="w-8 h-8 text-gray-400" />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        {/* Nom + Marque */}
        <h3 className="font-semibold text-gray-900 truncate text-base">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-sm text-gray-500 truncate">{product.brand}</p>
        )}

        {/* Niveau — Element principal (philosophie Ecolojia) */}
        {product.level && product.levelLabel && (
          <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full ${levelStyle.bg} ${levelStyle.border} border`}>
            <span className={`w-2 h-2 rounded-full ${levelStyle.dot}`}></span>
            <span className={`text-sm font-medium ${levelStyle.text}`}>
              {product.levelLabel}
            </span>
          </div>
        )}

        {/* Sous-categorie (discret) */}
        {product.subcategory && (
          <p className="text-xs text-gray-400 mt-1 capitalize">
            {product.subcategory.replace(/-/g, ' ')}
          </p>
        )}
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useDeviceContext();
  const navigate = useNavigate();

  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Recherche avec debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      setTotal(0);
      setError(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `${API_URL}/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=20`
      );
      
      const data: SearchResponse = await response.json();

      if (data.success) {
        setResults(data.products);
        setTotal(data.total);
      } else {
        setError(data.error || 'Erreur lors de la recherche');
        setResults([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('[Search] Error:', err);
      setError('Impossible de contacter le serveur');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
        setSearchParams({ q: query }, { replace: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch, setSearchParams]);

  // Initial search from URL
  useEffect(() => {
    if (initialQuery && initialQuery.length >= 2) {
      performSearch(initialQuery);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec recherche */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Titre */}
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Trouver un produit
          </h1>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom du produit ou marque..."
              className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              autoFocus={!isMobile}
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Stats */}
          {hasSearched && !loading && !error && (
            <p className="text-sm text-gray-500 mt-2">
              {total > 0 ? (
                <>
                  <span className="font-medium text-gray-700">{total}</span> produit{total > 1 ? 's' : ''} trouve{total > 1 ? 's' : ''}
                  {total > 20 && <span className="text-gray-400"> (20 affiches)</span>}
                </>
              ) : (
                'Aucun produit trouve'
              )}
            </p>
          )}
        </div>
      </div>

      {/* Resultats */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Etat initial */}
        {!hasSearched && !loading && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Tape le nom d un produit pour le retrouver
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Minimum 2 caracteres
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Recherche en cours...</p>
          </div>
        )}

        {/* Resultats */}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Aucun resultat */}
        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Aucun produit trouve</p>
            <p className="text-sm text-gray-400 mt-1">
              Essaie avec un autre nom ou une marque
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
