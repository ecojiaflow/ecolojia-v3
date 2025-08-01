import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { productService, analysisService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertCircle, TrendingUp, ShieldCheck, Leaf } from 'lucide-react';
import PremiumAlternatives from '../components/premium/PremiumAlternatives';

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const barcode = params.get('barcode');
        const productId = params.get('id');
        
        if (!barcode && !productId) {
          throw new Error('Aucun produit spécifié');
        }
        
        let result;
        if (barcode) {
          result = await analysisService.autoAnalyze({ barcode });
        } else {
          result = await analysisService.autoAnalyze({ productId });
        }
        
        setAnalysis(result);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de l\'analyse');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" message="Analyse en cours..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur d'analyse</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Résultats d'analyse</h1>
        
        {/* Résultats de l'analyse */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">{analysis?.productSnapshot?.name}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{analysis?.results?.healthScore || 0}/100</div>
              <div className="text-sm text-gray-600">Score santé</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Leaf className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{analysis?.results?.environmentScore || 0}/100</div>
              <div className="text-sm text-gray-600">Score environnement</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{analysis?.results?.socialScore || 0}/100</div>
              <div className="text-sm text-gray-600">Score social</div>
            </div>
          </div>
          
          {/* Recommandations */}
          {analysis?.results?.recommendations && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Recommandations</h3>
              <ul className="space-y-2">
                {analysis.results.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternatives Premium */}
          {user?.tier === 'premium' && (
            <PremiumAlternatives 
              alternatives={analysis.alternatives} 
              currentScore={analysis.healthScore}
            />
          )}
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Nouvelle recherche
          </button>
          
          <button
            onClick={() => navigate('/history')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Voir l'historique
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
