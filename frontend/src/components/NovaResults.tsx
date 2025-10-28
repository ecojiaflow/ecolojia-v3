// PATH: frontend/src/components/NovaResults.tsx
import React from 'react';
import { NovaAdaptedResult } from '../services/novaAdapter';
import { CosmeticAnalysisDisplay, DetergentAnalysisDisplay } from './analysis/CosmeticAnalysisDisplay';

interface NovaResultsProps {
  result: any;
  loading: boolean;
  categorya: 'food' | 'cosmetic' | 'detergent';
}

const NovaResults: React.FC<NovaResultsProps> = ({ result, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mb-4"></div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Analyse en cours...</h3>
          <p className="text-gray-600 text-center">
            Notre IA analyse les ingredients et determine le profil nutritionnel du produit
          </p>
          <div className="mt-4 w-full max-w-md">
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result.success || !result.data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">aa</div>
          <h3 className="text-red-800 text-xl font-bold mb-2">Erreur d'analyse</h3>
          <p className="text-red-700">{result.error || 'Impossible d\'analyser ce produit'}</p>
        </div>
      </div>
    );
  }

  const { product, analysis } = result.data;

  const getNovaColor = (group: number): string => {
    switch (group) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-orange-500';
      case 4: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getNovaTextColor = (group: number): string => {
    switch (group) {
      case 1: return 'text-green-700';
      case 2: return 'text-yellow-700';
      case 3: return 'text-orange-700';
      case 4: return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  const getNovaBgColor = (group: number): string => {
    switch (group) {
      case 1: return 'bg-green-50 border-green-200';
      case 2: return 'bg-yellow-50 border-yellow-200';
      case 3: return 'bg-orange-50 border-orange-200';
      case 4: return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getNovaLabel = (group: number): string => {
    switch (group) {
      case 1: return 'Aliments non transformes ou minimalement transformes';
      case 2: return 'Ingredients culinaires transformes';
      case 3: return 'Aliments transformes';
      case 4: return 'Aliments ultra-transformes';
      default: return 'Classification inconnue';
    }
  };

  const getNovaDescription = (group: number): string => {
    switch (group) {
      case 1: return 'Fruits, legumes, grains, legumineuses, viandes, poissons, aaaufs, lait pasteurise, dans leur etat naturel ou apres des procedes physiques simples.';
      case 2: return 'Substances extraites directement des aliments du groupe 1 ou de la nature par des procedes comme le pressage, le raffinage, la mouture.';
      case 3: return 'Aliments du groupe 1 auxquels ont ete ajoutes des substances du groupe 2, generalement par des techniques de conservation traditionnelles.';
      case 4: return 'Formulations industrielles contenant peu ou pas d\'aliments entiers, fabriquees  partir de substances derivees d\'aliments et d\'additifs.';
      default: return 'Classification non determinee.';
    }
  };

  const getRecommendationIcon = (type: string): string => {
    switch (type) {
      case 'replace': return 'aaaa';
      case 'moderate': return 'a';
      case 'enjoy': return 'aaaa';
      default: return 'aaa';
    }
  };

  const getRecommendationColor = (type: string): string => {
    switch (type) {
      case 'replace': return 'bg-red-50 border-red-200 text-red-800';
      case 'moderate': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'enjoy': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header produit */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h2>
            <p className="text-lg text-gray-600 mb-4">{product.category}</p>
            
            <div className="flex items-center space-x-6 text-sm text-neutral-700">
              <div className="flex items-center">
                <span className="mr-1">a</span>
                <span>Analyse en {analysis.processingTime}ms</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1"></span>
                <span>Confiance: {formatConfidence(analysis.confidence)}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">aaaa</span>
                <span>{new Date(analysis.timestamp).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-800">{product.score}<span className="text-lg text-neutral-700">/100</span></div>
            <div className="text-sm text-gray-600">Score global</div>
          </div>
        </div>
      </div>

      {/* Classification NOVA */}
      <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${getNovaColor(product.novaGroup)}`}>
        <div className="flex items-start space-x-6">
          <div className={`w-20 h-20 rounded-full ${getNovaColor(product.novaGroup)} flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
            {product.novaGroup}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h3 className="text-2xl font-bold text-gray-800">Groupe NOVA {product.novaGroup}</h3>
              <div className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${getNovaBgColor(product.novaGroup)} ${getNovaTextColor(product.novaGroup)}`}>
                {product.novaGroup === 1 && ' Naturel'}
                {product.novaGroup === 2 && 'aa Culinaire'}
                {product.novaGroup === 3 && ' Transforme'}
                {product.novaGroup === 4 && ' Ultra-transforme'}
              </div>
            </div>
            
            <p className="text-lg text-gray-700 mb-3">{getNovaLabel(product.novaGroup)}</p>
            <p className="text-gray-600 text-sm leading-relaxed">{getNovaDescription(product.novaGroup)}</p>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Score nutritionnel</span>
                <span className="text-sm font-bold">{product.score}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${getNovaColor(product.novaGroup)} transition-all duration-1000 ease-out`}
                  style={{ width: `${product.score}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Marqueurs ultra-transformation */}
      {product.ultraProcessedMarkers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">aa</span>
            Marqueurs d'ultra-transformation 
            <span className="ml-2 bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {product.ultraProcessedMarkers.length}
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {product.ultraProcessedMarkers.map((marker, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <div className="text-red-500 text-xl mr-3 mt-0.5">a</div>
                <div>
                  <span className="text-red-800 font-medium">{marker}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              <strong>aaa Info scientifique:</strong> Les marqueurs d'ultra-transformation indiquent des procedes industriels 
              qui peuvent reduire la qualite nutritionnelle et augmenter les risques pour la Santé selon les etudes INSERM 2024.
            </p>
          </div>
        </div>
      )}

      {/* Additifs detectes */}
      {product.additives.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">aaaa</span>
            Additifs alimentaires detectes
            <span className="ml-2 bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {product.additives.length}
            </span>
          </h3>
          
          <div className="space-y-3">
            {product.additives.map((additive, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-bold text-gray-800 text-lg">{additive.code}</span>
                    <span className="text-gray-600 ml-3">{additive.name}</span>
                  </div>
                  <div className="text-sm text-neutral-700 mt-1">{additive.category}</div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  additive.riskLevel === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                  additive.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  {additive.riskLevel === 'high' ? 'aa Risque eleve' :
                   additive.riskLevel === 'medium' ? ' Risque modere' :
                   ' Risque faible'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>aa Reglementation:</strong> Tous les additifs listes sont autorises par l'EFSA (Autorite europeenne de securite des aliments) 
              selon le reglement CE na1333/2008, mais leur impact peut varier selon la sensibilite individuelle.
            </p>
          </div>
        </div>
      )}

      {/* Recommandation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">{getRecommendationIcon(product.recommendation.type)}</span>
          Recommandation nutritionnelle
        </h3>
        
        <div className={`p-4 rounded-lg border ${getRecommendationColor(product.recommendation.type)}`}>
          <p className="font-medium mb-2">{product.recommendation.message}</p>
          
          {product.recommendation.alternatives && product.recommendation.alternatives.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <span className="mr-2">aaaa</span>
                Alternatives suggerees:
              </h4>
              <ul className="space-y-1">
                {product.recommendation.alternatives.map((alternative, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-700 mr-2">aa</span>
                    <span>{alternative}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Sources scientifiques */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">aa</span>
          Sources scientifiques et reglementaires
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {product.scientificSources.map((source, index) => (
            <div key={index} className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-600 text-lg mr-3 mt-0.5">aaaaa</div>
              <div className="text-sm text-blue-800 font-medium">{source}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">
            <strong>aa Transparence:</strong> ECOLOJIA s'appuie exclusivement sur des sources scientifiques officielles 
            pour garantir des analyses objectives et des recommandations fiables basees sur la recherche actuelle.
          </p>
        </div>
      </div>

      {/* Footer avec action */}
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-4xl mb-3">a</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Analyse terminee</h3>
        <p className="text-gray-600 mb-4">
          Vous souhaitez analyser un autre produit ou decouvrir des alternatives plus naturelles a
        </p>
        
        <div className="flex flex-wrap justify-center gap-3">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Nouvelle analyse
          </button>
          
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Voir les alternatives
          </button>
        </div>
      </div>
    </div>
  );
};

export default NovaResults;


