import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ProductListQueryInput } from '@sol25/shared';
import { fetchProducts } from '../api/client';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (query: ProductListQueryInput) => [...productKeys.lists(), query] as const,
};

export function useProducts(query: ProductListQueryInput) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: () => fetchProducts(query),
    placeholderData: keepPreviousData,
  });
}
