import React from 'react';
import { FlaskConical, Info, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  additives: string[];
  source?: string;
}

// Base de données simplifiée des additifs courants
const ADDITIVES_INFO: Record<string, { name: string; category: string; level: 'ok' | 'watch' | 'limit' }> = {
  'E100': { name: 'Curcumine', category: 'Colorant', level: 'ok' },
  'E150A': { name: 'Caramel', category: 'Colorant', level: 'ok' },
  'E160A': { name: 'Carotenes', category: 'Colorant', level: 'ok' },
  'E170': { name: 'Carbonate de calcium', category: 'Colorant', level: 'ok' },
  'E200': { name: 'Acide sorbique', category: 'Conservateur', level: 'ok' },
  'E202': { name: 'Sorbate de potassium', category: 'Conservateur', level: 'ok' },
  'E211': { name: 'Benzoate de sodium', category: 'Conservateur', level: 'watch' },
  'E220': { name: 'Sulfites', category: 'Conservateur', level: 'watch' },
  'E250': { name: 'Nitrite de sodium', category: 'Conservateur', level: 'limit' },
  'E251': { name: 'Nitrate de sodium', category: 'Conservateur', level: 'limit' },
  'E300': { name: 'Acide ascorbique', category: 'Antioxydant', level: 'ok' },
  'E306': { name: 'Tocopherols', category: 'Antioxydant', level: 'ok' },
  'E322': { name: 'Lecithines', category: 'Emulsifiant', level: 'ok' },
  'E330': { name: 'Acide citrique', category: 'Acidifiant', level: 'ok' },
  'E334': { name: 'Acide tartrique', category: 'Acidifiant', level: 'ok' },
  'E407': { name: 'Carraghenanes', category: 'Epaississant', level: 'watch' },
  'E410': { name: 'Gomme caroube', category: 'Epaississant', level: 'ok' },
  'E412': { name: 'Gomme guar', category: 'Epaississant', level: 'ok' },
  'E414': { name: 'Gomme arabique', category: 'Epaississant', level: 'ok' },
  'E415': { name: 'Gomme xanthane', category: 'Epaississant', level: 'ok' },
  'E440': { name: 'Pectine', category: 'Gelifiant', level: 'ok' },
  'E450': { name: 'Phosphates', category: 'Emulsifiant', level: 'watch' },
  'E451': { name: 'Triphosphates', category: 'Emulsifiant', level: 'watch' },
  'E460': { name: 'Cellulose', category: 'Epaississant', level: 'ok' },
  'E466': { name: 'Carboxymethylcellulose', category: 'Epaississant', level: 'watch' },
  'E471': { name: 'Mono et diglycerides', category: 'Emulsifiant', level: 'ok' },
  'E472': { name: 'Esters glycerides', category: 'Emulsifiant', level: 'ok' },
  'E472A': { name: 'Esters acetiques', category: 'Emulsifiant', level: 'watch' },
  'E472B': { name: 'Esters lactiques', category: 'Emulsifiant', level: 'watch' },
  'E472C': { name: 'Esters citriques', category: 'Emulsifiant', level: 'watch' },
  'E472E': { name: 'Esters diacetyl-tartriques', category: 'Emulsifiant', level: 'watch' },
  'E500': { name: 'Carbonates de sodium', category: 'Levant', level: 'ok' },
  'E503': { name: 'Carbonates ammonium', category: 'Levant', level: 'ok' },
  'E621': { name: 'Glutamate monosodique', category: 'Exhausteur', level: 'watch' },
  'E951': { name: 'Aspartame', category: 'Edulcorant', level: 'watch' },
  'E955': { name: 'Sucralose', category: 'Edulcorant', level: 'watch' },
  'E960': { name: 'Stevia', category: 'Edulcorant', level: 'ok' }
};

const getAdditiveInfo = (code: string) => {
  const normalized = code.toUpperCase().replace(/^EN:/, '').replace(/-/g, '');
  return ADDITIVES_INFO[normalized] || { name: null, category: 'Additif', level: 'watch' as const };
};

const levelConfig = {
  ok: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Courant' },
  watch: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertCircle, label: 'A surveiller' },
  limit: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'A limiter' }
};

const AdditivesCard: React.FC<Props> = ({ additives, source }) => {
  if (!additives || additives.length === 0) return null;

  // Compter par niveau
  const counts = { ok: 0, watch: 0, limit: 0 };
  additives.forEach(code => {
    const info = getAdditiveInfo(code);
    counts[info.level]++;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
        <div className="flex items-center gap-2 text-white">
          <FlaskConical className="w-5 h-5" />
          <h3 className="font-semibold">Additifs detectes</h3>
          <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-sm">
            {additives.length}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Résumé visuel */}
        <div className="flex gap-2">
          {counts.ok > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs">
              <CheckCircle className="w-3 h-3" />
              {counts.ok} courant{counts.ok > 1 ? 's' : ''}
            </span>
          )}
          {counts.watch > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs">
              <AlertCircle className="w-3 h-3" />
              {counts.watch} a surveiller
            </span>
          )}
          {counts.limit > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs">
              <AlertCircle className="w-3 h-3" />
              {counts.limit} a limiter
            </span>
          )}
        </div>

        {/* Liste des additifs */}
        <div className="space-y-2">
          {[...additives].sort((a, b) => {
              const levelOrder = { limit: 0, watch: 1, ok: 2 };
              const levelA = levelOrder[getAdditiveInfo(a).level] ?? 1;
              const levelB = levelOrder[getAdditiveInfo(b).level] ?? 1;
              return levelA - levelB;
            }).slice(0, 6).map((code, idx) => {
            const info = getAdditiveInfo(code);
            const config = levelConfig[info.level];
            
            return (
              <div 
                key={idx}
                className={`flex items-center justify-between p-2.5 rounded-lg border ${config.color}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-sm">{code.toUpperCase()}</span>
                  {info.name && (
                    <span className="text-sm opacity-80">• {info.name}</span>
                  )}
                </div>
                <span className="text-xs opacity-70">{info.category}</span>
              </div>
            );
          })}
          
          {additives.length > 6 && (
            <p className="text-xs text-gray-500 text-center pt-1">
              + {additives.length - 6} autre{additives.length - 6 > 1 ? 's' : ''} additif{additives.length - 6 > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <p>
            Les additifs ne sont pas tous problematiques. Leur impact depend de la frequence de consommation et des quantites.
            {source === 'regex_extracted' && (
              <span className="block mt-1 italic">Extraction automatique depuis la liste d'ingredients.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdditivesCard;


