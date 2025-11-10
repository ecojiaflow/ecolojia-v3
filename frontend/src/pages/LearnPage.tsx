import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Leaf, 
  Beaker, 
  Award, 
  AlertCircle, 
  Search,
  ArrowLeft,
  ExternalLink 
} from 'lucide-react';

interface KnowledgeItem {
  id: string;
  title: string;
  category: 'ingredient' | 'additive' | 'label' | 'myth';
  description: string;
  details: string;
  risk?: 'low' | 'medium' | 'high';
  sources?: string[];
}

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  // Ingrédients
  {
    id: 'huile-palme',
    title: 'Huile de palme',
    category: 'ingredient',
    description: 'Huile végétale extraite du fruit du palmier à huile',
    details: 'Riche en acides gras saturés. Impact environnemental majeur (déforestation). Présente dans 50% des produits transformés. Alternatives : huile de colza, tournesol.',
    risk: 'high',
    sources: ['WWF', 'INRAE']
  },
  {
    id: 'sucre-raffine',
    title: 'Sucre raffiné',
    category: 'ingredient',
    description: 'Saccharose extrait de la canne à sucre ou de la betterave',
    details: 'Apporte uniquement des calories vides. Favorise obésité, diabète, caries. OMS recommande <25g/jour. Alternatives : miel, sirop d\'érable, fruits.',
    risk: 'medium',
    sources: ['OMS', 'ANSES']
  },
  
  // Additifs
  {
    id: 'e171',
    title: 'E171 - Dioxyde de titane',
    category: 'additive',
    description: 'Colorant blanc utilisé dans confiseries, sauces',
    details: 'Interdit en France depuis 2020. Nanoparticules potentiellement cancérigènes. Traverse barrière intestinale. Éviter absolument.',
    risk: 'high',
    sources: ['EFSA', 'ANSES']
  },
  {
    id: 'e330',
    title: 'E330 - Acide citrique',
    category: 'additive',
    description: 'Acidifiant naturel, conservateur',
    details: 'Généralement sans danger. Extrait de citron ou produit par fermentation. Utilisé comme régulateur d\'acidité et antioxydant.',
    risk: 'low',
    sources: ['EFSA']
  },
  
  // Labels
  {
    id: 'ab-bio',
    title: 'AB - Agriculture Biologique',
    category: 'label',
    description: 'Label officiel français certifiant une production bio',
    details: 'Garantit : sans pesticides de synthèse, sans OGM, respect du bien-être animal, rotation des cultures. Contrôlé par organismes certifiés.',
    risk: 'low',
    sources: ['Agence Bio', 'INAO']
  },
  {
    id: 'msc',
    title: 'MSC - Pêche durable',
    category: 'label',
    description: 'Certification pour pêche responsable',
    details: 'Garantit stocks de poisson durables, impact écosystème minimisé, gestion efficace de la pêcherie. Traçabilité totale.',
    risk: 'low',
    sources: ['Marine Stewardship Council']
  },
  
  // Mythes
  {
    id: 'mythe-light',
    title: 'Les produits "light" font maigrir',
    category: 'myth',
    description: 'Idée reçue sur les produits allégés',
    details: 'FAUX. Souvent plus de sucre pour compenser le gras retiré, ou édulcorants perturbant la satiété. Effet psychologique : on mange plus. Privilégier portions normales de vrais aliments.',
    risk: 'medium',
    sources: ['INSERM', 'Harvard School of Public Health']
  },
  {
    id: 'mythe-sans-gluten',
    title: 'Le sans-gluten est plus sain pour tous',
    category: 'myth',
    description: 'Idée reçue sur le gluten',
    details: 'FAUX (sauf maladie cœliaque 1%). Produits sans gluten souvent plus gras, sucrés, additifs. Gluten inoffensif pour 99% population. Effet mode sans base scientifique.',
    risk: 'low',
    sources: ['ANSES', 'Société Française de Nutrition']
  }
];

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: BookOpen, color: '#7DDE4A' },
  { id: 'ingredient', label: 'Ingrédients', icon: Leaf, color: '#98E073' },
  { id: 'additive', label: 'Additifs', icon: Beaker, color: '#F59E0B' },
  { id: 'label', label: 'Labels', icon: Award, color: '#3B82F6' },
  { id: 'myth', label: 'Mythes', icon: AlertCircle, color: '#EF4444' }
];

const RISK_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-red-100 text-red-800 border-red-300'
};

const RISK_LABELS = {
  low: 'Faible risque',
  medium: 'Risque modéré',
  high: 'Risque élevé'
};

export const LearnPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const filteredKnowledge = KNOWLEDGE_BASE.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3FBEA] to-[#E9F8DF]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center text-neutral-800 hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à l'accueil
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-neutral-800">Bibliothèque Ecolojia</h1>
          </div>
          <p className="text-lg text-gray-600">
            Comprendre ce que vous consommez : ingrédients, additifs, labels et idées reçues
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un ingrédient, additif, label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none text-lg"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-forest shadow-md scale-105'
                    : 'bg-white text-neutral-800 hover:bg-nature-100 border border-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" style={{ color: selectedCategory === cat.id ? 'white' : cat.color }} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-4">
          {filteredKnowledge.length} résultat{filteredKnowledge.length > 1 ? 's' : ''} trouvé{filteredKnowledge.length > 1 ? 's' : ''}
        </p>

        {/* Knowledge Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredKnowledge.map(item => {
            const CategoryIcon = CATEGORIES.find(c => c.id === item.category)?.icon || BookOpen;
            const isExpanded = expandedCard === item.id;

            return (
              <div 
                key={item.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <CategoryIcon className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: CATEGORIES.find(c => c.id === item.category)?.color }} />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-neutral-800 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>

                  {item.risk && (
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-3 border ${RISK_COLORS[item.risk]}`}>
                      <AlertCircle className="w-3 h-3" />
                      {RISK_LABELS[item.risk]}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-700 mb-4 leading-relaxed">{item.details}</p>
                      
                      {item.sources && item.sources.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-blue-900 mb-2 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Sources scientifiques :
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.sources.map((source, idx) => (
                              <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-700">
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedCard(isExpanded ? null : item.id)}
                    className="mt-4 text-primary hover:text-[#6BC93B] font-medium text-sm transition-colors"
                  >
                    {isExpanded ? '▲ Réduire' : '▼ En savoir plus'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredKnowledge.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun résultat</h3>
            <p className="text-gray-500">Essayez un autre mot-clé ou catégorie</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Information pédagogique</h4>
              <p className="text-sm text-yellow-800 leading-relaxed">
                Ces informations sont à but éducatif et basées sur des sources scientifiques reconnues. 
                Elles ne constituent pas un avis médical. Consultez un professionnel de santé pour des conseils personnalisés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;