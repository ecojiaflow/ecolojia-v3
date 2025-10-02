import { useLocation, useSearchParams } from "react-router-dom";
import { AlertTriangle, Leaf, Heart, Shield, Info } from "lucide-react";
import { inferDomain } from '../utils/domain';

const ResultsPageIntegrated: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const barcode = searchParams.get("barcode");

  // Récupérer les données depuis sessionStorage ou location state
  const getResultData = () => {
    if (location.state) return location.state;
    try {
      const stored = sessionStorage.getItem("ecolojia:lastResult");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const data = getResultData();
  const category = sessionStorage.getItem("ecolojia:lastCategory") || "food";

  // Détection du domaine produit
  const __domain = inferDomain(data);
  const __isFood = __domain === 'food';

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
          <p className="text-yellow-800">Aucune donnée d'analyse disponible.</p>
          <a href="/scan" className="text-blue-600 underline mt-2 block">
            Retour au scanner
          </a>
        </div>
      </div>
    );
  }

  // Adapter l'affichage selon la catégorie
  const getCategoryInfo = () => {
    switch(category) {
      case "cosmetics":
        return {
          title: "Analyse Cosmétique",
          icon: "💄",
          color: "purple",
          description: "Analyse basée sur la composition INCI"
        };
      case "detergents":
        return {
          title: "Analyse Détergent",
          icon: "🧽",
          color: "blue",
          description: "Évaluation de l'impact environnemental"
        };
      default:
        return {
          title: __isFood ? "Analyse Alimentaire" : "Analyse du produit",
          icon: "🍕",
          color: "green",
          description: __isFood ? "Basée sur le Nutri-Score et NOVA" : "Synthèse non-alimentaire (composition, sécurité, environnement)"
        };
    }
  };

  const categoryInfo = getCategoryInfo();
  const { product, scores } = data;
  const healthScore = scores?.normalized?.value || scores?.healthScore || 50;
  const environmentScore = scores?.environmentScore || 0;
  const overallScore = scores?.globalScore || Math.round((healthScore + environmentScore) / 2);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Résultat d'analyse</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <span className="text-2xl">{categoryInfo.icon}</span>
            {product?.name || "Produit inconnu"}
          </h2>
          <p className="text-gray-600">
            Code-barres: {barcode || product?.barcode || "Non disponible"}
          </p>
        </div>

        {/* Scores simples sans gauge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{healthScore}%</div>
            <p className="text-sm text-gray-600 mt-1">Score Santé</p>
          </div>
          
          {environmentScore > 0 && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{environmentScore}%</div>
              <p className="text-sm text-gray-600 mt-1">Score Environnement</p>
            </div>
          )}
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{overallScore}%</div>
            <p className="text-sm text-gray-600 mt-1">Score Global</p>
          </div>
        </div>

        {/* Info catégorie - masquer le bloc Nutri/NOVA pour non-alimentaire */}
        {__isFood ? (
          <div className={`bg-${categoryInfo.color}-50 p-4 rounded-lg`}>
            <h3 className={`font-semibold text-${categoryInfo.color}-900 mb-2`}>
              {categoryInfo.title}
            </h3>
            <p className={`text-sm text-${categoryInfo.color}-700`}>
              {categoryInfo.description}
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              {categoryInfo.title}
            </h3>
            <p className="text-sm text-blue-700">
              {categoryInfo.description}
            </p>
          </div>
        )}

        {/* Recommandations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Recommandations</h3>
            <ul className="space-y-2">
              {data.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => window.location.href = "/scan"}
          className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Scanner un autre produit
        </button>
      </div>
    </div>
  );
};

export { ResultsPageIntegrated };

