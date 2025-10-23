import React, { useState } from 'react';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface NovaBadgeProps {
  novaGroup?: number | null;
  typeTransformation?: 'culinaire' | 'industrielle' | null;
  className?: string;
  showDetails?: boolean;
}

const NOVA_CONFIG = {
  1: {
    label: 'Aliment naturel',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '🥬',
    message: 'Non transformé ou minimalement transformé',
    description: 'Aliment brut ou très peu transformé. Excellent choix !',
    examples: '🥬 Légumes frais, 🍎 Fruits, 🥩 Viande non préparée',
    alert: null
  },
  2: {
    label: 'Transformation minimale',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: '🧈',
    message: 'Ingrédient culinaire de base',
    description: 'Ingrédients simples extraits d\'aliments naturels.',
    examples: '🧈 Beurre, 🧂 Sel, 🍯 Sucre, 🫒 Huile',
    alert: null
  },
  3: {
    label: 'Transformation culinaire',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: '🥖',
    message: 'Préparé à partir d\'ingrédients simples',
    description: 'Aliment préparé avec des ingrédients culinaires de base.',
    examples: '🥖 Pain artisanal, 🧀 Fromage, 🥫 Conserves maison',
    alert: {
      type: 'info',
      title: 'Transformation culinaire vs industrielle',
      text: 'Les produits NOVA 3 peuvent être bons pour la santé s\'ils sont préparés simplement (pain artisanal, fromages). Le niveau de transformation dépend des additifs et procédés utilisés.'
    }
  },
  4: {
    label: 'Ultra-transformé',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: '🚨',
    message: 'Aliment ultra-transformé industriellement',
    description: 'Formulation industrielle avec additifs, sucres ajoutés et procédés complexes.',
    examples: '🍟 Nuggets industriels, 🍪 Biscuits emballés, 🥤 Sodas, 🍕 Pizzas surgelées',
    alert: {
      type: 'danger',
      title: '⚠️ RECOMMANDATION ANSES',
      text: 'À limiter fortement. Privilégiez des alternatives faites maison ou peu transformées (Groupe 1-2).',
      science: '📊 Études scientifiques : Risques accrus de maladies chroniques (+23% cardiovasculaires, +53% diabète type 2). Sources : BMJ 2024, INSERM 2023.'
    }
  }
};

export const NovaBadge: React.FC<NovaBadgeProps> = ({
  novaGroup,
  typeTransformation,
  className = '',
  showDetails = true
}) => {
  const [showInfo, setShowInfo] = useState(false);

  if (!novaGroup || novaGroup < 1 || novaGroup > 4) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
        <span>NOVA : Non disponible</span>
      </div>
    );
  }

  const config = NOVA_CONFIG[novaGroup as keyof typeof NOVA_CONFIG];

  return (
    <div className={`relative ${className}`}>
      {/* Badge principal - SANS bandeau rouge par défaut */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${config.color}`}>
        <span className="text-lg">{config.icon}</span>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">Groupe NOVA {novaGroup}</span>
          <span className="text-xs opacity-80">{config.label}</span>
        </div>
        
        {showDetails && (
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="ml-2 p-1 hover:bg-white/50 rounded-full transition"
            title="En savoir plus"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message contextuel LÉGER (seulement pour Groupe 3) */}
      {novaGroup === 3 && typeTransformation && (
        <div className={`mt-2 p-3 rounded-lg text-sm ${
          typeTransformation === 'culinaire' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-orange-50 text-orange-800 border border-orange-200'
        }`}>
          {typeTransformation === 'culinaire' ? (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">✅ Transformation culinaire</p>
                <p className="text-xs mt-1">
                  Préparation simple avec peu d'ingrédients.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">⚠️ Transformation industrielle</p>
                <p className="text-xs mt-1">
                  Contient des additifs ou procédés industriels.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panneau d'information détaillé (POPUP) */}
      {showInfo && (
        <div className="absolute z-50 mt-2 left-0 right-0 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-4 w-96 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-900">🔬 Comprendre NOVA</h4>
            <button
              onClick={() => setShowInfo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Info générale NOVA */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>💡 Important :</strong> NOVA mesure le <strong>niveau de transformation</strong>, 
                pas la qualité nutritionnelle. Un pain artisanal (Groupe 3) reste un bon aliment !
              </p>
            </div>

            {/* Description du groupe */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">{config.message}</p>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>

            {/* Exemples */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">Exemples :</p>
              <p className="text-sm">{config.examples}</p>
            </div>

            {/* ALERTE SCIENTIFIQUE (seulement dans la popup) */}
            {config.alert && (
              <div className={`rounded-lg p-4 ${
                config.alert.type === 'danger' 
                  ? 'bg-red-50 border-2 border-red-300 text-red-900' 
                  : 'bg-orange-50 border border-orange-200 text-orange-900'
              }`}>
                <p className="font-bold text-sm mb-2">{config.alert.title}</p>
                <p className="text-sm mb-2">{config.alert.text}</p>
                {config.alert.science && (
                  <div className="mt-2 pt-2 border-t border-red-200">
                    <p className="text-xs">{config.alert.science}</p>
                  </div>
                )}
              </div>
            )}

            {/* Source */}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Classification selon <strong>INSERM / ANSES 2024</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovaBadge;
