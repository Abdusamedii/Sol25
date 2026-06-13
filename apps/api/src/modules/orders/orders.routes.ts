import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ForbiddenError } from '../../lib/errors.js';
import { getAuthenticatedUser } from '../../plugins/auth.js';
import { OrdersRepository } from './orders.repository.js';
import {
  createOrderBodySchema,
  orderListResponseSchema,
  orderParamsSchema,
  orderResponseSchema,
  paymentDeclinedResponseSchema,
} from './orders.schema.js';
import { OrdersService } from './orders.service.js';

export const ordersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const service = new OrdersService(fastify.db, new OrdersRepository(fastify.db));
  const requireAdmin = fastify.authorize('admin');
  const requireAuth = fastify.authenticate;

  fastify.get(
    '/',
    {
      preHandler: [requireAdmin],
      schema: {
        response: {
          200: orderListResponseSchema,
        },
      },
    },
    async () => service.list(),
  );

  fastify.get(
    '/:id',
    {
      preHandler: [requireAuth],
      schema: {
        params: orderParamsSchema,
        response: {
          200: orderResponseSchema,
        },
      },
    },
    async (request) => {
      const order = await service.findById(request.params.id);
      const user = getAuthenticatedUser(request);

      if (user.role !== 'admin' && order.userId !== user.sub) {
        throw new ForbiddenError('You cannot view this order');
      }

      return order;
    },
  );

  fastify.post(
    '/',
    {
      preHandler: [requireAuth],
      schema: {
        body: createOrderBodySchema,
        response: {
          201: orderResponseSchema,
          402: paymentDeclinedResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request);

      if (user.role === 'admin') {
        throw new ForbiddenError('Admins cannot place orders');
      }

      return reply.status(201).send(await service.create(user.sub, request.body));
    },
  );
};
