import { z } from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  userId: z.string().uuid(),
  items: z.array(createOrderItemSchema).min(1),
});

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string().min(1),
  productSku: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
  lineTotal: z.coerce.number().nonnegative(),
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  total: z.coerce.number().nonnegative(),
  status: z.enum(['placed']),
  createdAt: z.string().datetime(),
  items: z.array(orderItemSchema),
});

export const orderIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
