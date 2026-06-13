import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payOrder } from '../api/client';
import { orderKeys } from './useOrder';
import { productKeys } from './useProducts';

export function usePayOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, cardNumber }: { orderId: string; cardNumber: string }) =>
      payOrder(orderId, { cardNumber }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.order.id) });
    },
  });
}
