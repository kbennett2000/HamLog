import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import qsoRoutes from './routes/qsos.js';
import contactInfoRoutes from './routes/contact-info.js';
import { errorHandler } from './middleware/error-handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/qsos', qsoRoutes);
app.use('/api/contact-info', contactInfoRoutes);

app.use(errorHandler);

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

export default app;
