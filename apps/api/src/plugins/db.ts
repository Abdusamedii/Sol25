import fp from 'fastify-plugin';
import { createDatabase } from '../db/index.js';

export const dbPlugin = fp(async (fastify) => {
  const { client, db } = createDatabase();

  fastify.decorate('db', db);
  fastify.decorate('dbClient', client);

  fastify.addHook('onClose', async () => {
    await client.end();
  });
});
