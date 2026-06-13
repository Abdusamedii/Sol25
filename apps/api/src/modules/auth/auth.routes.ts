import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { getAuthenticatedUser } from '../../plugins/auth.js';
import { AuthRepository } from './auth.repository.js';
import {
  authSessionResponseSchema,
  signinBodySchema,
  signupBodySchema,
  toJwtPayload,
  userResponseSchema,
} from './auth.schema.js';
import { AuthService } from './auth.service.js';

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const service = new AuthService(new AuthRepository(fastify.db));

  fastify.post(
    '/signup',
    {
      schema: {
        body: signupBodySchema,
        response: {
          201: authSessionResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await service.signup(request.body);
      const token = await reply.jwtSign(toJwtPayload(user));

      return reply.status(201).send({ user, token });
    },
  );

  fastify.post(
    '/signin',
    {
      schema: {
        body: signinBodySchema,
        response: {
          200: authSessionResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await service.signin(request.body);
      const token = await reply.jwtSign(toJwtPayload(user));

      return { user, token };
    },
  );

  fastify.get(
    '/me',
    {
      preHandler: [fastify.authenticate],
      schema: {
        response: {
          200: userResponseSchema,
        },
      },
    },
    async (request) => service.findById(getAuthenticatedUser(request).sub),
  );
};
