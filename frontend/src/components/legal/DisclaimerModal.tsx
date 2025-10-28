import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check } from 'lucide-react';

const DISCLAIMER_VERSION = '1.0';
const DISCLAIMER_KEY = 'ecolojia_disclaimer_accepted';

interface DisclaimerModalProps {
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  const [accepted, setAccepted] = useState(false);
  const [hasReadAll, setHasReadAll] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isBottom && !hasReadAll) {
      setHasReadAll(true);
    }
  };

  const handleAccept = () => {
    if (!accepted) return;
    
    const acceptanceData = {
      version: DISCLAIMER_VERSION,
      acceptedAt: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    localStorage.setItem(DISCLAIMER_KEY, JSON.stringify(acceptanceData));
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                Information Importante
              </h2>
              <p className="text-white/90 text-sm mt-1">
                Veuillez lire attentivement avant de continuer
              </p>
            </div>
          </div>
        </div>

        {/* Content scrollable */}
        <div 
          className="p-6 overflow-y-auto max-h-[50vh] space-y-4"
          onScroll={handleScroll}
        >
          
          {/* Disclaimer principal */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
              ECOLOJIA n'est pas un dispositif médical
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              ECOLOJIA est un <strong>outil d'information nutritionnelle</strong>, 
              conçu à des fins éducatives. Il ne remplace en aucun cas l'avis 
              d'un professionnel de santé.
            </p>
          </div>

          {/* Ce que nous fournissons */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">✅ Ce que nous fournissons :</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Analyses basées sur méthodologies scientifiques reconnues (OMS, ANSES, EFSA)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Informations pédagogiques sur la composition nutritionnelle
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Assistant IA pour répondre à vos questions générales
              </li>
            </ul>
          </div>

          {/* Ce que nous ne sommes PAS */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">❌ Ce que nous ne sommes PAS :</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Des médecins, nutritionnistes ou professionnels de santé diplômés
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Un substitut à une consultation médicale ou nutritionnelle
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Un outil de diagnostic, prescription ou traitement
              </li>
            </ul>
          </div>

          {/* Recommandation */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-gray-900 mb-2">🏥 Quand consulter un professionnel :</h4>
            <p className="text-sm text-gray-700">
              Pour tout conseil personnalisé, suivi nutritionnel, pathologie 
              (diabète, allergies, troubles alimentaires, etc.), ou questions 
              médicales spécifiques, consultez un <strong>professionnel de santé 
              diplômé</strong> (médecin, nutritionniste, diététicien).
            </p>
          </div>

          {/* Intelligence Artificielle */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
            <h4 className="font-semibold text-gray-900 mb-2">🤖 À propos de notre IA :</h4>
            <p className="text-sm text-gray-700">
              Notre assistant utilise l'intelligence artificielle pour combler 
              les données manquantes et répondre à vos questions. Ces 
              <strong> estimations sont indicatives</strong> et doivent être 
              vérifiées sur l'étiquette du produit. L'IA peut faire des erreurs.
            </p>
          </div>

          {/* Scroll indicator */}
          {!hasReadAll && (
            <div className="text-center text-sm text-neutral-700 italic animate-pulse">
              ↓ Faites défiler pour lire l'intégralité ↓
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          
          {/* Checkbox acceptation */}
          <label 
            className={`flex items-start space-x-3 mb-4 cursor-pointer ${
              !hasReadAll ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={!hasReadAll}
              className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-700">
              <strong>J'ai lu et compris</strong> que ECOLOJIA est un outil informatif 
              et ne remplace pas l'avis d'un professionnel de santé. J'accepte de 
              l'utiliser en connaissance de cause.
            </span>
          </label>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAccept}
              disabled={!accepted}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                accepted
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-neutral-700 cursor-not-allowed'
              }`}
            >
              <Check className="w-5 h-5 inline mr-2" />
              Accepter et Continuer
            </button>
          </div>

          {/* Legal links */}
          <p className="text-xs text-neutral-700 text-center mt-4">
            En continuant, vous acceptez nos{' '}
            <a href="/terms" target="_blank" className="text-green-600 hover:underline">
              Conditions d'Utilisation
            </a>{' '}
            et notre{' '}
            <a href="/privacy" target="_blank" className="text-green-600 hover:underline">
              Politique de Confidentialité
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper pour vérifier si disclaimer accepté
export const hasAcceptedDisclaimer = (): boolean => {
  try {
    const stored = localStorage.getItem(DISCLAIMER_KEY);
    if (!stored) return false;
    
    const data = JSON.parse(stored);
    return data.version === DISCLAIMER_VERSION;
  } catch {
    return false;
  }
};

export default DisclaimerModal;
