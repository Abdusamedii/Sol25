import type { FastifyInstance } from 'fastify';
import { users } from '../db/schema.js';
import { hashPassword } from '../lib/password.js';

type AuthSession = {
  user: {
    id: string;
    username: string;
    role: 'admin' | 'customer';
  };
  token: string;
};

export async function createAdmin(app: FastifyInstance, username = 'admin-user'): Promise<AuthSession> {
  const [user] = await app.db
    .insert(users)
    .values({
      username,
      passwordHash: hashPassword('password'),
      role: 'admin',
    })
    .returning();

  if (!user) {
    throw new Error('Admin creation failed');
  }

  const token = app.jwt.sign({
    sub: user.id,
    username: user.username,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    token,
  };
}

export async function createCustomer(app: FastifyInstance, username: string): Promise<AuthSession> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: {
      username,
      password: 'password',
    },
  });

  const body = response.json<{ user: AuthSession['user']; token: string }>();

  return {
    user: body.user,
    token: body.token,
  };
}

export function authHeader(token: string) {
  return {
    authorization: `Bearer ${token}`,
  };
}
