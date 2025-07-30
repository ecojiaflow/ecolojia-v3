import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Grid, List } from 'lucide-react';
import { CATEGORIES, CategoryType } from '../types/categories';
import { Product } from '../types';
import { fetchRealProducts } from '../api/realApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';
import AdvancedFilters from '../components/AdvancedFilters';

interface FilterState {
  priceRange: [number, number];
  minScore: number;
  verified: boolean | null;
  tags: string[];
  zones: string[];
}

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 100],
    minScore: 0,
    verified: null,
    tags: [],
    zones: []
  });

  const categoryConfig = category ? CATEGORIES[category as CategoryType] : null;

  useEffect(() => {
    if (category) {
      loadCategoryProducts();
    }
  }, [category]);

  const loadCategoryProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await fetchRealProducts();
      
      const categoryProducts = allProducts.filter(product => 
        product.category === category || 
        product.tagsKeys.some(tag => 
          categoryConfig?.criteria.includes(tag.toLowerCase())
        )
      );
      
      setProducts(categoryProducts);
    } catch (error) {
      console.error('Erreur chargement catégorie:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 FONCTION: Génération de slug sécurisée
  const generateSlug = (product: Product): string => {
    if (product.slug && product.slug !== 'undefined') {
      return product.slug;
    }
    
    const title = product.nameKey || product.id;
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `product-${product.id}`;
  };

  // 🎯 FONCTION CRITIQUE: Navigation vers produit
  const handleProductClick = (product: Product) => {
    console.log('🚀 CategoryPage - Clic produit détecté:', {
      id: product.id,
      nameKey: product.nameKey,
      slug: product.slug
    });
    
    const slug = generateSlug(product);
    console.log('🔧 CategoryPage - Slug généré:', slug);
    
    if (slug && slug !== 'undefined') {
      console.log('✅ CategoryPage - Navigation vers:', `/product/${slug}`);
      navigate(`/product/${slug}`);
    } else {
      console.error('❌ CategoryPage - Slug invalide:', slug);
    }
  };

  const getFilteredProducts = () => {
    return products.filter(product => {
      // Recherche textuelle
      const matchesSearch = 
        product.nameKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brandKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tagsKeys.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Filtre score minimum
      const productScore = (product.ethicalScore / 5) * 100; // Conversion vers pourcentage
      if (productScore < filters.minScore) return false;

      // Filtre prix
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) return false;

      // Filtre vérification
      if (filters.verified !== null && product.verified !== filters.verified) return false;

      // Filtre tags
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag =>
          product.tagsKeys.some(productTag => 
            productTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      // Filtre zones
      if (filters.zones.length > 0) {
        const hasMatchingZone = filters.zones.some(filterZone =>
          product.zonesDisponibles?.includes(filterZone)
        );
        if (!hasMatchingZone) return false;
      }

      return true;
    });
  };

  const filteredProducts = getFilteredProducts();

  if (!categoryConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800">Catégorie non trouvée</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Catégorie */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="text-4xl">{categoryConfig.icon}</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{categoryConfig.name}</h1>
              <p className="text-gray-600 mt-2">
                Découvrez des produits {categoryConfig.name.toLowerCase()} éco-responsables
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-sm text-gray-600">Critères importants :</span>
            {categoryConfig.criteria.map(criterion => (
              <span
                key={criterion}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {criterion}
              </span>
            ))}
          </div>

          {/* Barre de recherche */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={`Rechercher dans ${categoryConfig.name.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-5 w-5" />
              <span>Filtres</span>
            </button>
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-50'}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-50'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filtres avancés */}
          <AdvancedFilters
            category={category as CategoryType}
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={filtersOpen}
            onToggle={() => setFiltersOpen(!filtersOpen)}
          />
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <ProductGridSkeleton count={8} />
          </div>
        ) : (
          <>
            {/* Résultats avec filtres */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
                {products.length !== filteredProducts.length && (
                  <span className="text-gray-500 text-base font-normal">
                    {' '}sur {products.length} total
                  </span>
                )}
              </h2>
              
              {/* Filtres actifs */}
              {(filters.tags.length > 0 || filters.minScore > 0 || filters.verified !== null) && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Filtres :</span>
                  {filters.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {filters.minScore > 0 && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Score ≥ {filters.minScore}%
                    </span>
                  )}
                  {filters.verified !== null && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                      {filters.verified ? 'Vérifiés' : 'Non vérifiés'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    viewMode={viewMode}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-600">
                  Essayez de modifier vos filtres ou votre recherche
                </p>
                <button
                  onClick={() => {
                    setFilters({
                      priceRange: [0, 100],
                      minScore: 0,
                      verified: null,
                      tags: [],
                      zones: []
                    });
                    setSearchQuery('');
                  }}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// 🎯 PRODUCTCARD AVEC NAVIGATION CLIQUABLE
interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  onClick: () => void; // 🎯 AJOUT DE LA PROP ONCLICK
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode, onClick }) => {
  const isListMode = viewMode === 'list';

  // 🎯 GESTION DU CLIC
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🚀 ProductCard - Clic détecté sur:', product.nameKey);
    onClick();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(e as any);
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer hover:border-green-300 group ${
        isListMode ? 'flex' : ''
      }`}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`Voir les détails de ${product.nameKey}`}
    >
      <img
        src={product.image}
        alt={product.nameKey}
        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
          isListMode ? 'w-24 h-24' : 'w-full h-48'
        }`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/4820813/pexels-photo-4820813.jpeg';
        }}
      />
      <div className={`p-4 ${isListMode ? 'flex-1' : ''}`}>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
          {product.nameKey}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{product.brandKey}</p>
        
        {/* Tags */}
        {product.tagsKeys && product.tagsKeys.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tagsKeys.slice(0, 2).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))}
            {product.tagsKeys.length > 2 && (
              <span className="text-xs text-gray-500">
                +{product.tagsKeys.length - 2}
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
              {(product.ethicalScore * 20).toFixed(0)}%
            </div>
            {product.verified && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                ✓ Vérifié
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-gray-900">
              {product.price}€
            </span>
            <div className="text-xs text-green-600 font-medium group-hover:underline">
              Voir détails
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;