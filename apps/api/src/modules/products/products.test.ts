import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';

describe('products', () => {
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

  it('creates and lists products', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Coffee Beans',
        sku: 'COFFEE-1',
        price: 12.5,
        stockQuantity: 5,
        category: 'Grocery',
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const listResponse = await app.inject({
      method: 'GET',
      url: '/products',
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject([
      {
        name: 'Coffee Beans',
        sku: 'COFFEE-1',
        price: 12.5,
        stockQuantity: 5,
        category: 'Grocery',
      },
    ]);
  });
});
