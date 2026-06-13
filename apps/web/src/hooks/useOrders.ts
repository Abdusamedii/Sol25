import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../api/client';

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const,
  detail: (orderId: string) => [...orderKeys.all, orderId] as const,
};

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: fetchOrders,
  });
}
