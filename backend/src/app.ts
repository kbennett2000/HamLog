import express from 'express';
import cors from 'cors';
import qsoRoutes from './routes/qsos.js';
import contactInfoRoutes from './routes/contact-info.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use('/api/qsos', qsoRoutes);
app.use('/api/contact-info', contactInfoRoutes);

app.use(errorHandler);

export default app;
