import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../api/client';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: fetchProducts,
  });
}
