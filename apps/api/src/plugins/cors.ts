import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';

export const corsPlugin = fp(async (fastify) => {
  await fastify.register(cors, {
    origin: env.WEB_ORIGIN,
  });
});
