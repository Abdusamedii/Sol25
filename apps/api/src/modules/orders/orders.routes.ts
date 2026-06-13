import type { PayOrderResponse } from '@sol25/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { PaymentDeclinedError } from '../../lib/errors.js';
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

  fastify.get(
    '/',
    {
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
      schema: {
        params: orderParamsSchema,
        response: {
          200: orderResponseSchema,
        },
      },
    },
    async (request) => service.findById(request.params.id),
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createOrderBodySchema,
        response: {
          201: orderResponseSchema,
        },
      },
    },
    async (request, reply) => reply.status(201).send(await service.create(request.body)),
  );

  fastify.post(
    '/:id/payments',
    {
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
