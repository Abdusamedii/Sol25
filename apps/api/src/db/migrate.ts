import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDatabase } from './index.js';

export async function runMigrations() {
  const { client, db } = createDatabase();

  try {
    await migrate(db, { migrationsFolder: process.env.MIGRATIONS_FOLDER ?? './src/db/migrations' });
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
