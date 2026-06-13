import postgres from 'postgres';
import { env } from '../config/env.js';
import { runSeed } from './seed.js';

async function seedIfEmpty() {
  const client = postgres(env.DATABASE_URL, { max: 1, prepare: false });

  let shouldSeed = false;

  try {
    const rows = await client<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM users
    `;
    const count = rows[0]?.count ?? 0;

    if (count > 0) {
      console.log('Database already seeded, skipping.');
      return;
    }

    console.log('Empty database detected, running first-boot seed...');
    shouldSeed = true;
  } finally {
    await client.end();
  }

  if (shouldSeed) {
    await runSeed();
  }
}

seedIfEmpty().catch((error) => {
  console.error(error);
  process.exit(1);
});
