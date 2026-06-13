import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { authHeader, createAdmin, createCustomer } from '../../test/auth.js';

async function createProduct(app: FastifyInstance, adminToken: string, sku: string, stockQuantity: number) {
  const response = await app.inject({
    method: 'POST',
    url: '/products',
    headers: authHeader(adminToken),
    payload: {
      name: sku,
      sku,
      price: 10,
      stockQuantity,
      category: 'Test',
    },
  });

  return response.json<{ id: string }>();
}

describe('orders', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(async () => {
    await app.dbClient`TRUNCATE order_items, orders, products, users RESTART IDENTITY CASCADE`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('decrements stock after successful payment', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'LOCKED-STOCK-1', 3);
    const customer = await createCustomer(app, 'buyer-1');

    const orderResponse = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: authHeader(customer.token),
      payload: {
        items: [
          {
            productId: product.id,
            quantity: 2,
          },
        ],
      },
    });

    expect(orderResponse.statusCode).toBe(201);
    expect(orderResponse.json()).toMatchObject({
      total: 20,
      status: 'pending_payment',
      items: [
        {
          productId: product.id,
          quantity: 2,
          unitPrice: 10,
          lineTotal: 20,
        },
      ],
    });

    const unpaidProductResponse = await app.inject({
      method: 'GET',
      url: `/products/${product.id}`,
    });

    expect(unpaidProductResponse.json()).toMatchObject({
      stockQuantity: 3,
    });

    const order = orderResponse.json<{ id: string }>();

    const paymentResponse = await app.inject({
      method: 'POST',
      url: `/orders/${order.id}/payments`,
      headers: authHeader(customer.token),
      payload: {
        cardNumber: '1111 1111 1111 1111',
      },
    });

    expect(paymentResponse.statusCode).toBe(201);

    const productResponse = await app.inject({
      method: 'GET',
      url: `/products/${product.id}`,
    });

    expect(productResponse.json()).toMatchObject({
      stockQuantity: 1,
    });
  });

  it('rejects an order that exceeds available stock', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'LOCKED-STOCK-2', 1);
    const customer = await createCustomer(app, 'buyer-2');

    const orderResponse = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: authHeader(customer.token),
      payload: {
        items: [
          {
            productId: product.id,
            quantity: 2,
          },
        ],
      },
    });

    expect(orderResponse.statusCode).toBe(409);
    expect(orderResponse.json()).toMatchObject({
      error: {
        code: 'CONFLICT',
        message: 'Insufficient stock',
      },
    });
  });
});
