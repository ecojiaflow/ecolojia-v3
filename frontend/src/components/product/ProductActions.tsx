import React, { useState } from 'react';
import { MessageCircle, AlertCircle, Sparkles, Loader, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EnrichmentResult } from './EnrichmentResult';

interface ProductActionsProps {
  product: any;
  onProductUpdated?: (updatedProduct: any) => void;
}

export const ProductActions: React.FC<ProductActionsProps> = ({ product, onProductUpdated }) => {
  const navigate = useNavigate();
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState<any>(null);

  const handleChatQuestion = (question: string) => {
    navigate(`/chat?product=${product.barcode}&q=${encodeURIComponent(question)}`);
  };

  // ✅ LOGIQUE SCIENTIFIQUE ROBUSTE : Afficher bouton si données manquantes
  const shouldShowEnrichButton = () => {
    const scores = product?.scores;
    if (!scores) return false;

    // 🔍 DEBUG
    console.log("🔍 shouldShowEnrichButton - dataCompleteness:", scores.dataCompleteness);
    console.log("🔍 shouldShowEnrichButton - confidence:", scores.confidence);
    console.log("🔍 shouldShowEnrichButton - breakdown.saturatedFat:", scores.breakdown?.saturatedFat);

    // ✅ RÈGLE 0 : Si Excellente + confidence haute → JAMAIS afficher
    if (scores.dataCompleteness === 'Excellente' && scores.confidence >= 0.85) {
      return false;
    }

    // Déjà enrichi par IA récemment ? Ne pas proposer à nouveau
    if (product.aiEnriched && scores.confidence >= 0.80) {
      return false;
    }

    // Règle 2 : Vérifier si données nutritionnelles critiques manquantes
    const breakdown = scores.breakdown || {};
    const criticalFields = ['sugars', 'saturatedFat', 'salt'];
    const hasMissingCritical = criticalFields.some(
      field => breakdown[field]?.score === null || breakdown[field]?.score === undefined
    );

    if (hasMissingCritical) return true;

    // Règle 3 : Confiance faible → proposer enrichissement
    if (scores.confidence < 0.80) return true;

    return false;
  };

  // ✅ Détecter les champs manquants pour message contextuel
  const getMissingFields = () => {
    const breakdown = product?.scores?.breakdown || {};
    const missing: string[] = [];
    
    if (!breakdown.sugars?.score && breakdown.sugars?.score !== 0) missing.push('sucres');
    if (!breakdown.saturatedFat?.score && breakdown.saturatedFat?.score !== 0) missing.push('graisses saturées');
    if (!breakdown.salt?.score && breakdown.salt?.score !== 0) missing.push('sel');
    
    return missing;
  };

  // ✅ Appel API enrichissement avec capture avant/après
  // ✅ Appel API enrichissement avec gestion result.enrichment
  const handleEnrichWithAI = async () => {
    setIsEnriching(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000';
      const response = await fetch(`${apiUrl}/api/scoring/${product.barcode}/ai-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      // Cas 1 : Enrichissement refusé (garde-fous)
      if (!result.success) {
        if (result.reason === 'ALREADY_EXCELLENT') {
          toast.success('✅ ' + result.message);
        } else if (result.reason === 'HIGH_SCORE') {
          toast.success('✅ ' + result.message);
        } else if (result.reason === 'RATE_LIMITED') {
          toast.error('⏰ ' + result.message);
        } else {
          toast.error(result.message || 'Enrichissement impossible');
        }
        return;
      }

      // Cas 2 : Enrichissement réussi avec objet enrichment
      if (result.success && result.enrichment) {
        setEnrichmentResult(result.enrichment);
        toast.success('✨ Données complétées avec succès');
        // Notifier le parent du produit mis à jour
        onProductUpdated?.(result.product);
      } else if (result.success) {
        // Fallback : pas d'objet enrichment (ancien format) → Reload direct
        toast.success('✨ Données complétées avec succès');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Enrichissement échoué');
      }

    } catch (error) {
      console.error('Erreur enrichissement:', error);
      toast.error('Impossible de compléter les données');
    } finally {
      setIsEnriching(false);
    }
  };

  const missingFields = getMissingFields();
  const showEnrich = shouldShowEnrichButton();

  return (
    <div className="mt-6 space-y-4">
      {/* ✅ Badge "Données incomplètes" si nécessaire */}
      {showEnrich && missingFields.length > 0 && !product.aiEnriched && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <strong>Données incomplètes</strong> : Ce produit manque de données nutritionnelles 
              ({missingFields.join(', ')}). Score actuel calculé avec{' '}
              <strong>{Math.round((product?.scores?.confidence || 0) * 100)}% de confiance</strong>.
            </div>
          </div>
        </div>
      )}

      {/* ✅ Badge "Enrichi par IA" si déjà enrichi */}
      {product.aiEnriched && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <div className="text-sm text-purple-900">
              <strong>✨ Données complétées par IA</strong> : Les valeurs nutritionnelles manquantes 
              ont été estimées scientifiquement. Confiance actuelle :{' '}
              <strong>{Math.round((product?.scores?.confidence || 0) * 100)}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Bouton "Compléter les données" - uniquement si nécessaire */}
      {showEnrich && (
        <div>
          <button
            onClick={handleEnrichWithAI}
            disabled={isEnriching}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isEnriching ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span className="font-medium">Analyse en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">🔬 Compléter les données nutritionnelles</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-600 text-center mt-2">
            Notre IA va estimer les valeurs manquantes pour améliorer la précision du score
          </p>
        </div>
      )}

      {/* ✅ Modal résultat enrichissement */}
      {/* ✅ Modal résultat enrichissement */}
      {enrichmentResult && (
        <EnrichmentResult
          enrichmentData={enrichmentResult}
          productName={product.name || product.brand || 'Produit'}
          onClose={() => {
            setEnrichmentResult(null);
            // Recharger la page pour afficher le produit mis à jour
            window.location.reload();
          }}
        />
      )}

      {/* ✅ Section "Posez vos questions à l'IA" */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          💬 Posez vos questions à l'IA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleChatQuestion("Pourquoi ce score ?")}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Explique le score</span>
          </button>

          <button
            onClick={() => handleChatQuestion("Détails composition")}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Composition</span>
          </button>

          <button
            onClick={() => handleChatQuestion("Alternatives plus saines")}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Alternatives</span>
          </button>
        </div>
      </div>
    </div>
  );
};

