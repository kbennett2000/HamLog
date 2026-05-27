import 'dotenv/config';
import app from './app.js';
import logger from './logger.js';
import { runMigrations } from './migrations/migrate.js';

const port = Number(process.env.PORT) || 8050;

async function start() {
  try {
    await runMigrations();
  } catch (err) {
    logger.error({ err }, 'Migration failed — starting server anyway');
  }

  app.listen(port, '0.0.0.0', () => {
    logger.info({ port }, 'HamLog backend listening');
  });
}

start();
