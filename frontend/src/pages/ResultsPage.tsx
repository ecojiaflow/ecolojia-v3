import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ArrowRight, 
  MessageCircle, 
  BarChart3,
  Camera,
  Shield,
  Sparkles
} from 'lucide-react';
import { inferDomain } from '../utils/domain';

const ResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const barcode = searchParams.get('barcode');

  const getResultData = () => {
    if (location.state) return location.state;
    try {
      const stored = sessionStorage.getItem('ecolojia:lastResult');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const data = getResultData();
  const category = sessionStorage.getItem('ecolojia:lastCategory') || 'food';
  const __domain = inferDomain(data);
  const __isFood = __domain === 'food';
  const { product, scores } = data || {};
  const globalScore = scores?.global || scores?.overallScore || 50;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-[#1B9E4B] bg-[#F3FBF5] border-[#B7E99C]';
    if (score >= 60) return 'text-[#E9A100] bg-[#FFF8E6] border-[#FFE8A8]';
    if (score >= 40) return 'text-[#E9A100] bg-[#FFF8E6] border-[#FFE8A8]';
    return 'text-[#D04343] bg-[#FEF3F3] border-[#F8C9C9]';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'A eviter';
  };

  const getCategoryInfo = () => {
    if (category === 'cosmetics') {
      return {
        title: 'Analyse Cosmetique',
        icon: '💄',
        color: 'purple',
        description: 'Evaluation basee sur la composition INCI et les certifications'
      };
    }
    if (category === 'detergents') {
      return {
        title: 'Analyse Detergent',
        icon: '🧼',
        color: 'blue',
        description: 'Evaluation de l\'impact environnemental et efficacite'
      };
    }
    return {
      title: __isFood ? 'Analyse Alimentaire' : 'Analyse Produit',
      icon: '🍽️',
      color: 'green',
      description: __isFood 
        ? 'Scoring scientifique base sur 8 composantes (NOVA, Nutri-Score, Additifs, etc.)'
        : 'Synthese basee sur composition, securite et impact environnemental'
    };
  };

  const categoryInfo = getCategoryInfo();

  const getStrengthsWeaknesses = () => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (globalScore >= 80) {
      strengths.push('Score global excellent');
    }
    if (scores?.breakdown?.nova?.score >= 80) {
      strengths.push('Peu transforme (NOVA faible)');
    }
    if (scores?.breakdown?.additives?.score >= 80) {
      strengths.push('Aucun additif controverse');
    }
    if (scores?.breakdown?.labels?.score >= 70) {
      strengths.push('Labels de qualite presents');
    }

    if (globalScore < 50) {
      weaknesses.push('Score global faible');
    }
    if (scores?.breakdown?.sugars?.value > 25) {
      weaknesses.push(`Teneur elevee en sucres (${scores.breakdown.sugars.value}g/100g)`);
    }
    if (scores?.breakdown?.salt?.value > 2) {
      weaknesses.push(`Teneur elevee en sel (${scores.breakdown.salt.value}g/100g)`);
    }
    if (scores?.breakdown?.additives?.count > 5) {
      weaknesses.push(`Contient ${scores.breakdown.additives.count} additifs`);
    }

    return { strengths, weaknesses };
  };

  const { strengths, weaknesses } = getStrengthsWeaknesses();

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F9FAF8] to-[#F7F9F4] flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-8 text-center border border-[#DDE9DA]">
          <AlertTriangle className="w-16 h-16 text-[#E9A100] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#232323] mb-3">
            Aucune donnee disponible
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            Nous n'avons pas trouve de resultats d'analyse. Veuillez scanner un produit.
          </p>
          <button
            onClick={() => navigate('/scan')}
            className="w-full px-6 py-3 bg-[#7DDE4A] text-[#0E1A0D] rounded-[16px] font-semibold hover:bg-[#5FC72F] transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
          >
            Scanner un produit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAF8] to-[#F7F9F4] pb-20">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        <div className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-6 border border-[#DDE9DA]">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-4xl">{categoryInfo.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#232323] mb-1">
                {product?.name || 'Produit inconnu'}
              </h1>
              <p className="text-sm text-[#6B6B6B]">
                Code-barres: {barcode || product?.barcode || 'Non disponible'}
              </p>
            </div>
          </div>

          <div className={`p-6 rounded-[16px] border-2 ${getScoreColor(globalScore)} transition-all`}>
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{globalScore}</div>
              <div className="text-lg font-semibold mb-1">{getScoreLabel(globalScore)}</div>
              <p className="text-sm opacity-80">Score Global / 100</p>
            </div>
          </div>
        </div>

        {strengths.length > 0 && (
          <div className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-6 border border-[#DDE9DA]">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-[#1B9E4B]" />
              <h2 className="text-xl font-bold text-[#232323]">Points Forts</h2>
            </div>
            <ul className="space-y-3">
              {strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#1B9E4B] mt-2 flex-shrink-0" />
                  <span className="text-[#3B3B3B]">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {weaknesses.length > 0 && (
          <div className="bg-white rounded-[16px] shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-6 border border-[#DDE9DA]">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-[#E9A100]" />
              <h2 className="text-xl font-bold text-[#232323]">Points d'Attention</h2>
            </div>
            <ul className="space-y-3">
              {weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#E9A100] mt-2 flex-shrink-0" />
                  <span className="text-[#3B3B3B]">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          <div className="bg-[#FFF8E6] border border-[#FFE8A8] rounded-[16px] p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#E9A100] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#6B4D00]">
                <strong>Information importante:</strong> ECOLOJIA n'est pas un dispositif medical. 
                Les scores sont informatifs, bases sur des methodologies scientifiques (OMS, ANSES, EFSA). 
                Ils ne remplacent pas l'avis d'un professionnel de sante qualifie.
              </div>
            </div>
          </div>

          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[16px] p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#2E7DD7] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#1E3A8A]">
                <strong>Transparence IA:</strong> Cette analyse utilise l'intelligence artificielle 
                pour completer les donnees manquantes. Verifiez toujours les ingredients sur l'emballage physique.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate(`/product/${product?._id || barcode}`, { 
              state: { fromResults: true } 
            })}
            className="w-full bg-[#2E7DD7] text-white py-4 rounded-[16px] font-semibold hover:bg-[#1D4ED8] transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Voir analyse complete (8 composantes)</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate(`/chat?product=${barcode}`, {
              state: {
                productContext: product,
                initialMessage: `Que penses-tu de ce produit ? Score: ${globalScore}/100`
              }
            })}
            className="w-full bg-[#236D3E] text-white py-4 rounded-[16px] font-semibold hover:bg-[#1A5230] transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Discuter avec l'IA nutritionniste</span>
          </button>

          <button
            onClick={() => navigate('/scan')}
            className="w-full bg-white border-2 border-[#DDE9DA] text-[#3B3B3B] py-4 rounded-[16px] font-semibold hover:bg-[#F7F9F4] transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            <span>Scanner produit suivant</span>
          </button>
        </div>

        <div className="bg-[#F3FBEA] border border-[#D4F1C0] rounded-[16px] p-4">
          <h3 className="font-semibold text-[#295D19] mb-2">
            {categoryInfo.title}
          </h3>
          <p className="text-sm text-[#377A1F]">
            {categoryInfo.description}
          </p>
        </div>

      </div>
    </div>
  );
};

export default ResultsPage;