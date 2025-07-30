import React from 'react';
import {
  InstantSearch,
  SearchBox,
  Hits,
  Pagination,
  Stats,
  RefinementList,
  Configure,
  connectStateResults,
} from 'react-instantsearch-dom';
import { useTranslation } from 'react-i18next';

import ProductHit from '../ProductHit';
import NoResultsFound from '../NoResultsFound';
import { searchClient, ALGOLIA_INDEX_NAME } from '../lib/algolia';

interface Props {
  hideSearchBox?: boolean;
}

const CustomStats: React.FC<{ nbHits: number; timeSpentMS: number }> = ({ nbHits, timeSpentMS }) => {
  const { t } = useTranslation();
  return (
    <p className="text-sm text-gray-500 mb-4">
      {nbHits > 0
        ? `${t('common.productsFound', { count: nbHits })} ${t('common.in')} ${timeSpentMS}ms`
        : t('common.noResults')}
    </p>
  );
};

const ResultsWrapper = connectStateResults(({ searchResults, children }) => {
  if (searchResults && searchResults.nbHits === 0) {
    return <NoResultsFound query={searchResults.query ?? ''} />;
  }
  return children;
});

const SearchExperience: React.FC<Props> = ({ hideSearchBox = false }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
      <InstantSearch indexName={ALGOLIA_INDEX_NAME} searchClient={searchClient}>
        {!hideSearchBox && (
          <div className="mb-6">
            <SearchBox
              translations={{ placeholder: t('common.searchPlaceholder') }}
              className="ais-SearchBox w-full"
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-72">
            <h2 className="font-semibold text-gray-700 mb-2">
              🎯 {t('common.filters', 'Filtres')}
            </h2>
            <div className="space-y-4">
              <RefinementList attribute="category" />
              <RefinementList attribute="zones_dispo" />
              <RefinementList attribute="confidence_color" />
            </div>
          </aside>

          <main className="flex-1">
            <Stats
              className="mb-4"
              translations={{
                stats(nbHits, timeSpentMS) {
                  return (
                    <CustomStats nbHits={nbHits} timeSpentMS={timeSpentMS} />
                  );
                },
              }}
            />
            <ResultsWrapper>
              <Hits hitComponent={ProductHit} />
              <div className="mt-6">
                <Pagination />
              </div>
            </ResultsWrapper>
          </main>
        </div>

        <Configure hitsPerPage={12} />
      </InstantSearch>
    </div>
  );
};

export default SearchExperience;
