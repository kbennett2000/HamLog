import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { buildJsonBackup } from '../services/backup-service.js';
import { getQsosForExport } from '../services/qso-service.js';
import { exportAdif } from '../services/adif-exporter.js';

const router = Router();

router.get('/json', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const backup = await buildJsonBackup(req.user!.userId, req.user!.username, req.user!.callsign);
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="hamlog-backup-${dateStr}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    next(err);
  }
});

router.get('/adif', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const park = typeof req.query.park === 'string' ? req.query.park : undefined;
    const rows = await getQsosForExport(req.user!.userId, park);
    const adif = exportAdif(rows, park);
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="hamlog-backup-${dateStr}.adi"`);
    res.send(adif);
  } catch (err) {
    next(err);
  }
});

export default router;
