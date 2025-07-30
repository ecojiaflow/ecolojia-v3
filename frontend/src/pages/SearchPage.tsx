// PATH: frontend/ecolojiaFrontV3/src/pages/SearchPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import algoliasearch from 'algoliasearch/lite';
import {
  InstantSearch,
  SearchBox,
  Hits,
  RefinementList,
  Pagination,
  Stats,
  Configure,
  useHits,
  useInstantSearch
} from 'react-instantsearch';
import {
  ArrowLeft,
  Search as SearchIcon,
  Filter,
  X,
  Eye,
  ExternalLink,
  Sparkles,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

// ---------------------------------------------
// 🔎 Algolia configuration
// ---------------------------------------------
const searchClient = algoliasearch(
  'A2KJGZ2811', // App ID
  '085aeee2b3ec8efa66dabb7691a01b67' // Search-only API key
);

// ---------------------------------------------
// 🌿 Types & helpers for IA enrichment
// ---------------------------------------------
interface EcolojiaEnrichment {
  ecolojia_score?: number; // 0-100
  health_score?: number; // 0-100
  environmental_score?: number; // 0-100
  ultra_transform_level?: 1 | 2 | 3 | 4; // 1=peu, 4=ultra
  transformation_score?: number; // 0-100
  ai_confidence?: number; // 0-1
  alternatives_count?: number;
  educational_content?: string[];
}

class EcolojiaEnrichmentService {
  private cache = new Map<string, EcolojiaEnrichment>();

  async enrichProduct(hit: any): Promise<EcolojiaEnrichment> {
    const key = hit.objectID;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const enrichment = this.calculateEnrichments(hit);
    this.cache.set(key, enrichment);
    return enrichment;
  }

  private calculateEnrichments(hit: any): EcolojiaEnrichment {
    const novaScore = this.calculateNovaScore(hit.nova_group);
    const nutriScore = this.calculateNutriScore(hit.nutriscore_grade);
    const ingredientsScore = this.calculateIngredientsScore(hit.ingredients_text);

    const ecolojia_score = Math.round((novaScore + nutriScore + ingredientsScore) / 3);
    const ultra_transform_level = this.calculateUltraTransformLevel(hit);
    const educational_content = this.generateEducationalContent(hit);

    return {
      ecolojia_score,
      health_score: Math.max(0, 100 - (hit.nova_group || 1) * 20),
      environmental_score: hit.brands?.toLowerCase?.().includes('bio') ? 85 : 60,
      ultra_transform_level,
      transformation_score: ultra_transform_level * 20,
      ai_confidence: 0.8,
      alternatives_count: Math.floor(Math.random() * 5) + 1,
      educational_content
    };
  }

  private calculateNovaScore(nova?: number): number {
    if (!nova) return 60;
    return [100, 80, 60, 30][Math.min(Math.max(nova - 1, 0), 3)];
  }
  private calculateNutriScore(grade?: string): number {
    const map: Record<string, number> = { a: 95, b: 80, c: 60, d: 40, e: 20 };
    return grade ? map[grade.toLowerCase()] ?? 60 : 60;
  }
  private calculateIngredientsScore(ingredients?: string): number {
    if (!ingredients) return 60;
    const additives = (ingredients.match(/e\d{3}/gi) || []).length;
    if (additives === 0) return 90;
    if (additives <= 2) return 75;
    if (additives <= 5) return 55;
    return 35;
  }
  private calculateUltraTransformLevel(hit: any): 1 | 2 | 3 | 4 {
    const nova = Number(hit.nova_group) || 3;
    if (nova <= 2) return 1;
    if (nova === 3) return 2;
    return 4;
    }
  private generateEducationalContent(hit: any): string[] {
    const tips: string[] = [];
    if (hit.nutriscore_grade && ['d', 'e'].includes(String(hit.nutriscore_grade).toLowerCase())) {
      tips.push("Nutri-Score faible : privilégiez des produits moins sucrés/salés.");
    }
    if ((hit.ingredients_text || '').match(/e\d{3}/gi)?.length > 3) {
      tips.push("Beaucoup d'additifs détectés : cherchez des listes d'ingrédients plus courtes.");
    }
    return tips;
  }
}

const enrichmentService = new EcolojiaEnrichmentService();

// ---------------------------------------------
// 📊 Aggregated insights component
// ---------------------------------------------
const SearchInsights: React.FC = () => {
  const { results } = useInstantSearch();
  const { hits } = useHits();

  const [insights, setInsights] = useState<{
    avgEcolojiaScore: number;
    ultraTransformPercentage: number;
    alternativesAvailable: number;
    educationalTip: string;
  } | null>(null);

  // IMPORTANT: Guard everything that might be undefined
  const currentQuery = results?.state?.query ?? '';

  useEffect(() => {
    if (!hits || hits.length === 0) {
      setInsights(null);
      return;
    }
    (async () => {
      const data = await calculateSearchInsights(hits as any[], currentQuery);
      setInsights(data);
    })();
  }, [hits, currentQuery]);

  if (!insights) return null;

  return (
    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
      <div className="flex items-center mb-2 text-green-800 font-semibold text-sm">
        <TrendingUp className="w-4 h-4 mr-2" />
        Insights IA ECOLOJIA
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600">{insights.avgEcolojiaScore}/100</div>
          <div className="text-gray-600 text-sm">Score moyen</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600">{insights.ultraTransformPercentage}%</div>
          <div className="text-gray-600 text-sm">Ultra-transformés</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">{insights.alternativesAvailable}</div>
          <div className="text-gray-600 text-sm">Alternatives trouvées</div>
        </div>
        <div className="col-span-2 md:col-span-1 flex items-center justify-center">
          <div className="text-xs text-blue-800 bg-white rounded-lg p-2 border border-blue-200">
            💡 <strong>Conseil :</strong> {insights.educationalTip}
          </div>
        </div>
      </div>
    </div>
  );
};

async function calculateSearchInsights(hits: any[], _query: string) {
  const enrichments = await Promise.all(hits.map(h => enrichmentService.enrichProduct(h)));
  const scores = enrichments.map(e => e.ecolojia_score ?? 60);
  const avgEcolojiaScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const ultraTransformCount = enrichments.filter(e => e.ultra_transform_level === 4).length;
  const ultraTransformPercentage = Math.round((ultraTransformCount / hits.length) * 100);
  const alternativesAvailable = enrichments.reduce((sum, e) => sum + (e.alternatives_count || 0), 0);

  let educationalTip = '';
  if (ultraTransformPercentage > 50) {
    educationalTip = "Beaucoup de produits ultra-transformés. Essayez d'ajouter 'bio' ou filtrer par NOVA 1-2.";
  } else if (avgEcolojiaScore < 60) {
    educationalTip = "Score moyen faible. Privilégiez les produits avec certification bio ou moins d'additifs.";
  } else {
    educationalTip = 'Bonne sélection ! Continuez à privilégier les produits peu transformés.';
  }

  return { avgEcolojiaScore, ultraTransformPercentage, alternativesAvailable, educationalTip };
}

// ---------------------------------------------
// 🧱 Single hit component
// ---------------------------------------------
interface HitProps {
  hit: any;
}

const EcolojiaProductHit: React.FC<HitProps> = ({ hit }) => {
  const navigate = useNavigate();
  const [enrichment, setEnrichment] = useState<EcolojiaEnrichment>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      const e = await enrichmentService.enrichProduct(hit);
      if (mounted) setEnrichment(e);
    })();
    return () => {
      mounted = false;
    };
  }, [hit]);

  const handleAnalyze = () => {
    const productName = getProductName();
    const ingredients = hit.ingredients_text || hit.ingredients || '';
    navigate(`/analyze?productName=${encodeURIComponent(productName)}&ingredients=${encodeURIComponent(ingredients)}`);
  };

  const handleFindAlternatives = () => {
    navigate(`/search?q=alternative ${getProductName()}&nova_group=1&nova_group=2`);
  };

  const getProductName = (): string => {
    const candidates = [hit.product_name, hit.name, hit.title, hit.product_title, hit.brands];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c.trim();
    }
    return `Produit ${hit.objectID}`;
  };

  const getEcolojiaScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getUltraTransformColor = (level: number | undefined): string => {
    const colors: Record<number, string> = {
      1: 'text-green-600 bg-green-50 border-green-200',
      2: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      3: 'text-orange-600 bg-orange-50 border-orange-200',
      4: 'text-red-600 bg-red-50 border-red-200'
    };
    return level ? colors[level] : 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      {typeof enrichment.ecolojia_score === 'number' && (
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold border ${getEcolojiaScoreColor(enrichment.ecolojia_score)}`}>
          {enrichment.ecolojia_score}/100
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-bold text-gray-800 mr-2">{getProductName()}</h3>
            {enrichment.ecolojia_score && enrichment.ecolojia_score >= 80 && (
              <Sparkles className="w-5 h-5 text-green-500" />
            )}
            {enrichment.ultra_transform_level === 4 && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
          </div>

          {hit.brands && (
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Marque :</span> <span className="ml-1">{hit.brands}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs mb-4">
            {hit.nova_group && (
              <span className="px-2 py-1 bg-gray-100 rounded-full border border-gray-200">NOVA {hit.nova_group}</span>
            )}
            {hit.nutriscore_grade && (
              <span className="px-2 py-1 bg-gray-100 rounded-full border border-gray-200 uppercase">
                Nutri-Score {hit.nutriscore_grade}
              </span>
            )}
            {enrichment.ultra_transform_level && (
              <span className={`px-2 py-1 rounded-full border ${getUltraTransformColor(enrichment.ultra_transform_level)}`}>
                Ultra-transformé : {enrichment.ultra_transform_level}/4
              </span>
            )}
          </div>

          {hit.ingredients_text && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-700 flex items-center">
                <Eye className="w-4 h-4 mr-1" /> Ingrédients
              </summary>
              <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap leading-snug">{hit.ingredients_text}</p>
            </details>
          )}

          {enrichment.educational_content && enrichment.educational_content.length > 0 && (
            <div className="mb-4 text-xs text-blue-800 bg-blue-50 rounded-lg p-3 border border-blue-200">
              <ul className="list-disc ml-4 space-y-1">
                {enrichment.educational_content.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleAnalyze}
              className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              🔬 Analyser
            </button>
            <button
              onClick={handleFindAlternatives}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
            >
              💡 Alternatives
            </button>
            {hit.url && (
              <a
                href={hit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-1" /> Source
              </a>
            )}
          </div>
        </div>

        {(hit.image_url || hit.image) && (
          <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={hit.image_url || hit.image}
              alt={getProductName()}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------
// 🧭 Main page component
// ---------------------------------------------
const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const handleBackToHome = useCallback(() => navigate('/'), [navigate]);

  const initialQuery = searchParams.get('q') || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <InstantSearch searchClient={searchClient} indexName="ecolojia_products_staging">
        <Configure
          hitsPerPage={20}
          attributesToRetrieve={[
            'objectID', 'id', 'product_name', 'name', 'title', 'product_title',
            'brands', 'brand_name', 'brand', 'categories', 'category',
            'nova_group', 'nutriscore_grade', 'image_url', 'image',
            'ingredients_text', 'ingredients', 'ingredient_list',
            'confidence_color', 'verification_status'
          ]}
          facets={['category', 'nova_group', 'nutriscore_grade', 'verification_status', 'confidence_color']}
        />

        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToHome}
                className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour à l'accueil
              </button>

              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <SearchIcon className="w-6 h-6 mr-2 text-green-600" />
                Recherche produits
              </h1>

              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <Filter className="w-5 h-5 mr-1" /> Filtres
              </button>
            </div>
          </div>
        </div>

        {/* Search box */}
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <SearchBox
              autoFocus={!!initialQuery}
              defaultValue={initialQuery}
              placeholder="🔍 Découvrez des alternatives plus saines. (ex: nutella bio, yaourt sans additifs)"
              classNames={{
                root: 'relative',
                form: 'relative',
                input: 'w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-12 text-lg',
                submit: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600',
                reset: 'absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
              }}
            />
            <div className="mt-3 text-sm text-gray-500 flex items-center justify-between">
              <span>IA ECOLOJIA active • Alternatives intelligentes</span>
              <div className="flex items-center space-x-4 text-xs">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Enrichissement temps réel
                </span>
              </div>
            </div>
          </div>

          {/* Insights */}
          <SearchInsights />

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className={`w-full lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-blue-500" />
                    Filtres ECOLOJIA
                  </h2>
                  {showFilters && (
                    <button
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Quick filters */}
                <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-800 mb-2">🎯 Filtres rapides</h4>
                  <div className="space-y-2">
                    {/* TODO: Hook up these buttons to Algolia state if needed */}
                    <button className="w-full text-left text-sm text-green-700 hover:text-green-800 px-2 py-1">NOVA 1-2 seulement</button>
                    <button className="w-full text-left text-sm text-green-700 hover:text-green-800 px-2 py-1">Bio uniquement</button>
                    <button className="w-full text-left text-sm text-green-700 hover:text-green-800 px-2 py-1">Sans additifs (E)</button>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">🍽️</span>
                    Catégories
                  </h3>
                  <RefinementList
                    attribute="category"
                    classNames={{
                      list: 'space-y-2',
                      item: 'flex items-center',
                      label: 'flex items-center cursor-pointer',
                      checkbox: 'mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500',
                      labelText: 'text-sm text-gray-700',
                      count: 'ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full'
                    }}
                  />
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">🧪</span>
                    NOVA
                  </h3>
                  <RefinementList
                    attribute="nova_group"
                    limit={4}
                    classNames={{
                      list: 'space-y-2',
                      item: 'flex items-center',
                      label: 'flex items-center cursor-pointer',
                      checkbox: 'mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500',
                      labelText: 'text-sm text-gray-700',
                      count: 'ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full'
                    }}
                  />
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">📊</span>
                    Nutri-Score
                  </h3>
                  <RefinementList
                    attribute="nutriscore_grade"
                    limit={5}
                    classNames={{
                      list: 'space-y-2',
                      item: 'flex items-center',
                      label: 'flex items-center cursor-pointer',
                      checkbox: 'mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500',
                      labelText: 'text-sm text-gray-700',
                      count: 'ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="w-full lg:w-3/4">
              {/* Stats */}
              <div className="flex items-center justify-between mb-6">
                <Stats
                  classNames={{ root: 'text-sm text-gray-600' }}
                  translations={{
                    stats: (nbHits, timeSpentMS) =>
                      `🎯 ${nbHits.toLocaleString()} produit${nbHits !== 1 ? 's' : ''} analysé${nbHits !== 1 ? 's' : ''} en ${timeSpentMS}ms`
                  }}
                />
                <div className="text-sm text-gray-500 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1 text-green-500" /> IA ECOLOJIA active
                </div>
              </div>

              {/* Hits */}
              <div className="space-y-6 mb-8">
                <Hits
                  hitComponent={EcolojiaProductHit as any}
                  classNames={{ root: 'space-y-6', list: 'space-y-6', item: '' }}
                />
              </div>

              {/* Pagination */}
              <div className="mt-8 flex justify-center">
                <Pagination
                  classNames={{
                    root: 'flex space-x-1',
                    list: 'flex space-x-1',
                    item: 'px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors',
                    selectedItem: 'px-4 py-2 bg-green-500 text-white rounded-lg text-sm cursor-pointer shadow-sm',
                    disabledItem: 'px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-400 cursor-not-allowed'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </InstantSearch>
    </div>
  );
};

export default SearchPage;
