import React, { useState, useEffect } from 'react';
import { fetchRealProducts } from '../api/realApi';

const SimilarProductsCarousel: React.FC<{ productId: string }> = ({ productId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSimilarProducts = async () => {
      try {
        // Utiliser les mêmes mocks que l'API principale
        const allProducts = await fetchRealProducts('');
        // Filtrer le produit actuel et prendre 3 autres
        const similar = allProducts.filter(p => p.id !== productId).slice(0, 3);
        setProducts(similar);
      } catch (error) {
        console.error('❌ Erreur suggestions :', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadSimilarProducts();
  }, [productId]);

  if (loading) return <div>Chargement suggestions...</div>;
  if (products.length === 0) return null;

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Produits similaires</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4">
            <h4 className="font-semibold">{product.nameKey}</h4>
            <p className="text-sm text-gray-600">{product.brandKey}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarProductsCarousel;