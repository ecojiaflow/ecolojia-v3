import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Utensils,
  Leaf,
  Egg,
  Wheat,
  Droplets,
  Milk,
  Cookie,
  Calendar,
  Lightbulb,
  ShieldAlert,
  XCircle,
  ExternalLink
} from 'lucide-react';

/**
 * ReperesEcolojiaPage.tsx - Fiche Fondatrice (FOUNDATION_LEARN_CARD)
 * Sources : PNNS, EU RI 1169/2011, OMS, WCRF, ANSES
 */

const PLATE_SECTIONS = [
  { percent: '~50%', label: 'Legumes', emoji: '🥬', color: 'bg-green-100 border-green-300 text-green-800' },
  { percent: '~25%', label: 'Proteines', emoji: '🥚', color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { percent: '~25%', label: 'Feculents', emoji: '🍞', color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { percent: '+', label: 'Bon gras', emoji: '🫒', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  { percent: '+', label: 'Eau', emoji: '💧', color: 'bg-blue-100 border-blue-300 text-blue-800' },
];

const MACRO_RULES = [
  { macro: 'Proteines', rule: 'Une source a chaque repas', examples: 'Oeuf, poisson, legumineuses, volaille', emoji: '🥚', color: 'bg-orange-50 border-orange-200' },
  { macro: 'Glucides', rule: 'Jamais seuls', examples: 'Toujours associer fibres ou proteines', emoji: '🍞', color: 'bg-amber-50 border-amber-200' },
  { macro: 'Lipides', rule: 'Qualite + varier', examples: 'Olive, colza, poissons gras, oleagineux', emoji: '🫒', color: 'bg-yellow-50 border-yellow-200' },
  { macro: 'Fibres', rule: 'A chaque repas', examples: 'Legumes, fruits entiers, complets, legumineuses', emoji: '🥬', color: 'bg-green-50 border-green-200' },
];

const CATEGORIES = [
  {
    id: 'vegetables',
    title: 'Legumes & Fruits',
    emoji: '🥬',
    icon: Leaf,
    color: 'bg-green-500',
    lightColor: 'bg-green-50 border-green-200',
    repere: 'Au moins 5 portions/jour',
    reflexe: 'A chaque repas, commencer par les legumes.',
    points: ['Fibres, vitamines, mineraux, antioxydants', 'Satiete avec peu de calories', 'Varier les couleurs = varier les nutriments']
  },
  {
    id: 'proteins',
    title: 'Proteines',
    emoji: '🥚',
    icon: Egg,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50 border-orange-200',
    repere: 'Viande rouge : limiter a ~500g/semaine (OMS/WCRF)',
    reflexe: 'Une source de proteines a chaque repas.',
    points: ['Sources : oeufs, poisson, volaille, legumineuses, viande', 'Role : muscles, enzymes, hormones, satiete', 'Alterner animal et vegetal']
  },
  {
    id: 'starchy',
    title: 'Feculents',
    emoji: '🍞',
    icon: Wheat,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 border-amber-200',
    repere: 'Privilegier complets ou semi-complets',
    reflexe: 'Toujours associer a fibres ou proteines.',
    points: ['Source d energie durable', 'Le probleme n est pas le glucide, c est le contexte', 'Seul + transforme + repete = vigilance']
  },
  {
    id: 'fats',
    title: 'Matieres grasses',
    emoji: '🫒',
    icon: Droplets,
    color: 'bg-yellow-500',
    lightColor: 'bg-yellow-50 border-yellow-200',
    repere: 'Cuisson : olive/colza - Assaisonnement : colza, noix, olive',
    reflexe: 'Varier les sources, privilegier vegetales.',
    points: ['Essentielles : hormones, cerveau, vitamines', 'Priorite : huiles vegetales, poissons gras, oleagineux', 'Vigilance : friture repetee, huiles degradees']
  },
  {
    id: 'dairy',
    title: 'Produits laitiers',
    emoji: '🥛',
    icon: Milk,
    color: 'bg-sky-500',
    lightColor: 'bg-sky-50 border-sky-200',
    repere: 'Repere courant : 2 portions/jour',
    reflexe: 'Adapter selon tolerance et preferences.',
    points: ['Apport calcium et proteines', 'Alternatives : legumes verts, eaux calciques, oleagineux', 'Pas obligatoire si autres sources de calcium']
  },
  {
    id: 'pleasure',
    title: 'Produits plaisir',
    emoji: '🍫',
    icon: Cookie,
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50 border-pink-200',
    repere: 'Occasionnel, sans culpabilite',
    reflexe: 'Plaisir conscient, pas automatisme quotidien.',
    points: ['Produits a faible interet nutritionnel', 'Formules surtout pour le gout', 'La repetition compte, pas le produit isole']
  },
];

const FREQUENCY_LEVELS = [
  { level: 'Base quotidienne', principle: 'Structure chaque repas', examples: 'Legumes, eau, feculents', color: 'bg-green-100 border-green-300', dot: 'bg-green-500' },
  { level: 'Regulier', principle: 'Revient souvent', examples: 'Poisson, legumineuses, fruits, laitiers', color: 'bg-emerald-100 border-emerald-300', dot: 'bg-emerald-500' },
  { level: 'Occasionnel', principle: 'La repetition compte', examples: 'Produits plaisir, charcuterie', color: 'bg-amber-100 border-amber-300', dot: 'bg-amber-500' },
  { level: 'A questionner si frequent', principle: 'Plus c est rare, mieux c est', examples: 'Ultra-transformes repetes', color: 'bg-orange-100 border-orange-300', dot: 'bg-orange-500' },
  { level: 'Si consomme', principle: 'Occasionnel et modere', examples: 'Alcool', color: 'bg-red-100 border-red-300', dot: 'bg-red-500' },
];

const UNIVERSAL_RULES = [
  { number: 1, rule: 'Proteines a chaque repas', detail: 'Satiete durable, evite les fringales' },
  { number: 2, rule: 'Fibres a chaque repas', detail: 'Digestion, glycemie stable' },
  { number: 3, rule: 'Eau = boisson principale', detail: 'Limiter boissons sucrees (calories invisibles)' },
  { number: 4, rule: 'Ultra-transforme : reduire la repetition', detail: '1x OK, tous les jours = probleme' },
  { number: 5, rule: 'Varier les sources', detail: 'Limite les expositions invisibles' },
];

const EXPOSURES = [
  { exposure: 'Sucres ajoutes', vigilance: 'Cumul quotidien', reflexe: 'Lire les etiquettes, varier', emoji: '🍬' },
  { exposure: 'Additifs', vigilance: 'Cumul sur plusieurs produits', reflexe: 'Privilegier listes courtes', emoji: '🧪' },
  { exposure: 'Pesticides', vigilance: 'Fruits/legumes non bio', reflexe: 'Rincer, brosser, eplucher selon le cas', emoji: '🍎' },
  { exposure: 'Plastique', vigilance: 'Chauffage, contact gras/acide', reflexe: 'Verre > metal > plastique', emoji: '🫙' },
  { exposure: 'Metaux lourds', vigilance: 'Gros poissons', reflexe: 'Varier especes, privilegier petits poissons', emoji: '🐟' },
];

const NOT_ECOLOJIA = [
  'Diagnostiquer une maladie',
  'Prescrire un regime',
  'Juger (bon / mauvais)',
  'Creer de la peur',
  'Imposer un dogme',
];

const SOURCES = ['PNNS', 'EU RI 1169/2011', 'OMS', 'WCRF', 'ANSES'];

const SectionHeader: React.FC<{ id: string; icon: React.ElementType; title: string }> = ({ id, icon: Icon, title }) => (
  <div id={id} className="scroll-mt-24 flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
  </div>
);

const SignatureQuote: React.FC = () => (
  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <span className="text-2xl">🌿</span>
      <div>
        <p className="text-emerald-800 font-medium leading-relaxed">L ensemble du repas compte plus qu un aliment isole.</p>
        <p className="text-emerald-800 font-medium leading-relaxed">L ensemble de la semaine compte plus qu un repas isole.</p>
      </div>
    </div>
  </div>
);

const ReperesEcolojiaPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center text-emerald-100 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Reperes Ecolojia</h1>
          </div>
          <p className="text-emerald-100 text-sm mb-4">Adulte en bonne sante - Vision globale</p>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <p className="text-sm leading-relaxed">
              <strong>L ensemble du repas compte plus qu un aliment isole.</strong><br />
              <strong>L ensemble de la semaine compte plus qu un repas isole.</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* Section 0 - Mode emploi */}
        <section id="reperes-intro" className="scroll-mt-24">
          <SectionHeader id="" icon={Lightbulb} title="Comment lire Ecolojia en 20 secondes" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <p className="text-gray-700">Ecolojia ne juge pas les produits. <strong>Ecolojia montre leur place.</strong></p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="font-semibold text-green-800 text-sm">Base</div>
                <div className="text-xs text-green-700">Structure chaque repas</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="font-semibold text-emerald-800 text-sm">Regulier</div>
                <div className="text-xs text-emerald-700">Revient souvent</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="font-semibold text-amber-800 text-sm">Occasionnel</div>
                <div className="text-xs text-amber-700">Plaisir ponctuel</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <div className="font-semibold text-orange-800 text-sm">A questionner</div>
                <div className="text-xs text-orange-700">Si trop frequent</div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 italic">Un produit n est jamais un verdict. C est sa place dans l ensemble qui compte.</p>
            </div>
          </div>
        </section>

        {/* Section 1 - Assiette */}
        <section id="reperes-assiette" className="scroll-mt-24">
          <SectionHeader id="" icon={Utensils} title="L assiette equilibree" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="grid grid-cols-5 gap-2 mb-6">
              {PLATE_SECTIONS.map((section, i) => (
                <div key={i} className={`p-3 rounded-xl border text-center ${section.color}`}>
                  <div className="text-2xl mb-1">{section.emoji}</div>
                  <div className="font-bold text-lg">{section.percent}</div>
                  <div className="text-xs">{section.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-sm text-emerald-800">Ce n est pas la perfection qui compte, c est la structure.</p>
            </div>
          </div>
        </section>

        {/* Section 2 - Macros */}
        <section id="reperes-macros" className="scroll-mt-24">
          <SectionHeader id="" icon={Lightbulb} title="Les 4 regles macros" />
          <div className="space-y-3">
            {MACRO_RULES.map((item, i) => (
              <div key={i} className={`p-4 rounded-xl border ${item.color}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{item.macro}</div>
                    <div className="text-sm text-gray-600">{item.rule}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 ml-11">{item.examples}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 - Categories */}
        {CATEGORIES.map((cat) => (
          <section key={cat.id} id={`reperes-${cat.id}`} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                <cat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{cat.title}</h2>
                <span className="text-2xl">{cat.emoji}</span>
              </div>
            </div>
            <div className={`rounded-2xl border p-5 ${cat.lightColor}`}>
              <ul className="space-y-2 mb-4">
                {cat.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 mt-1">•</span>
                    {point}
                  </li>
                ))}
              </ul>
              <div className="bg-white/60 rounded-xl p-3 mb-3">
                <p className="text-xs text-gray-600"><strong>Repere :</strong> {cat.repere}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <p className="text-sm text-gray-800"><strong>Bon reflexe :</strong> {cat.reflexe}</p>
              </div>
            </div>
          </section>
        ))}

        {/* Section 4 - Frequence */}
        <section id="reperes-frequency" className="scroll-mt-24">
          <SectionHeader id="" icon={Calendar} title="La frequence (vision hebdomadaire)" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            {FREQUENCY_LEVELS.map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${item.color}`}>
                <div className={`w-3 h-3 rounded-full ${item.dot}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">{item.level}</div>
                  <div className="text-xs text-gray-600">{item.principle}</div>
                </div>
                <div className="text-xs text-gray-500 text-right max-w-[120px]">{item.examples}</div>
              </div>
            ))}
            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <p className="text-sm text-gray-700">Ce n est jamais un produit qui pose probleme. C est sa frequence et son cumul.</p>
            </div>
          </div>
        </section>

        {/* Section 5 - Regles */}
        <section id="reperes-rules" className="scroll-mt-24">
          <SectionHeader id="" icon={Lightbulb} title="Les 5 regles universelles" />
          <div className="space-y-3">
            {UNIVERSAL_RULES.map((item) => (
              <div key={item.number} className="flex gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{item.number}</div>
                <div>
                  <p className="font-medium text-gray-800">{item.rule}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 - Expositions */}
        <section id="reperes-exposures" className="scroll-mt-24">
          <SectionHeader id="" icon={ShieldAlert} title="Expositions invisibles" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-600 mb-4">Le risque n est pas un produit isole. <strong>C est l exposition repetee.</strong></p>
            <div className="space-y-3">
              {EXPOSURES.map((item, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="font-medium text-gray-800 text-sm">{item.exposure}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Vigilance : </span><span className="text-gray-700">{item.vigilance}</span></div>
                    <div><span className="text-gray-500">Reflexe : </span><span className="text-gray-700">{item.reflexe}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7 - Ce qu Ecolojia ne fait pas */}
        <section id="reperes-not" className="scroll-mt-24">
          <SectionHeader id="" icon={XCircle} title="Ce qu Ecolojia ne fait PAS" />
          <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
            <ul className="space-y-2">
              {NOT_ECOLOJIA.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-red-800">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 8 - Footer */}
        <section id="reperes-footer" className="scroll-mt-24 space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Sources scientifiques</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((source, i) => (
                <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-700">{source}</span>
              ))}
            </div>
          </div>
          <SignatureQuote />
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-xs text-yellow-800 leading-relaxed">
              <strong>Information pedagogique.</strong> Ces reperes sont a but educatif, bases sur des recommandations de sante publique. Ils ne constituent pas un avis medical. Consultez un professionnel de sante pour des conseils personnalises.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReperesEcolojiaPage;
