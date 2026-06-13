import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../app.js';
import { authHeader, createCustomer } from '../../test/auth.js';

describe('auth', () => {
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

  it('signs up a user and signs in with the same credentials', async () => {
    const signupResponse = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        username: 'alice',
        password: 'secret',
      },
    });

    expect(signupResponse.statusCode).toBe(201);
    expect(signupResponse.json()).toMatchObject({
      user: {
        username: 'alice',
        role: 'customer',
      },
      token: expect.any(String),
    });

    const signinResponse = await app.inject({
      method: 'POST',
      url: '/auth/signin',
      payload: {
        username: 'alice',
        password: 'secret',
      },
    });

    expect(signinResponse.statusCode).toBe(200);
    expect(signinResponse.json()).toMatchObject({
      user: {
        username: 'alice',
        role: 'customer',
      },
      token: expect.any(String),
    });
  });

  it('returns the current user from /auth/me', async () => {
    const customer = await createCustomer(app, 'me-user');

    const meResponse = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: authHeader(customer.token),
    });

    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json()).toMatchObject({
      username: 'me-user',
      role: 'customer',
    });
  });

  it('rejects signin with a wrong password', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        username: 'bob',
        password: 'secret',
      },
    });

    const signinResponse = await app.inject({
      method: 'POST',
      url: '/auth/signin',
      payload: {
        username: 'bob',
        password: 'wrong',
      },
    });

    expect(signinResponse.statusCode).toBe(401);
    expect(signinResponse.json()).toMatchObject({
      error: {
        code: 'UNAUTHORIZED',
      },
    });
  });
});
