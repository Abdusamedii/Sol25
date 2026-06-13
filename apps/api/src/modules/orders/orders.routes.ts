import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { OrdersRepository } from './orders.repository.js';
import { createOrderBodySchema, orderListResponseSchema, orderResponseSchema } from './orders.schema.js';
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
