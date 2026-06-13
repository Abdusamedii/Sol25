import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from '../api/client';

export const orderKeys = {
  all: ['orders'] as const,
  detail: (orderId: string) => [...orderKeys.all, orderId] as const,
};

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => fetchOrder(orderId),
  });
}
