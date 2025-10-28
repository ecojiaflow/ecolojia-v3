// frontend/src/components/gdpr/ConsentManager.tsx
import React, { useState, useEffect } from 'react';
import { Shield, Cookie, Eye, Settings, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface ConsentChoices {
  essential: true; // Toujours true (obligatoire)
  analytics: boolean;
  healthData: boolean;
  marketing: boolean;
}

interface ConsentManagerProps {
  onAccept: (consents: ConsentChoices) => void;
  onRejecta: () => void;
}

const CONSENT_VERSION = '2.0'; // Version du consentement RGPD
const CONSENT_KEY = 'ecolojia_consent';

export const ConsentManager: React.FC<ConsentManagerProps> = ({ onAccept, onReject }) => {
  const [choices, setChoices] = useState<ConsentChoices>({
    essential: true,
    analytics: false,
    healthData: false,
    marketing: false
  });

  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Verifier si dej consenti
  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === CONSENT_VERSION) {
          // Consentement dej donne et  jour
          return;
        }
      } catch (e) {
        console.error('Erreur parsing consent:', e);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsents: ConsentChoices = {
      essential: true,
      analytics: true,
      healthData: true,
      marketing: true
    };
    saveAndAccept(allConsents);
  };

  const handleAcceptSelected = () => {
    saveAndAccept(choices);
  };

  const handleRejectAll = () => {
    const minimalConsents: ConsentChoices = {
      essential: true,
      analytics: false,
      healthData: false,
      marketing: false
    };
    saveAndAccept(minimalConsents);
    onReject?.();
  };

  const saveAndAccept = (consents: ConsentChoices) => {
    const consentData = {
      version: CONSENT_VERSION,
      choices: consents,
      timestamp: new Date().toISOString(),
      ip: 'masked' // Ne pas stocker la vraie IP cote client
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    onAccept(consents);
  };

  const categories = [
    {
      id: 'essential',
      name: 'Cookies essentiels',
      icon: <Shield className="w-5 h-5" />,
      required: true,
      description: 'Necessaires au fonctionnement du site',
      details: 'Ces cookies sont indispensables pour vous permettre de naviguer sur le site et d\'utiliser ses fonctionnalites, comme l\'acces aux zones securisees. Sans ces cookies, les services que vous avez demandes ne peuvent pas etre fournis.',
      cookies: [
        { name: 'ecolojia_token', purpose: 'Authentification utilisateur', duration: '7 jours' },
        { name: 'ecolojia_consent', purpose: 'Memorisation du consentement', duration: '1 an' },
        { name: 'ecolojia_session', purpose: 'Session de navigation', duration: 'Session' }
      ]
    },
    {
      id: 'healthData',
      name: 'aa Analyse nutritionnelle & Santé',
      icon: <Eye className="w-5 h-5" />,
      required: false,
      important: true,
      description: 'Analyse personnalisee de vos produits',
      details: 'Ces donnees nous permettent d\'analyser vos produits alimentaires, cosmetiques et detergents pour vous fournir des scores de Santé personnalises, des recommandations et des alternatives. Ces donnees peuvent inclure vos allergies, preferences alimentaires et historique d\'analyses.',
      legalBasis: 'Consentement explicite (RGPD Art. 9)',
      dataTypes: [
        'Historique des produits analyses',
        'Preferences alimentaires et allergies',
        'Scores et recommandations personnalisees',
        'Donnees nutritionnelles agregees'
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics & amelioration',
      icon: <Cookie className="w-5 h-5" />,
      required: false,
      description: 'Nous aide  ameliorer l\'application',
      details: 'Ces cookies collectent des informations sur la facon dont vous utilisez notre site, comme les pages que vous visitez le plus souvent. Toutes les informations sont anonymisees et ne peuvent pas etre utilisees pour vous identifier.',
      cookies: [
        { name: '_ga', purpose: 'Google Analytics', duration: '2 ans' },
        { name: '_gid', purpose: 'Google Analytics', duration: '24 heures' },
        { name: 'amplitude_id', purpose: 'Analytics produit', duration: '1 an' }
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing & personnalisation',
      icon: <Settings className="w-5 h-5" />,
      required: false,
      description: 'Contenus et offres personnalises',
      details: 'Ces cookies nous permettent de vous presenter des offres pertinentes et de personnaliser votre experience. Ils peuvent etre places par nous ou par des partenaires tiers.',
      cookies: [
        { name: 'fb_pixel', purpose: 'Facebook Ads', duration: '90 jours' },
        { name: 'google_ads', purpose: 'Google Ads', duration: '90 jours' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">a Votre vie privee nous importe</h2>
          <p className="text-green-50">
            ECOLOJIA utilise des cookies et traite des donnees pour vous offrir une experience personnalisee et securisee.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === 'details'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Details & cookies
            </button>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`border rounded-lg p-4 transition-all ${
                    category.required ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-0.5">{category.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          {category.name}
                          {category.required && (
                            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                              Obligatoire
                            </span>
                          )}
                          {category.important && !category.required && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Recommande
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {category.required ? (
                        <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-not-allowed opacity-75">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      ) : (
                        <button
                          onClick={() => setChoices({ ...choices, [category.id]: !choices[category.id as keyof ConsentChoices] })}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            choices[category.id as keyof ConsentChoices] ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              choices[category.id as keyof ConsentChoices] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {category.icon}
                      <span className="font-semibold">{category.name}</span>
                    </div>
                    {expandedCategory === category.id ? (
                      <ChevronUp className="w-5 h-5 text-neutral-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-600" />
                    )}
                  </button>
                  
                  {expandedCategory === category.id && (
                    <div className="p-4 bg-gray-50 border-t">
                      <p className="text-sm text-gray-700 mb-4">{category.details}</p>
                      
                      {category.legalBasis && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-1">Base legale</h4>
                          <p className="text-sm text-gray-600">{category.legalBasis}</p>
                        </div>
                      )}
                      
                      {category.dataTypes && (
                        <div className="mb-4">
                          <h4 className="font-medium text-sm mb-2">Types de donnees collectees</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {category.dataTypes.map((type, idx) => (
                              <li key={idx}>{type}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {category.cookies && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Cookies utilises</h4>
                          <div className="space-y-2">
                            {category.cookies.map((cookie, idx) => (
                              <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-mono text-sm">{cookie.name}</span>
                                    <p className="text-xs text-gray-600 mt-1">{cookie.purpose}</p>
                                  </div>
                                  <span className="text-xs text-neutral-700">{cookie.duration}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* RGPD Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Vos droits RGPD :</strong> Vous pouvez acceder, rectifier, supprimer vos donnees ou retirer votre consentement  tout moment depuis votre compte ou en nous contactant  privacy@ecoloji?.app
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRejectAll}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Refuser tout
            </button>
            <button
              onClick={handleAcceptSelected}
              className="px-6 py-3 bg-white border border-green-500 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium flex-1"
            >
              Accepter la selection
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium flex-1 shadow-lg hover:shadow-xl"
            >
              Accepter tout
            </button>
          </div>
          
          <p className="text-xs text-center text-neutral-700 mt-4">
            En cliquant sur "Accepter", vous consentez  l'utilisation de cookies et au traitement de vos donnees conformement  notre{' '}
            <a href="/privacy" className="text-green-700 hover:underline">politique de confidentialite</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentManager;



