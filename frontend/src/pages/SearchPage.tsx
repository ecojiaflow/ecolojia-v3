import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import algoliasearch from 'algoliasearch/lite';
import {
  InstantSearch, SearchBox, Hits, RefinementList, Pagination,
  Stats, ClearRefinements, Configure
} from 'react-instantsearch';
import { Package, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useDeviceContext } from '../hooks/useDeviceContext';
import { useCategory } from '../Contexts/CategoryContext';

const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID || '',
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY || ''
);

const indexName = 'products';

const ProductHit = ({ hit }: { hit: any }) => {
  const navigate = useNavigate();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success/10 text-success border-success/20';
    if (score >= 60) return 'bg-warning/10 text-warning border-warning/20';
    if (score >= 40) return 'bg-[#E9A100]/10 text-[#E9A100] border-[#E9A100]/20';
    return 'bg-danger/10 text-danger border-danger/20';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'À éviter';
  };

  // ⭐ CORRECTION : Utiliser les bons champs Algolia
  const globalScore = hit.overallScore || hit.scores?.global || 0;
  const productName = hit.name || hit.product_name || hit.product_name_fr || hit.generic_name || 'Produit sans nom';
  const productBrand = hit.brand || hit.brands || '';
  const productImage = hit.imageUrl || hit.image_url || hit.image_front_url || '/images/default-product.jpg';
  
  // ⭐ NOUVEAUX CHAMPS : Nova et Nutri-Score depuis foodData
  const novaGroup = hit['foodData.novaGroup'];
  const nutriScore = hit['foodData.nutriScore'];

  return (
    <div
      onClick={() => navigate(`/product/${hit.code || hit.barcode || hit.objectID}`)}
      className="bg-neutral-0 rounded-lg shadow-2 hover:shadow-3 transition-all duration-200 cursor-pointer p-4 flex gap-4 border border-neutral-300"
    >
      <div className="flex-shrink-0 w-24 h-24 bg-neutral-100 rounded-lg overflow-hidden">
        {productImage ? (
          <img src={productImage} alt={productName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-neutral-600" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-neutral-900 mb-1 truncate">
          {productName}
        </h3>
        {productBrand && (
          <p className="text-sm text-neutral-600 mb-2">{productBrand}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {globalScore > 0 && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(globalScore)}`}>
              {globalScore}/100 - {getScoreLabel(globalScore)}
            </span>
          )}
          {novaGroup && (
            <span className="px-2 py-1 bg-neutral-100 text-neutral-800 rounded text-xs font-medium">
              NOVA {novaGroup}
            </span>
          )}
          {nutriScore && (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
              nutriScore === 'a' ? 'bg-success text-forest' :
              nutriScore === 'b' ? 'bg-primary-400 text-forest' :
              nutriScore === 'c' ? 'bg-warning text-white' :
              nutriScore === 'd' ? 'bg-[#E9A100] text-white' :
              'bg-danger text-forest'
            }`}>
              Nutri-Score {nutriScore}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isMobile } = useDeviceContext();
  const { category, metadata } = useCategory();
  const [showFilters, setShowFilters] = React.useState(!isMobile);

  const initialQuery = searchParams.get('q') || '';

  // ⭐ CORRECTION : Utiliser categoryType au lieu de category
  const categoryFilter = React.useMemo(() => {
    if (category === 'food') return 'categoryType:food';
    if (category === 'cosmetics') return 'categoryType:cosmetic';
    if (category === 'detergents') return 'categoryType:detergent';
    return '';
  }, [category]);

  // Determiner le placeholder selon la categorie
  const getPlaceholder = () => {
    if (category === 'food') return 'Rechercher un produit alimentaire...';
    if (category === 'cosmetics') return 'Rechercher un produit cosmétique...';
    if (category === 'detergents') return 'Rechercher un produit ménager...';
    return 'Rechercher un produit...';
  };

  // Determiner si on affiche les filtres NOVA/Nutri-Score (uniquement pour food)
  const showFoodFilters = category === 'food';

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={indexName}
      initialUiState={{
        [indexName]: {
          query: initialQuery
        }
      }}
    >
      <Configure
        hitsPerPage={20}
        filters={categoryFilter}
      />

      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="bg-neutral-0 border-b border-neutral-300 sticky top-0 z-10 shadow-1">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-2xl font-bold text-neutral-900">
                Recherche - {metadata.label}
              </h1>
              <span className="text-lg">{metadata.icon === 'Apple' ? '🥫' : metadata.icon === 'Sparkles' ? '💄' : '🧼'}</span>
            </div>

            <div className="mb-4">
              <SearchBox
                placeholder={getPlaceholder()}
                classNames={{
                  root: 'relative',
                  form: 'relative',
                  input: 'w-full pl-4 pr-12 py-3 text-base border border-neutral-300 rounded-lg bg-neutral-0 focus:ring-2 focus:ring-[#236D3E] focus:border-transparent outline-none transition-all',
                  submit: 'absolute right-2 top-1/2 -translate-y-1/2',
                  reset: 'absolute right-12 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900',
                  loadingIndicator: 'absolute right-2 top-1/2 -translate-y-1/2'
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <Stats classNames={{ root: 'text-sm text-neutral-600' }} />
              {isMobile && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary-500 text-forest font-medium hover:bg-primary-600 transition-all shadow-1 min-h-[44px]"
                >
                  <Filter className="w-4 h-4" />
                  Filtres
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {(!isMobile || showFilters) && (
              <aside className="lg:w-64 flex-shrink-0">
                <div className="bg-neutral-0 rounded-lg shadow-2 p-6 sticky top-24 border border-neutral-300">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5" />
                      Filtres
                    </h2>
                    {isMobile && (
                      <button onClick={() => setShowFilters(false)} className="text-neutral-600 hover:text-neutral-900">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <ClearRefinements
                    classNames={{
                      root: 'mb-4',
                      button: 'w-full h-10 px-4 py-2 bg-neutral-100 text-neutral-800 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium'
                    }}
                    translations={{ resetButtonText: 'Réinitialiser les filtres' }}
                  />

                  <div className="space-y-6">
                    {/* ⭐ CORRECTION : Afficher filtres NOVA et Nutri-Score avec bons attributs */}
                    {showFoodFilters && (
                      <>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Groupe NOVA</h3>
                          <RefinementList
                            attribute="foodData.novaGroup"
                            sortBy={['name:asc']}
                            classNames={{
                              root: 'text-sm',
                              list: 'space-y-2',
                              item: 'flex items-center',
                              label: 'flex items-center gap-2 cursor-pointer hover:text-primary-600',
                              checkbox: 'w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600',
                              labelText: 'text-neutral-800',
                              count: 'ml-auto text-xs bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-600'
                            }}
                            transformItems={(items) =>
                              items.map(item => ({
                                ...item,
                                label: `Groupe ${item.label}`
                              }))
                            }
                          />
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Nutri-Score</h3>
                          <RefinementList
                            attribute="foodData.nutriScore"
                            sortBy={['name:asc']}
                            classNames={{
                              root: 'text-sm',
                              list: 'space-y-2',
                              item: 'flex items-center',
                              label: 'flex items-center gap-2 cursor-pointer hover:text-primary-600',
                              checkbox: 'w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600',
                              labelText: 'text-neutral-800 uppercase',
                              count: 'ml-auto text-xs bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-600'
                            }}
                          />
                        </div>
                      </>
                    )}

                    {/* ⭐ CORRECTION : Filtres pour cosmétiques avec bons attributs */}
                    {category === 'cosmetics' && (
                      <>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Type de produit</h3>
                          <RefinementList
                            attribute="productType"
                            limit={5}
                            showMore={true}
                            classNames={{
                              root: 'text-sm',
                              list: 'space-y-2',
                              item: 'flex items-center',
                              label: 'flex items-center gap-2 cursor-pointer hover:text-primary-600',
                              checkbox: 'w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600',
                              labelText: 'text-neutral-800',
                              count: 'ml-auto text-xs bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-600',
                              showMore: 'mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium'
                            }}
                            translations={{
                              showMoreButtonText({ isShowingMore }) {
                                return isShowingMore ? 'Voir moins' : 'Voir plus';
                              }
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Certifications</h3>
                          <RefinementList
                            attribute="cosmeticsData.certifications"
                            classNames={{
                              root: 'text-sm',
                              list: 'space-y-2',
                              item: 'flex items-center',
                              label: 'flex items-center gap-2 cursor-pointer hover:text-primary-600',
                              checkbox: 'w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600',
                              labelText: 'text-neutral-800',
                              count: 'ml-auto text-xs bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-600'
                            }}
                          />
                        </div>
                      </>
                    )}

                    {/* ⭐ CORRECTION : Filtres pour détergents avec bons attributs */}
                    {category === 'detergents' && (
                      <>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Type de produit</h3>
                          <RefinementList
                            attribute="productType"
                            limit={5}
                            showMore={true}
                            classNames={{
                              root: 'text-sm',
                              list: 'space-y-2',
                              item: 'flex items-center',
                              label: 'flex items-center gap-2 cursor-pointer hover:text-primary-600',
                              checkbox: 'w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600',
                              labelText: 'text-neutral-800',
                              count: 'ml-auto text-xs bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-600',
                              showMore: 'mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium'
                            }}
                            translations={{
                              showMoreButtonText({ isShowingMore }) {
                                return isShowingMore ? 'Voir moins' : 'Voir plus';
                              }
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900 mb-2">Labels écologiques</h3>
                          <RefinementList
                            attribute="detergentsData.ecoLabels"
                            classNames={{
                              root: 'text-sm',
                              list: 'space-y-2',
                              item: 'flex items-center',
                              label: 'flex items-center gap-2 cursor-pointer hover:text-primary-600',
                              checkbox: 'w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600',
                              labelText: 'text-neutral-800',
                              count: 'ml-auto text-xs bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-600'
                            }}
                          />
                        </div>
                      </>
                    )}

                    {/* ⭐ CORRECTION : Marques avec bon attribut */}
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 mb-2">Marque</h3>
                      <RefinementList
                        attribute="brand"
                        limit={5}
                        showMore={true}
                        showMoreLimit={20}
                        classNames={{
                          root: 'text-sm',
                          list: 'space-y-2',
                          item: 'flex items-center',
                          label: 'flex items-center gap-2 cursor-pointer hover:text-primary-600',
                          checkbox: 'w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-600',
                          labelText: 'text-neutral-800',
                          count: 'ml-auto text-xs bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-600',
                          showMore: 'mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium'
                        }}
                        translations={{
                          showMoreButtonText({ isShowingMore }) {
                            return isShowingMore ? 'Voir moins' : 'Voir plus';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </aside>
            )}

            <main className="flex-1">
              <Hits
                hitComponent={ProductHit}
                classNames={{ root: 'space-y-4', list: 'space-y-4', item: '' }}
              />

              <div className="mt-8">
                <Pagination
                  padding={2}
                  showFirst={!isMobile}
                  showLast={!isMobile}
                  classNames={{
                    root: 'flex justify-center',
                    list: 'flex items-center gap-2',
                    item: '',
                    link: 'h-10 px-4 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors flex items-center justify-center',
                    selectedItem: 'h-10 px-4 bg-primary-500 text-forest rounded-lg font-medium',
                    disabledItem: 'opacity-50 cursor-not-allowed',
                    firstPageItem: isMobile ? 'hidden' : '',
                    lastPageItem: isMobile ? 'hidden' : ''
                  }}
                  translations={{
                    firstPageItemText: '<<',
                    previousPageItemText: '<',
                    nextPageItemText: '>',
                    lastPageItemText: '>>'
                  }}
                />
              </div>
            </main>
          </div>
        </div>
      </div>
    </InstantSearch>
  );
};

export default SearchPage;