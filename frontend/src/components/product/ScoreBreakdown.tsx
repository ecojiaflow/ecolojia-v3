import { ScoreBar } from '@/components/ui/ScoreBar';
import React from 'react';
import { Info } from 'lucide-react';

interface ScoreFactor {
  factor: string;
  impact: number;
  reason: string;
}

interface ScoreBreakdownProps {
  score: number;
  factors: ScoreFactor[];
  productScores?: any;
  product?: any;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  score,
  factors,
  productScores,
  product
}) => {
  const getActualScore = (factorName: string): number => {
    if (!productScores?.breakdown) return 50;
    
    const breakdown = productScores.breakdown;
    let item = null;
    
    // Mapping COMPLET pour TOUS les facteurs
    if (factorName.includes('NOVA')) item = breakdown.nova;
    if (factorName.includes('Nutri-Score')) item = breakdown.nutriscore;
    if (factorName.includes('Additifs')) item = breakdown.additives;
    if (factorName.includes('Éco-Score')) item = breakdown.ecoscore;
    if (factorName.includes('Emballage')) item = breakdown.packaging;
    if (factorName.includes('Origine')) item = breakdown.origin;
    if (factorName.includes('Éthique')) item = breakdown.ethics;
    
    // Structure backend V3 : {score: X} directement (PAS de maxScore)
    if (item && typeof item.score === 'number') {
      return item.score;
    }
    
    return 50;
  };

  const getNovaGroup = (score: number): number => {
    if (score >= 90) return 1;
    if (score >= 70) return 2;
    if (score >= 40) return 3;
    return 4;
  };

  const getDescription = (factorName: string, score: number): string => {
    if (factorName.includes('NOVA')) {
      const group = getNovaGroup(score);
      if (group === 1) return "Aliments bruts non transformés";
      if (group === 2) return "Ingrédients culinaires transformés";
      if (group === 3) return "Aliments transformés";
      return "Aliments ultra-transformés";
    }
    
    if (factorName.includes('Nutri-Score')) {
      if (score >= 90) return "Excellent profil nutritionnel";
      if (score >= 70) return "Bon profil nutritionnel";
      if (score >= 50) return "Profil nutritionnel moyen";
      if (score >= 30) return "Profil nutritionnel médiocre";
      return "Profil nutritionnel très médiocre";
    }
    
    if (factorName.includes('Éco-Score')) {
      if (score >= 90) return "Impact environnemental très faible";
      if (score >= 70) return "Impact environnemental faible";
      if (score >= 50) return "Impact environnemental modéré";
      if (score >= 30) return "Impact environnemental élevé";
      return "Impact environnemental très élevé";
    }
    
    if (factorName.includes('Emballage')) {
      if (score >= 90) return "Emballage très écologique";
      if (score >= 70) return "Emballage écologique";
      if (score >= 50) return "Emballage standard";
      if (score >= 30) return "Emballage peu écologique";
      return "Emballage très polluant";
    }
    
    if (factorName.includes('Origine')) {
      if (score >= 90) return "Origine locale et traçable";
      if (score >= 70) return "Bonne traçabilité";
      if (score >= 50) return "Traçabilité partielle";
      if (score >= 30) return "Peu d'informations sur l'origine";
      return "Origine inconnue";
    }
    
    if (factorName.includes('Additifs')) {
      if (score >= 90) return "Aucun additif préoccupant détecté";
      if (score >= 70) return "Peu d'additifs, rien d'alarmant";
      if (score >= 50) return "Quelques additifs à surveiller";
      if (score >= 30) return "Plusieurs additifs controversés";
      return "Nombreux additifs à risque";
    }
    
    if (factorName.includes('Éthique')) {
      if (score >= 90) return "Exemplaire (Bio + Équitable)";
      if (score >= 70) return "Bonnes pratiques éthiques";
      if (score >= 50) return "Quelques labels";
      if (score >= 30) return "Quelques problèmes éthiques";
      return "Problèmes éthiques majeurs";
    }
    
    if (score >= 70) return "Excellent";
    if (score >= 50) return "Bon";
    if (score >= 30) return "Moyen";
    return "À améliorer";
  };

  const getDetailedInfo = (factorName: string, score: number, product?: any): React.ReactNode => {
    if (factorName.includes('NOVA')) {
      const group = getNovaGroup(score);
      const dots = Array(4).fill(0).map((_, i) => (
        <span key={i} className={`text-2xl ${i < group ? 'opacity-100' : 'opacity-20'}`}>
          {i < group ? '●' : '○'}
        </span>
      ));
      
      const groupColors = {
        1: 'text-green-700 bg-green-50 border-green-200',
        2: 'text-green-600 bg-green-50 border-green-200',
        3: 'text-orange-600 bg-orange-50 border-orange-200',
        4: 'text-red-600 bg-red-50 border-red-200'
      };
      
      const groupLabels = {
        1: 'Groupe 1 - Aliments bruts',
        2: 'Groupe 2 - Ingrédients culinaires',
        3: 'Groupe 3 - Aliments transformés',
        4: 'Groupe 4 - Ultra-transformés'
      };
      
      return (
        <div className="space-y-3">
          <h3 className="font-bold text-base">Classification NOVA</h3>
          
          <div className={`p-4 rounded-lg border ${groupColors[group as keyof typeof groupColors]}`}>
            <div className="flex items-center justify-between mb-3">
              <strong className="text-lg">{groupLabels[group as keyof typeof groupLabels]}</strong>
              <div className="flex gap-1">{dots}</div>
            </div>
            <p className="text-sm">{getDescription(factorName, score)}</p>
          </div>
          
          <div className="text-sm space-y-1 text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-700">● Groupe 1</span>
              <span>Aliments bruts (fruits, légumes, viande fraîche)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">●● Groupe 2</span>
              <span>Ingrédients culinaires (huile, sucre, sel)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-600">●●● Groupe 3</span>
              <span>Aliments transformés (conserves, fromage, pain)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-600">●●●● Groupe 4</span>
              <span>Ultra-transformés (plats préparés, sodas)</span>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
            <strong>Votre produit : NOVA Groupe {group}</strong>
          </div>
        </div>
      );
    }
    
    if (factorName.includes('Additifs')) {
      if (score >= 90) {
        return (
          <div className="space-y-3">
            <h3 className="font-bold text-base">Additifs alimentaires</h3>
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✅</span>
                <strong className="text-green-800">Aucun additif préoccupant</strong>
              </div>
              <p className="text-sm text-green-700">Ce produit ne contient pas d'additifs à risque.</p>
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded text-sm"><strong>Score : {score}/100 - Excellent</strong></div>
          </div>
        );
      }
      
      if (score >= 70) {
        const additives = product?.foodData?.additives || [];
        
        return (
          <div className="space-y-3">
            <h3 className="font-bold text-base">Additifs alimentaires</h3>
            
            {additives.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-green-800 font-medium mb-2">
                  {additives.length} additif{additives.length > 1 ? 's' : ''} détecté{additives.length > 1 ? 's' : ''} :
                </p>
                {additives.map((additive: any, idx: number) => {
                  const code = additive.code || 'N/A';
                  const name = additive.name || '';
                  const riskLevel = additive.riskLevel || 'LOW';
                  
                  const bgColor = riskLevel === 'HIGH' ? 'bg-red-50 border-red-300' : riskLevel === 'MEDIUM' ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300';
                  const textColor = riskLevel === 'HIGH' ? 'text-red-800' : riskLevel === 'MEDIUM' ? 'text-orange-800' : 'text-green-800';
                  const icon = riskLevel === 'HIGH' ? '🚨' : riskLevel === 'MEDIUM' ? '⚠️' : '✅';
                  const risk = riskLevel === 'HIGH' ? 'Risque élevé' : riskLevel === 'MEDIUM' ? 'Risque modéré' : 'Risque faible';
                  
                  return (
                    <div key={idx} className={`p-3 rounded border ${bgColor} ${textColor}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{icon} {code}</p>
                          {name && <p className="text-xs mt-1 opacity-80 capitalize">{name}</p>}
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">{risk}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm text-green-700">Aucun additif détecté. Excellent !</p>
              </div>
            )}
            
            <div className="mt-3 p-2 bg-blue-50 rounded text-sm"><strong>Score : {score}/100</strong></div>
          </div>
        );
      }
      
      return (
        <div className="space-y-3">
          <h3 className="font-bold text-base">Additifs alimentaires</h3>
          <div className="p-3 bg-orange-50 rounded border border-orange-200 mb-3">
            <p className="text-sm text-orange-800"><strong>⚠️ Additifs à surveiller présents</strong></p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-red-50 rounded"><strong className="text-red-700">À éviter :</strong><div className="mt-1">E621 (glutamate), E951 (aspartame)</div></div>
            <div className="p-2 bg-orange-50 rounded"><strong className="text-orange-700">Modération :</strong><div className="mt-1">E330, E415</div></div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm"><strong>Score : {score}/100</strong></div>
        </div>
      );
    }
    
    if (factorName.includes('Éthique')) {
      if (score >= 90) {
        return (
          <div className="space-y-3">
            <h3 className="font-bold text-base">Impact éthique</h3>
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✅</span>
                <strong className="text-green-800">Pratiques exemplaires</strong>
              </div>
              <p className="text-sm text-green-700">Bio et/ou Équitable, sans huile de palme.</p>
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded text-sm"><strong>Score : {score}/100</strong></div>
          </div>
        );
      }
      
      return (
        <div className="space-y-3">
          <h3 className="font-bold text-base">Impact éthique</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2"><span>🌴</span><span><strong>Huile de palme :</strong> Déforestation</span></div>
            <div className="flex gap-2"><span>🏷️</span><span><strong>Labels :</strong> Bio, Équitable</span></div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm"><strong>Score : {score}/100</strong></div>
        </div>
      );
    }
    
    return <p className="text-sm">Score : {score}/100</p>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
        <Info className="w-6 h-6 mr-2 text-blue-600" />
        Pourquoi ce score de {score}/100 ?
      </h2>

      <div className="space-y-1">
        {factors.map((factor, index) => {
          const actualScore = getActualScore(factor.factor);
          const description = getDescription(factor.factor, actualScore);
          const detailedInfo = getDetailedInfo(factor.factor, actualScore, product);
          
          return (
            <ScoreBar
              key={index}
              label={factor.factor}
              score={actualScore}
              description={description}
              detailedInfo={detailedInfo}
            />
          );
        })}
      </div>

      <div className="mt-6 p-3 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">💡 Cliquez sur une jauge pour comprendre</p>
      </div>
    </div>
  );
};