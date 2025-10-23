import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProducts, toDisplayProduct } from "../lib/api";
import { useQuerySync } from '../hooks/useQuerySync';

export default function SearchPage() {
  const [state, setState] = useState({ q: '' });
  const updateURL = useQuerySync(state, setState);
  const [res, setRes] = useState(null);

  useEffect(() => {
    if (state.q.trim()) {
      searchProducts(state.q.trim(), {}).then(setRes);
    }
  }, [state.q]);

  return (
    <div className="container mx-auto px-4 py-8">
      <input
        type="text"
        value={state.q}
        onChange={(e) => { const q = e.target.value; setState({ q }); updateURL({ q }); }}
        placeholder="Rechercher un produit..."
        className="w-full px-4 py-2 border rounded mb-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {res?.items && res.items.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {res.items.map((item, i) => {
            const p = toDisplayProduct(item);
            const imageUrl = item.imageUrl || p.imageUrl;
            
            return (
              <div 
                key={i} 
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                {/* Image produit */}
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={p.name || 'Produit'}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3EPas d\'image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-center p-4">
                      <svg 
                        className="w-16 h-16 mx-auto mb-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                        />
                      </svg>
                      <span className="text-sm">Pas d'image</span>
                    </div>
                  )}
                </div>
                
                {/* Informations produit */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 line-clamp-2">{p.name || 'Produit sans nom'}</h3>
                  <p className="text-sm text-gray-600 mb-3">{p.brand || 'Marque inconnue'}</p>
                  
                  <button 
                    onClick={() => window.location.href = `/product/${item._id || item.objectID}`} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Voir le produit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          {state.q.trim() ? 'Aucun produit trouvé' : 'Tapez pour rechercher'}
        </div>
      )}
    </div>
  );
}