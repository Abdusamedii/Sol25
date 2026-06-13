import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ProductsRepository } from './products.repository.js';
import {
  createProductBodySchema,
  productListResponseSchema,
  productParamsSchema,
  productResponseSchema,
  updateProductBodySchema,
} from './products.schema.js';
import { ProductsService } from './products.service.js';

export const productsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const service = new ProductsService(new ProductsRepository(fastify.db));

  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: productListResponseSchema,
        },
      },
    },
    async () => service.list(),
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: productParamsSchema,
        response: {
          200: productResponseSchema,
        },
      },
    },
    async (request) => service.findById(request.params.id),
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProductBodySchema,
        response: {
          201: productResponseSchema,
        },
      },
    },
    async (request, reply) => reply.status(201).send(await service.create(request.body)),
  );

  fastify.put(
    '/:id',
    {
      schema: {
        params: productParamsSchema,
        body: updateProductBodySchema,
        response: {
          200: productResponseSchema,
        },
      },
    },
    async (request) => service.update(request.params.id, request.body),
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: productParamsSchema,
        response: {
          200: productResponseSchema,
        },
      },
    },
    async (request) => service.delete(request.params.id),
  );
};
