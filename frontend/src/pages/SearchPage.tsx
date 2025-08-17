import React, { useState, useEffect } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://ecolojia-backendvf.onrender.com/api/products?limit=20");
      const data = await response.json();
      setProducts(data?.products || []);
    } catch (error) {
      console.error("Erreur:", error);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      loadProducts();
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`https://ecolojia-backendvf.onrender.com/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setProducts(data?.products || []);
    } catch (error) {
      console.error("Erreur recherche:", error);
    }
    setLoading(false);
  };

  const analyzeProduct = (product) => {
    window.location.href = `/scan?barcode=${product.barcode}&name=${encodeURIComponent(product.name)}`;
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Rechercher des produits</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="flex-1 px-4 py-3 border rounded-lg text-lg"
          />
          <button
            type="submit"
            className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
            disabled={loading}
          >
            {loading ? "..." : "Rechercher"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Chargement...</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            {product.imageUrl && (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-48 object-contain mb-4"
              />
            )}
            <h3 className="font-bold text-lg mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-2">{product.brand}</p>
            <p className="text-sm text-gray-500 mb-4">Code: {product.barcode}</p>
            
            <div className="flex gap-2 mb-4">
              {product.nova_group && (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  product.nova_group <= 2 ? "bg-green-100 text-green-800" : 
                  product.nova_group === 3 ? "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800"
                }`}>
                  NOVA {product.nova_group}
                </span>
              )}
              {product.nutriscore_grade && (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  product.nutriscore_grade === "a" ? "bg-green-100 text-green-800" :
                  product.nutriscore_grade === "b" ? "bg-lime-100 text-lime-800" :
                  product.nutriscore_grade === "c" ? "bg-yellow-100 text-yellow-800" :
                  product.nutriscore_grade === "d" ? "bg-orange-100 text-orange-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  Nutri-Score {product.nutriscore_grade.toUpperCase()}
                </span>
              )}
            </div>
            
            <button
              onClick={() => analyzeProduct(product)}
              className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Analyser ce produit
            </button>
          </div>
        ))}
      </div>
      
      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun produit trouve</p>
        </div>
      )}
    </div>
  );
}


