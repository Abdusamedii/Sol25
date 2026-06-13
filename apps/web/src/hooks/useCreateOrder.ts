import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder } from '../api/client';
import { productKeys } from './useProducts';

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
