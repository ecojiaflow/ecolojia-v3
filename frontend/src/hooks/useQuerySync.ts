import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface SearchState {
  q: string;
  brands?: string[];
  categories?: string[];
  hsMin?: number;
  hsMax?: number;
  page?: number;
}

export function useQuerySync(
  state: SearchState,
  setState: (state: SearchState) => void
) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync URL to state
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const hsMin = searchParams.get('hsMin') ? Number(searchParams.get('hsMin')) : undefined;
    const hsMax = searchParams.get('hsMax') ? Number(searchParams.get('hsMax')) : undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;

    setState({ q, brands, categories, hsMin, hsMax, page });
  }, [searchParams, setState]);

  // Function to update URL from state
  const updateURL = (newState: SearchState) => {
    const params = new URLSearchParams();
    
    if (newState.q) params.set('q', newState.q);
    if (newState.brands?.length) params.set('brands', newState.brands.join(','));
    if (newState.categories?.length) params.set('categories', newState.categories.join(','));
    if (newState.hsMin !== undefined) params.set('hsMin', newState.hsMin.toString());
    if (newState.hsMax !== undefined) params.set('hsMax', newState.hsMax.toString());
    if (newState.page !== undefined && newState.page > 1) params.set('page', newState.page.toString());

    setSearchParams(params);
  };

  return updateURL;
}
