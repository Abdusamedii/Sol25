import type { PayOrderResponse } from '@sol25/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ForbiddenError, PaymentDeclinedError } from '../../lib/errors.js';
import { getAuthenticatedUser } from '../../plugins/auth.js';
import { OrdersRepository } from './orders.repository.js';
import {
  createOrderBodySchema,
  createPaymentBodySchema,
  orderListResponseSchema,
  orderParamsSchema,
  orderResponseSchema,
  paymentDeclinedResponseSchema,
  payOrderResponseBodySchema,
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
        },
      },
    },
    async (request, reply) =>
      reply.status(201).send(await service.create(getAuthenticatedUser(request).sub, request.body)),
  );

  fastify.post(
    '/:id/payments',
    {
      preHandler: [requireAuth],
      schema: {
        params: orderParamsSchema,
        body: createPaymentBodySchema,
        response: {
          201: payOrderResponseBodySchema,
          402: paymentDeclinedResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const order = await service.findById(request.params.id);
      const user = getAuthenticatedUser(request);

      if (user.role !== 'admin' && order.userId !== user.sub) {
        throw new ForbiddenError('You cannot pay for this order');
      }

      try {
        return reply.status(201).send(await service.processPayment(request.params.id, request.body));
      } catch (error) {
        if (error instanceof PaymentDeclinedError && error.details) {
          const details = error.details as PayOrderResponse;

          return reply.status(402).send({
            error: {
              code: 'PAYMENT_DECLINED' as const,
              message: error.message,
              details,
            },
          });
        }

        throw error;
      }
    },
  );
};
