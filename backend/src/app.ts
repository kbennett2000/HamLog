import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import qsoRoutes from './routes/qsos.js';
import contactInfoRoutes from './routes/contact-info.js';
import backupRoutes from './routes/backup.js';
import { errorHandler } from './middleware/error-handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Security headers (F5). Enforce helmet's protective defaults (X-Content-Type-Options:
// nosniff, X-Frame-Options, Referrer-Policy, etc.). The enforcing CSP is turned off and
// replaced with a REPORT-ONLY CSP below: a strict CSP would block OSM tiles, Leaflet's
// inline styles, and CRA's inlined runtime script, and that can't be verified without
// running the SPA. Report-only blocks nothing — tune from the violation report on the
// Docker host, then flip reportOnly:false to enforce in a follow-up.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    reportOnly: true,
    directives: {
      'img-src': ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
      'style-src': ["'self'", "'unsafe-inline'"],
      'connect-src': ["'self'"],
      'upgrade-insecure-requests': null, // plain HTTP on LAN — don't force https
    },
  }),
);

// CORS (F6): default to SAME-ORIGIN (the SPA is served by this server). Only enable
// CORS when CORS_ORIGIN is explicitly set (separate-origin client). No more '*' default.
const corsOrigin = process.env.CORS_ORIGIN?.trim();
if (corsOrigin) {
  const origins = corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(cors({ origin: origins.length === 1 ? origins[0] : origins }));
}

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/qsos', qsoRoutes);
app.use('/api/contact-info', contactInfoRoutes);
app.use('/api/backup', backupRoutes);

app.use(errorHandler);

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

export default app;
