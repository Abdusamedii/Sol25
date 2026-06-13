import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { AuthRepository } from './auth.repository.js';
import { signinBodySchema, signupBodySchema, userResponseSchema } from './auth.schema.js';
import { AuthService } from './auth.service.js';

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const service = new AuthService(new AuthRepository(fastify.db));

  fastify.post(
    '/signup',
    {
      schema: {
        body: signupBodySchema,
        response: {
          201: userResponseSchema,
        },
      },
    },
    async (request, reply) => reply.status(201).send(await service.signup(request.body)),
  );

  fastify.post(
    '/signin',
    {
      schema: {
        body: signinBodySchema,
        response: {
          200: userResponseSchema,
        },
      },
    },
    async (request) => service.signin(request.body),
  );
};
