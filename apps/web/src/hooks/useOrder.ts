import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from '../api/client';
import { orderKeys } from './useOrders';

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => fetchOrder(orderId),
  });
}
