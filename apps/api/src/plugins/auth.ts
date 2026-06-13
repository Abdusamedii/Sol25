import type { UserRole } from '@sol25/shared';
import jwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import type { JwtUser } from '../lib/jwt.js';

async function verifyRequest(request: FastifyRequest) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError('Authentication required');
  }
}

function assertRole(request: FastifyRequest, roles: UserRole[]) {
  const user = request.user as JwtUser;

  if (!roles.includes(user.role)) {
    throw new ForbiddenError('Insufficient permissions');
  }
}

export const authPlugin = fp(async (fastify) => {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
  });

  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    await verifyRequest(request);
  });

  fastify.decorate('authorize', (roles: UserRole | UserRole[]) => {
    const allowed = Array.isArray(roles) ? roles : [roles];

    return async (request: FastifyRequest, _reply: FastifyReply) => {
      await verifyRequest(request);
      assertRole(request, allowed);
    };
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
    authorize: (roles: UserRole | UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export function getAuthenticatedUser(request: FastifyRequest): JwtUser {
  return request.user as JwtUser;
}
