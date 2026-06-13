import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { authHeader, createAdmin, createCustomer } from '../../test/auth.js';

const shippingAddress = {
  line1: '123 Main Street',
  city: 'Oslo',
  postalCode: '0150',
  country: 'Norway',
};

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
    await app.dbClient`TRUNCATE order_items, payments, orders, products, users RESTART IDENTITY CASCADE`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('decrements stock atomically when an order is created', async () => {
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
        shippingAddress,
        cardNumber: '1111 1111 1111 1111',
      },
    });

    expect(orderResponse.statusCode).toBe(201);
    expect(orderResponse.json()).toMatchObject({
      total: 20,
      status: 'paid',
      shippingAddress,
      items: [
        {
          productId: product.id,
          quantity: 2,
          unitPrice: 10,
          lineTotal: 20,
        },
      ],
      payment: {
        status: 'succeeded',
        cardLast4: '1111',
      },
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
        shippingAddress,
        cardNumber: '1111 1111 1111 1111',
      },
    });

    expect(orderResponse.statusCode).toBe(409);
    expect(orderResponse.json()).toMatchObject({
      error: {
        code: 'CONFLICT',
        message: 'Insufficient stock',
      },
    });

    const productResponse = await app.inject({
      method: 'GET',
      url: `/products/${product.id}`,
    });

    expect(productResponse.json()).toMatchObject({
      stockQuantity: 1,
    });
  });

  it('declines payment without creating an order or changing stock', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'LOCKED-STOCK-3', 2);
    const customer = await createCustomer(app, 'buyer-3');

    const orderResponse = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: authHeader(customer.token),
      payload: {
        items: [
          {
            productId: product.id,
            quantity: 1,
          },
        ],
        shippingAddress,
        cardNumber: '4444 4444 4444 4444',
      },
    });

    expect(orderResponse.statusCode).toBe(402);
    expect(orderResponse.json()).toMatchObject({
      error: {
        code: 'PAYMENT_DECLINED',
        message: 'Payment declined',
      },
    });

    const productResponse = await app.inject({
      method: 'GET',
      url: `/products/${product.id}`,
    });

    expect(productResponse.json()).toMatchObject({
      stockQuantity: 2,
    });

    const listResponse = await app.inject({
      method: 'GET',
      url: '/orders',
      headers: authHeader(admin.token),
    });

    expect(listResponse.json()).toEqual([]);
  });

  it('rejects order creation for admin users', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'ADMIN-BLOCKED', 5);

    const orderResponse = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: authHeader(admin.token),
      payload: {
        items: [
          {
            productId: product.id,
            quantity: 1,
          },
        ],
        shippingAddress,
        cardNumber: '1111 1111 1111 1111',
      },
    });

    expect(orderResponse.statusCode).toBe(403);
    expect(orderResponse.json()).toMatchObject({
      error: {
        code: 'FORBIDDEN',
        message: 'Admins cannot place orders',
      },
    });
  });
});
