import { z } from 'zod';
import { createOrderSchema, orderSchema } from '@sol25/shared';

export const createOrderBodySchema = createOrderSchema;
export const orderResponseSchema = orderSchema;
export const orderListResponseSchema = z.array(orderSchema);
