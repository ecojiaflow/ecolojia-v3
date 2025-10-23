import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, QrCode, ArrowRight, Sparkles } from 'lucide-react';

export const ScannerChoice: React.FC = () => {
  const navigate = useNavigate();

  const scanOptions = [
    {
      id: 'barcode',
      title: 'Scanner code-barres',
      description: 'Scannez le code-barres pour une analyse complète du produit',
      icon: QrCode,
      path: '/scan/barcode',
      color: 'from-blue-500 to-blue-600',
      features: ['Analyse instantanée', 'Base de données complète', 'Scores détaillés']
    },
    {
      id: 'ocr',
      title: 'Analyser ingrédients',
      description: 'Photographiez la liste d\'ingrédients pour une analyse OCR',
      icon: Camera,
      path: '/ocr',
      color: 'from-green-500 to-green-600',
      features: ['Reconnaissance de texte', 'Détection allergènes', 'IA avancée']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Scanner Intelligent</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Choisissez votre méthode d'analyse
            </h1>
            <p className="text-lg text-gray-600">
              Deux façons d'analyser vos produits avec notre IA
            </p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {scanOptions.map((option) => (
            <div
              key={option.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              onClick={() => navigate(option.path)}
            >
              <div className="p-8">
                {/* Icon et Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${option.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <option.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {option.id === 'barcode' ? 'Recommandé' : 'Avancé'}
                  </div>
                </div>

                {/* Contenu */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {option.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {option.description}
                </p>

                {/* Features */}
                <div className="space-y-2 mb-8">
                  {option.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 px-6 rounded-xl hover:bg-gray-800 transition-colors group-hover:bg-gray-800">
                  <span className="font-medium">Commencer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info complémentaire */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-6 text-center">
          <h3 className="font-semibold text-blue-900 mb-2">Besoin d'aide ?</h3>
          <p className="text-blue-700 text-sm mb-4">
            Choisissez "Code-barres" si le produit en a un, sinon "Ingrédients" pour l'analyse OCR
          </p>
          <button
            onClick={() => navigate('/help')}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Guide d'utilisation →
          </button>
        </div>
      </div>
    </div>
  );
};