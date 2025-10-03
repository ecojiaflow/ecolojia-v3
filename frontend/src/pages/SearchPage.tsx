import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProducts, toDisplayProduct, SearchResult } from "../lib/api";
import ScoreChip from "../components/ScoreChip";
import DomainBadges from "../components/DomainBadges";
import FiltersPanel from '../components/search/FiltersPanel';
import { useQuerySync, SearchState } from '../hooks/useQuerySync';

type DomainKey = "food" | "beauty" | "detergent";
const RESULT_PATH = (import.meta.env.VITE_RESULT_PATH || "/results").replace(/\/+$/,"");

function inferDomains(category: string, name: string, brand: string): DomainKey[] {
  const txt = `${category} ${name} ${brand}`.toLowerCase();
  if (/(cosm|beauty|cr[eè]me|shampoo|lotion|nivea|garnier)/i.test(txt)) return ["beauty"];
  if (/(d[eé]tergent|lessive|ariel|dash|omo|liquide vaisselle|cleaner)/i.test(txt)) return ["detergent"];
  return ["food"];
}

// Helper pour extraire un ID valide d'un produit
function getValidProductId(item: any, product: any): string | null {
  // Essayer différentes sources d'ID dans l'ordre de priorité
  const candidates = [
    (item as any)?.objectID,           // Algolia objectID (priorité 1)
    (item as any)?._id,                // MongoDB _id
    (item as any)?.id,                 // ID générique
    product?.id,                       // ID du produit transformé
    product?._id,                      // MongoDB _id du produit transformé
    product?.barcode,                  // Code-barres en dernier recours
    (item as any)?.barcode             // Code-barres de l'item brut
  ];

  for (const candidate of candidates) {
    if (candidate && candidate !== 'undefined' && typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate.trim();
    }
  }

  return null;
}

// Fonction pour obtenir l'image du produit avec fallback
function getProductImage(product: any): string {
  // Si on a déjà une imageUrl valide, l'utiliser
  if (product.imageUrl && product.imageUrl.includes('openfoodfacts.org')) {
    return product.imageUrl;
  }
  
  // Sinon, essayer image_url
  if (product.image_url && product.image_url.includes('openfoodfacts.org')) {
    return product.image_url;
  }
  
  // Sinon, construire l'URL à partir du barcode
  if (product.barcode) {
    // Formater le barcode pour OpenFoodFacts (avec les /)
    const formattedBarcode = product.barcode.match(/.{1,3}/g)?.join('/') || product.barcode;
    return `https://images.openfoodfacts.org/images/products/${formattedBarcode}/front_fr.400.jpg`;
  }
  
  return '/placeholder.jpg';
}

export default function SearchPage() {
  // État synchronisé avec URL
  const [state, setState] = useState<SearchState>({ q: '' });
  const updateURL = useQuerySync(state, setState);
  
  // État local
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facets, setFacets] = useState<{
    brands: Array<{ name: string; count: number }>;
    categories: Array<{ name: string; count: number }>;
  }>({ brands: [], categories: [] });

  async function doSearchQuery() {
    const term = state.q.trim();
    if (!term) { 
      setRes({ items: [], source: "local" }); 
      setFacets({ brands: [], categories: [] });
      return; 
    }
    
    setBusy(true); 
    setError(null);
    
    try {
      const r = await searchProducts(term);
      setRes(r);
      
      // Extraire les facettes des résultats (simulation)
      const brands = new Map<string, number>();
      const categories = new Map<string, number>();
      
      r.items.forEach(item => {
        const product = toDisplayProduct(item);
        if (product.brand) {
          brands.set(product.brand, (brands.get(product.brand) || 0) + 1);
        }
        if (product.category) {
          categories.set(product.category, (categories.get(product.category) || 0) + 1);
        }
      });
      
      setFacets({
        brands: Array.from(brands.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        categories: Array.from(categories.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
      });
      
    } catch (err: any) {
      setError(err?.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  // Déclencher recherche quand state change
  useEffect(() => {
    doSearchQuery();
  }, [state.q]); // TODO: ajouter autres filtres

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // La recherche se déclenche automatiquement via useEffect
  };

  const handleQueryChange = (newQ: string) => {
    setState(prev => ({ ...prev, q: newQ }));
    updateURL({ ...state, q: newQ });
  };

  const handleProductClick = (item: any, product: any) => {
    const productId = getValidProductId(item, product);
    
    // Debug logs pour identifier les problèmes
    console.log('Debug click produit:', {
      productId,
      item: item,
      product: product,
      objectID: (item as any)?.objectID,
      itemId: (item as any)?.id,
      itemBarcode: (item as any)?.barcode,
      productId_field: product?.id,
      productBarcode: product?.barcode
    });

    if (productId) {
      window.location.href = `/product/${productId}`;
    } else {
      alert('Impossible de trouver un identifiant valide pour ce produit. Données de debug dans la console.');
      console.error('Aucun ID valide trouvé:', { item, product });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Barre de recherche */}
        <form onSubmit={handleSearchSubmit} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={state.q}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Rechercher un produit..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={busy} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {busy ? "..." : "Rechercher"}
            </button>
          </div>
        </form>

        <div className="flex gap-6">
          {/* Panneau de filtres */}
          <div className="w-80 flex-shrink-0">
            <FiltersPanel
              selectedBrands={state.brands || []}
              selectedCategories={state.categories || []}
              healthScoreRange={[state.hsMin || 0, state.hsMax || 100]}
              availableBrands={facets.brands}
              availableCategories={facets.categories}
              onBrandsChange={(brands) => {
                const newState = { ...state, brands };
                setState(newState);
                updateURL(newState);
              }}
              onCategoriesChange={(categories) => {
                const newState = { ...state, categories };
                setState(newState);
                updateURL(newState);
              }}
              onHealthScoreChange={([hsMin, hsMax]) => {
                const newState = { ...state, hsMin, hsMax };
                setState(newState);
                updateURL(newState);
              }}
              onClear={() => {
                const newState = { q: state.q };
                setState(newState);
                updateURL(newState);
              }}
            />
          </div>

          {/* Résultats */}
          <div className="flex-1">
            <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded-lg">
              <p className="text-sm text-green-800">✅ Navigation produit corrigée - M9 fonctionnel !</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {res && (
              <div>
                <p className="mb-4 text-gray-600">{res.items.length} résultat(s) • Source: {res.source}</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {res.items.map((item, index) => {
                    const product = toDisplayProduct(item);
                    const domains = inferDomains(product.category, product.name, product.brand);
                    const key = getValidProductId(item, product) || `item-${index}`;
                    
                    return (
                      <div key={key} className="border rounded-lg overflow-hidden hover:shadow-md">
                        <img 
                          src={getProductImage(product)} 
                          alt={product.name} 
                          className="w-full h-48 object-cover bg-gray-100" 
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = '/placeholder.jpg';
                          }}
                        />
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                          <p className="text-gray-600 text-sm mb-2">{product.brand}</p>
                          <p className="text-gray-500 text-xs mb-3">{product.category}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <ScoreChip score={product.globalScore} />
                            <DomainBadges domains={domains} />
                          </div>
                          <button
                            onClick={() => handleProductClick(item, product)}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Voir détails
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}