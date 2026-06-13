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
    expect(listResponse.json()).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      data: [
        {
          name: 'Coffee Beans',
          sku: 'COFFEE-1',
          price: 12.5,
          stockQuantity: 5,
          category: 'Grocery',
        },
      ],
    });
  });

  it('paginates product results', async () => {
    for (let index = 1; index <= 25; index += 1) {
      await app.inject({
        method: 'POST',
        url: '/products',
        payload: {
          name: `Product ${index}`,
          sku: `SKU-PAGE-${index}`,
          price: 10,
          stockQuantity: 5,
          category: 'Test',
        },
      });
    }

    const pageOne = await app.inject({
      method: 'GET',
      url: '/products?page=1&limit=10',
    });

    const pageThree = await app.inject({
      method: 'GET',
      url: '/products?page=3&limit=10',
    });

    expect(pageOne.statusCode).toBe(200);
    expect(pageOne.json()).toMatchObject({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    expect(pageOne.json().data).toHaveLength(10);
    expect(pageOne.json().data.map((product: { sku: string }) => product.sku)).toEqual([
      'SKU-PAGE-1',
      'SKU-PAGE-2',
      'SKU-PAGE-3',
      'SKU-PAGE-4',
      'SKU-PAGE-5',
      'SKU-PAGE-6',
      'SKU-PAGE-7',
      'SKU-PAGE-8',
      'SKU-PAGE-9',
      'SKU-PAGE-10',
    ]);

    expect(pageThree.statusCode).toBe(200);
    expect(pageThree.json()).toMatchObject({
      page: 3,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    expect(pageThree.json().data).toHaveLength(5);
  });

  it('searches products by name and sku', async () => {
    await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Ergonomic Office Chair',
        sku: 'CHAIR-ERG-01',
        price: 249.99,
        stockQuantity: 12,
        category: 'Home',
      },
    });

    await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Stainless Steel Kettle',
        sku: 'KETTLE-SS-02',
        price: 59.99,
        stockQuantity: 30,
        category: 'Kitchen',
      },
    });

    const byName = await app.inject({
      method: 'GET',
      url: '/products?q=office',
    });

    const bySku = await app.inject({
      method: 'GET',
      url: '/products?q=KETTLE',
    });

    expect(byName.statusCode).toBe(200);
    expect(byName.json().total).toBe(1);
    expect(byName.json().data[0].name).toBe('Ergonomic Office Chair');

    expect(bySku.statusCode).toBe(200);
    expect(bySku.json().total).toBe(1);
    expect(bySku.json().data[0].sku).toBe('KETTLE-SS-02');
  });

  it('filters products by category and price range', async () => {
    await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Budget Blender',
        sku: 'BLEND-01',
        price: 29.99,
        stockQuantity: 8,
        category: 'Kitchen',
      },
    });

    await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Premium Blender',
        sku: 'BLEND-02',
        price: 129.99,
        stockQuantity: 4,
        category: 'Kitchen',
      },
    });

    await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Running Shoes',
        sku: 'SHOE-01',
        price: 89.99,
        stockQuantity: 20,
        category: 'Sports',
      },
    });

    const filtered = await app.inject({
      method: 'GET',
      url: '/products?category=Kitchen&minPrice=20&maxPrice=100',
    });

    expect(filtered.statusCode).toBe(200);
    expect(filtered.json().total).toBe(1);
    expect(filtered.json().data[0].name).toBe('Budget Blender');
  });

  it('sorts products by price descending', async () => {
    await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Low Price Item',
        sku: 'LOW-01',
        price: 10,
        stockQuantity: 5,
        category: 'Test',
      },
    });

    await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'High Price Item',
        sku: 'HIGH-01',
        price: 100,
        stockQuantity: 5,
        category: 'Test',
      },
    });

    const sorted = await app.inject({
      method: 'GET',
      url: '/products?sortBy=price&sortOrder=desc',
    });

    expect(sorted.statusCode).toBe(200);
    expect(sorted.json().data.map((product: { sku: string }) => product.sku)).toEqual(['HIGH-01', 'LOW-01']);
  });
});
