// PATH: frontend/ecolojiaFrontV3/src/pages/AdminDashboard.tsx
import React from 'react';
import useAdmin from '../hooks/useAdmin';
import StatsCard from '../components/Admin/StatsCard';
import ImportProgress from '../components/Admin/ImportProgress';
import ProductTable from '../components/Admin/ProductTable';
import LogViewer from '../components/Admin/LogViewer';
import { BarChart3, Database, RefreshCw, Plus, AlertCircle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const {
    stats,
    recentProducts,
    importLogs,
    loading,
    error,
    lastUpdate,
    loadDashboardData,
    triggerImport,
    validateProduct,
    deleteProduct,
    clearError
  } = useAdmin();

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleImport = async () => {
    try {
      const result = await triggerImport(25);
      alert(`✅ Import démarré: ${result.message}`);
    } catch (err) {
      console.error('❌ Erreur import:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Database className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Admin ECOLOJIA</h1>
              </div>
              {lastUpdate && (
                <div className="text-sm text-gray-500">
                  Dernière MàJ: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Importer produits</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gestion des erreurs */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-800 font-medium">Erreur</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && !stats && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des données admin...</p>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {stats && (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Produits"
                value={stats.totalProducts}
                icon={<Database className="h-6 w-6 text-blue-600" />}
                color="blue"
                trend={stats.recentActivity.length > 0 ? `+${stats.recentActivity[0]?.count || 0}` : undefined}
              />
              <StatsCard
                title="Imports Réussis"
                value={stats.totalImports}
                icon={<BarChart3 className="h-6 w-6 text-green-600" />}
                color="green"
                percentage={stats.successRate}
              />
              <StatsCard
                title="Confiance IA"
                value={`${Math.round(stats.averageConfidence)}%`}
                icon={<BarChart3 className="h-6 w-6 text-purple-600" />}
                color="purple"
                subtitle="Moyenne"
              />
              <StatsCard
                title="Catégories"
                value={Object.values(stats.productsByCategory).reduce((a, b) => a + b, 0)}
                icon={<Database className="h-6 w-6 text-orange-600" />}
                color="orange"
                subtitle={`${Object.keys(stats.productsByCategory).length} types`}
              />
            </div>

            {/* Répartition par catégories */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Répartition par catégories</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(stats.productsByCategory).map(([category, count]) => (
                  <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">
                      {category === 'alimentaire' && '🔬'}
                      {category === 'cosmetic' && '💄'}
                      {category === 'detergent' && '🧽'}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{category}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Import Progress */}
            <ImportProgress />

            {/* Table des produits récents */}
            <ProductTable
              products={recentProducts}
              onValidate={validateProduct}
              onDelete={deleteProduct}
              loading={loading}
            />

            {/* Logs d'import */}
            <LogViewer logs={importLogs} />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
// EOF
