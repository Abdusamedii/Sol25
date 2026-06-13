import type { Database, DatabaseClient } from '../db/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
    dbClient: DatabaseClient;
  }
}
