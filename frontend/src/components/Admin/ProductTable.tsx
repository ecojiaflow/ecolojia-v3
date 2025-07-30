// PATH: frontend/ecolojiaFrontV3/src/components/Admin/ProductTable.tsx
import React, { useState } from 'react';
import { RecentProduct } from '../../types/admin';
import { Eye, Trash2, Check, X, ExternalLink, Calendar } from 'lucide-react';

interface ProductTableProps {
  products: RecentProduct[];
  onValidate: (productId: string, status: 'verified' | 'rejected') => Promise<any>;
  onDelete: (productId: string) => Promise<any>;
  loading: boolean;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onValidate,
  onDelete,
  loading
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleValidate = async (productId: string, status: 'verified' | 'rejected') => {
    setActionLoading(`${productId}-${status}`);
    try {
      await onValidate(productId, status);
    } catch (error) {
      console.error('❌ Erreur validation:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setActionLoading(`${productId}-delete`);
      try {
        await onDelete(productId);
      } catch (error) {
        console.error('❌ Erreur suppression:', error);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const getStatusBadge = (status?: 'verified' | 'pending' | 'rejected') => {
    const badges = {
      verified: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    if (!status) return null;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badges[status]}`}>
        {status === 'verified' && '✅ Vérifié'}
        {status === 'pending' && '⏳ En attente'}
        {status === 'rejected' && '❌ Rejeté'}
      </span>
    );
  };

  const getConfidenceBadge = (confidence?: number, color?: 'green' | 'orange' | 'red') => {
    if (!confidence) return null;
    const colorClasses = {
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color || 'green']}`}>
        {Math.round(confidence)}%
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      alimentaire: '🔬',
      cosmetic: '💄',
      detergent: '🧽'
    };
    return icons[category as keyof typeof icons] || '📦';
  };

  if (loading && products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Produits récents ({products.length})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confiance IA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="h-10 w-10 rounded-lg object-cover mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {product.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.brand && <span className="mr-2">📌 {product.brand}</span>}
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                          {product.slug}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getCategoryIcon(product.category)}</span>
                    <span className="text-sm text-gray-900 capitalize">{product.category}</span>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getConfidenceBadge(product.ai_confidence, product.confidence_color)}
                    {product.eco_score && (
                      <span className="text-xs text-gray-500">Eco: {product.eco_score}</span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(product.verified_status)}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(product.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {product.verified_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleValidate(product.id, 'verified')}
                          disabled={actionLoading === `${product.id}-verified`}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Valider"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleValidate(product.id, 'rejected')}
                          disabled={actionLoading === `${product.id}-rejected`}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Rejeter"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* ✅ FIX ajouté ici */}
                    <a
                      href={`/product/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                      title="Voir le produit"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={actionLoading === `${product.id}-delete`}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📦</div>
          <p className="text-gray-600">Aucun produit trouvé</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
// EOF
