import 'dotenv/config';
import app from './app.js';
import logger from './logger.js';

const port = Number(process.env.PORT) || 7800;

app.listen(port, '0.0.0.0', () => {
  logger.info({ port }, 'HamLog backend listening');
});
