import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

export function createDatabase(databaseUrl = env.DATABASE_URL) {
  const client = postgres(databaseUrl, {
    max: env.NODE_ENV === 'test' ? 1 : 10,
    prepare: false,
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}

export type Database = ReturnType<typeof createDatabase>['db'];
export type DatabaseClient = ReturnType<typeof createDatabase>['client'];
