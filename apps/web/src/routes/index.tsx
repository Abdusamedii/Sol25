import { productListQuerySchema } from '@sol25/shared';
import type { ProductListQueryInput } from '@sol25/shared';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { ProductFilters, ProductSearch } from '../components/ProductFilters';
import { ProductResults } from '../components/ProductResults';

export const Route = createFileRoute('/')({
  validateSearch: productListQuerySchema,
  component: ProductListPage,
});

function ProductListPage() {
  const urlSearch = Route.useSearch();
  const navigate = Route.useNavigate();
  const [searchInput, setSearchInput] = useState(urlSearch.q ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(urlSearch.q ?? '');

  useEffect(() => {
    setSearchInput(urlSearch.q ?? '');
    setDebouncedQuery(urlSearch.q ?? '');
  }, [urlSearch.q]);

  useEffect(() => {
    const trimmed = searchInput.trim();

    if (trimmed === debouncedQuery) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput, debouncedQuery]);

  useEffect(() => {
    const urlQuery = urlSearch.q ?? '';

    if (debouncedQuery === urlQuery) {
      return;
    }

    navigate({
      search: {
        page: 1,
        limit: urlSearch.limit,
        q: debouncedQuery || undefined,
        category: urlSearch.category,
        minPrice: urlSearch.minPrice,
        maxPrice: urlSearch.maxPrice,
        sortBy: urlSearch.sortBy,
        sortOrder: urlSearch.sortOrder,
      },
      replace: true,
      resetScroll: false,
    });
  }, [
    debouncedQuery,
    navigate,
    urlSearch.q,
    urlSearch.limit,
    urlSearch.category,
    urlSearch.minPrice,
    urlSearch.maxPrice,
    urlSearch.sortBy,
    urlSearch.sortOrder,
  ]);

  const productQuery = useMemo(
    (): ProductListQueryInput => ({
      page: urlSearch.page,
      limit: urlSearch.limit,
      category: urlSearch.category,
      minPrice: urlSearch.minPrice,
      maxPrice: urlSearch.maxPrice,
      sortBy: urlSearch.sortBy,
      sortOrder: urlSearch.sortOrder,
      q: debouncedQuery || undefined,
    }),
    [
      debouncedQuery,
      urlSearch.category,
      urlSearch.limit,
      urlSearch.maxPrice,
      urlSearch.minPrice,
      urlSearch.page,
      urlSearch.sortBy,
      urlSearch.sortOrder,
    ],
  );

  function updateSearch(next: Partial<ProductListQueryInput>) {
    navigate({
      search: {
        page: next.page ?? urlSearch.page,
        limit: urlSearch.limit,
        q: next.q !== undefined ? next.q : urlSearch.q,
        category: next.category !== undefined ? next.category : urlSearch.category,
        minPrice: next.minPrice !== undefined ? next.minPrice : urlSearch.minPrice,
        maxPrice: next.maxPrice !== undefined ? next.maxPrice : urlSearch.maxPrice,
        sortBy: next.sortBy ?? urlSearch.sortBy,
        sortOrder: next.sortOrder ?? urlSearch.sortOrder,
      },
      replace: true,
      resetScroll: false,
    });
  }

  function clearFilters() {
    setSearchInput('');
    setDebouncedQuery('');
    navigate({
      search: {
        page: 1,
        limit: urlSearch.limit,
      },
      replace: true,
      resetScroll: false,
    });
  }

  const hasActiveFilters =
    Boolean(debouncedQuery) ||
    Boolean(urlSearch.category) ||
    urlSearch.minPrice !== undefined ||
    urlSearch.maxPrice !== undefined ||
    urlSearch.sortBy !== 'createdAt' ||
    urlSearch.sortOrder !== 'asc';

  return (
    <div className="grid gap-6">
      <ProductSearch searchInput={searchInput} onSearchChange={setSearchInput} />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <ProductFilters
          urlSearch={urlSearch}
          hasActiveFilters={hasActiveFilters}
          onUpdateSearch={updateSearch}
          onClearFilters={clearFilters}
        />

        <ProductResults
          hasActiveFilters={hasActiveFilters}
          page={urlSearch.page}
          query={productQuery}
          onPageChange={(page) => updateSearch({ page })}
        />
      </div>
    </div>
  );
}
