import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { env } from './config/env.js';
import { formatError } from './lib/errors.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { ordersRoutes } from './modules/orders/orders.routes.js';
import { productsRoutes } from './modules/products/products.routes.js';
import { corsPlugin } from './plugins/cors.js';
import { dbPlugin } from './plugins/db.js';

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(formatError);

  await app.register(corsPlugin);
  await app.register(dbPlugin);

  app.get(
    '/health',
    {
      schema: {
        response: {
          200: z.object({
            status: z.literal('ok'),
            uptime: z.number(),
          }),
        },
      },
    },
    async () => ({
      status: 'ok' as const,
      uptime: process.uptime(),
    }),
  );

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(productsRoutes, { prefix: '/products' });
  await app.register(ordersRoutes, { prefix: '/orders' });

  return app;
}
