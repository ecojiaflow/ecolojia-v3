import React, { useState } from 'react';
import { searchService, extractProducts } from '@/services/searchService';

export default function TestSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Recherche de:', query);
      const response = await searchService.searchProducts(query);
      console.log('📦 Réponse brute:', response);
      
      const products = extractProducts(response);
      console.log('✅ Produits extraits:', products);
      
      setResults(products);
    } catch (err: any) {
      console.error('❌ Erreur de recherche:', err);
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '20px' }}>Test de Recherche API</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Rechercher un produit (ex: chocolat)..."
          style={{ 
            padding: '10px', 
            flex: 1, 
            border: '1px solid #ddd', 
            borderRadius: '5px',
            fontSize: '16px'
          }}
        />
        <button 
          onClick={handleSearch} 
          disabled={loading} 
          style={{ 
            padding: '10px 20px', 
            background: loading ? '#ccc' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#fee', 
          color: '#c00',
          padding: '15px', 
          marginBottom: '20px', 
          borderRadius: '5px',
          border: '1px solid #fcc'
        }}>
          ❌ Erreur: {error}
        </div>
      )}

      <div>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          {results.length > 0 ? `${results.length} résultat(s) trouvé(s)` : 'Aucun résultat'}
        </p>
        
        <div style={{ display: 'grid', gap: '10px' }}>
          {results.map((product, index) => (
            <div key={product._id || index} style={{ 
              border: '1px solid #ddd', 
              padding: '15px', 
              borderRadius: '8px',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{product.name}</h3>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Marque:</strong> {product.brand || 'Non spécifiée'}
              </p>
              <p style={{ margin: '5px 0', color: '#888', fontSize: '14px' }}>
                <strong>Code:</strong> {product.barcode} | <strong>Catégorie:</strong> {product.category}
              </p>
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                {product.nutriscore_grade && (
                  <span style={{ 
                    background: '#10b981', 
                    color: 'white',
                    padding: '4px 12px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Nutriscore: {product.nutriscore_grade.toUpperCase()}
                  </span>
                )}
                {product.nova_group && (
                  <span style={{ 
                    background: '#f59e0b', 
                    color: 'white',
                    padding: '4px 12px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    NOVA: {product.nova_group}
                  </span>
                )}
                {product.ecoscore_grade && (
                  <span style={{ 
                    background: '#3b82f6', 
                    color: 'white',
                    padding: '4px 12px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Ecoscore: {product.ecoscore_grade.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#f5f5f5', 
        borderRadius: '5px',
        fontSize: '14px',
        color: '#666'
      }}>
        <p><strong>État:</strong> {loading ? '⏳ Chargement...' : '✅ Prêt'}</p>
        <p><strong>Backend:</strong> https://ecolojia-backendvf.onrender.com</p>
        <p><strong>Conseil:</strong> Ouvrez la console (F12) pour voir les logs détaillés</p>
      </div>
    </div>
  );
}
