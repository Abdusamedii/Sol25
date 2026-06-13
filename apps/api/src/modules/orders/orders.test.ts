import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';

async function createProduct(app: FastifyInstance, sku: string, stockQuantity: number) {
  const response = await app.inject({
    method: 'POST',
    url: '/products',
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

async function createCustomer(app: FastifyInstance, username: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: {
      username,
      password: 'password',
      role: 'customer',
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

  it('decrements stock and persists the order total', async () => {
    const product = await createProduct(app, 'LOCKED-STOCK-1', 3);
    const customer = await createCustomer(app, 'buyer-1');

    const orderResponse = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: {
        userId: customer.id,
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
      items: [
        {
          productId: product.id,
          quantity: 2,
          unitPrice: 10,
          lineTotal: 20,
        },
      ],
    });

    const productResponse = await app.inject({
      method: 'GET',
      url: `/products/${product.id}`,
    });

    expect(productResponse.json()).toMatchObject({
      stockQuantity: 1,
    });
  });

  it('rejects an order that exceeds available stock', async () => {
    const product = await createProduct(app, 'LOCKED-STOCK-2', 1);
    const customer = await createCustomer(app, 'buyer-2');

    const orderResponse = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: {
        userId: customer.id,
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
