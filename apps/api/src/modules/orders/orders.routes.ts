import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { OrdersRepository } from './orders.repository.js';
import {
  createOrderBodySchema,
  orderListResponseSchema,
  orderParamsSchema,
  orderResponseSchema,
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
};
