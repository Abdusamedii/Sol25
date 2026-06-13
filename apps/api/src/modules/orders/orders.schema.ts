import { z } from 'zod';
import { createOrderSchema, orderIdParamsSchema, orderSchema } from '@sol25/shared';

export const createOrderBodySchema = createOrderSchema;
export const orderResponseSchema = orderSchema;
export const orderListResponseSchema = z.array(orderSchema);
export const orderParamsSchema = orderIdParamsSchema;

export const paymentDeclinedResponseSchema = z.object({
  error: z.object({
    code: z.literal('PAYMENT_DECLINED'),
    message: z.string(),
  }),
});
