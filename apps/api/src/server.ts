import { env } from './config/env.js';
import { buildApp } from './app.js';

const app = await buildApp();

const close = async () => {
  await app.close();
  process.exit(0);
};

process.on('SIGINT', close);
process.on('SIGTERM', close);

await app.listen({
  host: env.HOST,
  port: env.PORT,
});
