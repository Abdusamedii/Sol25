import { z } from 'zod';

export const orderStatusSchema = z.enum(['pending_payment', 'paid', 'payment_failed', 'cancelled']);

export const paymentStatusSchema = z.enum(['pending', 'succeeded', 'failed']);

export const shippingAddressInputSchema = z.object({
  line1: z.string().trim().min(1).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(1).max(32),
  country: z.string().trim().min(1).max(120),
});

export const shippingAddressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

export const createOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1),
  shippingAddress: shippingAddressInputSchema,
  cardNumber: z.string().min(1),
});

export const createPaymentSchema = z.object({
  cardNumber: z.string().min(1),
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

export const paymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  status: paymentStatusSchema,
  cardLast4: z.string().length(4).nullable(),
  failureReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  paidAt: z.string().datetime().nullable(),
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  total: z.coerce.number().nonnegative(),
  status: orderStatusSchema,
  shippingAddress: shippingAddressSchema,
  createdAt: z.string().datetime(),
  items: z.array(orderItemSchema),
  payment: paymentSchema.optional(),
});

export const orderIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const payOrderResponseSchema = z.object({
  order: orderSchema,
  payment: paymentSchema,
});

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
export type PayOrderResponse = z.infer<typeof payOrderResponseSchema>;
