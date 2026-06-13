import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { CreateOrderInput } from '@sol25/shared';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { buildApp } from '../../app.js';
import { createDatabase } from '../../db/index.js';
import { products } from '../../db/schema.js';
import { ConflictError } from '../../lib/errors.js';
import { authHeader, createAdmin, createCustomer } from '../../test/auth.js';
import { OrdersRepository } from './orders.repository.js';
import { OrdersService } from './orders.service.js';

const shippingAddress: CreateOrderInput['shippingAddress'] = {
  line1: '123 Main Street',
  city: 'Oslo',
  postalCode: '0150',
  country: 'Norway',
};

type OrderAttempt =
  | { ok: true; orderId: string }
  | { ok: false; error: unknown };

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

async function placeOrder(userId: string, productId: string, quantity: number): Promise<OrderAttempt> {
  const { db, client } = createDatabase();
  const service = new OrdersService(db, new OrdersRepository(db));

  try {
    const order = await service.create(userId, {
      items: [{ productId, quantity }],
      shippingAddress,
      cardNumber: '1111111111111111',
    });

    return { ok: true, orderId: order.id };
  } catch (error) {
    return { ok: false, error };
  } finally {
    await client.end();
  }
}

async function placeOrdersConcurrently(
  attempts: Array<{ userId: string; productId: string; quantity: number }>,
): Promise<OrderAttempt[]> {
  return Promise.all(attempts.map((attempt) => placeOrder(attempt.userId, attempt.productId, attempt.quantity)));
}

async function getStock(app: FastifyInstance, productId: string) {
  const response = await app.inject({
    method: 'GET',
    url: `/products/${productId}`,
  });

  return response.json<{ stockQuantity: number }>().stockQuantity;
}

async function countOrders(app: FastifyInstance) {
  const rows = await app.dbClient<Array<{ count: number }>>`SELECT COUNT(*)::int AS count FROM orders`;
  return rows[0]?.count ?? 0;
}

function expectConflict(result: OrderAttempt) {
  if (result.ok) {
    expect.fail('Expected order to be rejected');
  }

  if (!(result.error instanceof ConflictError)) {
    expect.fail('Expected ConflictError');
  }

  expect(result.error.message).toBe('Insufficient stock');
}

describe('orders concurrency', () => {
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

  it('allows only one of two customers to buy the last unit', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'RACE-LAST-UNIT', 1);
    const buyerA = await createCustomer(app, 'buyer-a');
    const buyerB = await createCustomer(app, 'buyer-b');

    const results = await placeOrdersConcurrently([
      { userId: buyerA.user.id, productId: product.id, quantity: 1 },
      { userId: buyerB.user.id, productId: product.id, quantity: 1 },
    ]);

    const successes = results.filter((result) => result.ok);
    const failures = results.filter((result) => !result.ok);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    failures.forEach(expectConflict);
    expect(await getStock(app, product.id)).toBe(0);
    expect(await countOrders(app)).toBe(1);
  });

  it('lets both customers buy when stock covers both orders', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'RACE-ENOUGH-STOCK', 2);
    const buyerA = await createCustomer(app, 'buyer-a');
    const buyerB = await createCustomer(app, 'buyer-b');

    const results = await placeOrdersConcurrently([
      { userId: buyerA.user.id, productId: product.id, quantity: 1 },
      { userId: buyerB.user.id, productId: product.id, quantity: 1 },
    ]);

    expect(results.every((result) => result.ok)).toBe(true);
    expect(await getStock(app, product.id)).toBe(0);
    expect(await countOrders(app)).toBe(2);
  });

  it('rejects both customers when each requests more than available stock', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'RACE-OVER-REQUEST', 1);
    const buyerA = await createCustomer(app, 'buyer-a');
    const buyerB = await createCustomer(app, 'buyer-b');

    const results = await placeOrdersConcurrently([
      { userId: buyerA.user.id, productId: product.id, quantity: 2 },
      { userId: buyerB.user.id, productId: product.id, quantity: 2 },
    ]);

    expect(results.every((result) => !result.ok)).toBe(true);
    results.forEach(expectConflict);
    expect(await getStock(app, product.id)).toBe(1);
    expect(await countOrders(app)).toBe(0);
  });

  it('allows two of three customers to buy when stock is two', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'RACE-THREE-BUYERS', 2);
    const buyerA = await createCustomer(app, 'buyer-a');
    const buyerB = await createCustomer(app, 'buyer-b');
    const buyerC = await createCustomer(app, 'buyer-c');

    const results = await placeOrdersConcurrently([
      { userId: buyerA.user.id, productId: product.id, quantity: 1 },
      { userId: buyerB.user.id, productId: product.id, quantity: 1 },
      { userId: buyerC.user.id, productId: product.id, quantity: 1 },
    ]);

    const successes = results.filter((result) => result.ok);
    const failures = results.filter((result) => !result.ok);

    expect(successes).toHaveLength(2);
    expect(failures).toHaveLength(1);
    failures.forEach(expectConflict);
    expect(await getStock(app, product.id)).toBe(0);
    expect(await countOrders(app)).toBe(2);
  });

  it('allows only one order when the same customer submits two concurrent purchases for the last unit', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'RACE-DOUBLE-SUBMIT', 1);
    const buyer = await createCustomer(app, 'buyer-a');

    const results = await placeOrdersConcurrently([
      { userId: buyer.user.id, productId: product.id, quantity: 1 },
      { userId: buyer.user.id, productId: product.id, quantity: 1 },
    ]);

    const successes = results.filter((result) => result.ok);
    const failures = results.filter((result) => !result.ok);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    failures.forEach(expectConflict);
    expect(await getStock(app, product.id)).toBe(0);
    expect(await countOrders(app)).toBe(1);
  });

  it('rejects the second buyer when the first order consumes most of the remaining stock', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'RACE-PARTIAL-STOCK', 3);
    const buyerA = await createCustomer(app, 'buyer-a');
    const buyerB = await createCustomer(app, 'buyer-b');

    const results = await placeOrdersConcurrently([
      { userId: buyerA.user.id, productId: product.id, quantity: 2 },
      { userId: buyerB.user.id, productId: product.id, quantity: 2 },
    ]);

    const successes = results.filter((result) => result.ok);
    const failures = results.filter((result) => !result.ok);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    failures.forEach(expectConflict);
    expect(await getStock(app, product.id)).toBe(1);
    expect(await countOrders(app)).toBe(1);
  });

  it('never drives stock below zero under concurrent load', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.token, 'RACE-NO-NEGATIVE', 5);
    const buyers = await Promise.all(
      Array.from({ length: 8 }, (_, index) => createCustomer(app, `buyer-${index + 1}`)),
    );

    const results = await placeOrdersConcurrently(
      buyers.map((buyer) => ({
        userId: buyer.user.id,
        productId: product.id,
        quantity: 1,
      })),
    );

    const successes = results.filter((result) => result.ok);
    const failures = results.filter((result) => !result.ok);

    expect(successes).toHaveLength(5);
    expect(failures).toHaveLength(3);
    failures.forEach(expectConflict);

    const [row] = await app.db
      .select({ stockQuantity: products.stockQuantity })
      .from(products)
      .where(eq(products.id, product.id));

    expect(row?.stockQuantity).toBe(0);
    expect(await countOrders(app)).toBe(5);
  });
});
