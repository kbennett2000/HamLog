import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createQsoSchema, createPotaQsoSchema, createContestQsoSchema } from '../schemas/qso.schema.js';
import {
  createContact, createPotaQso, createContestQso,
  deleteContact, getAllQsosWithPota,
  getQsosByCallsign, getQsosByPark, getQsosForExport,
  verifyContactOwnership,
} from '../services/qso-service.js';
import { parseAdif, adifRecordToQso } from '../services/adif-parser.js';
import { exportAdif } from '../services/adif-exporter.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/export', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const park = typeof req.query.park === 'string' ? req.query.park : undefined;
    const rows = await getQsosForExport(req.user!.userId, park);
    const adif = exportAdif(rows, park);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="hamlog-export.adi"`);
    res.send(adif);
  } catch (err) {
    next(err);
  }
});

router.post('/import', requireAuth, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.user!.userId;
    const content = req.file.buffer.toString('utf-8');
    const records = parseAdif(content);

    const imported: number[] = [];
    for (const record of records) {
      const qso = adifRecordToQso(record);
      if (!qso.callsign || !qso.date) continue;

      const id = await createContact({
        date: qso.date,
        time: qso.time,
        callsign: qso.callsign,
        frequency: qso.frequency,
        notes: qso.notes,
        received: qso.received,
        sent: qso.sent,
        mode: qso.mode,
        band: qso.band,
      }, userId);

      if (qso.potaParkId) {
        await createPotaQso(String(id), qso.potaParkId, qso.potaQsoType || '1');
      }

      imported.push(id);
    }

    res.status(201).json({ imported: imported.length, ids: imported });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { callsign, park } = req.query;

    if (typeof callsign === 'string') {
      const rows = await getQsosByCallsign(callsign, userId);
      return res.json({ Contacts: rows });
    }

    if (typeof park === 'string') {
      const rows = await getQsosByPark(park, userId);
      return res.json({ Contacts: rows });
    }

    const result = await getAllQsosWithPota(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, validate(createQsoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = await createContact(req.body, req.user!.userId);
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/pota', requireAuth, validate(createPotaQsoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const owns = await verifyContactOwnership(req.params.id as string, req.user!.userId);
    if (!owns) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    const potaId = await createPotaQso(req.params.id as string, req.body.parkId, req.body.qsoType);
    res.status(201).json({ id: potaId });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/contest', requireAuth, validate(createContestQsoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const owns = await verifyContactOwnership(req.params.id as string, req.user!.userId);
    if (!owns) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    const contestQsoId = await createContestQso(req.params.id as string, req.body.contestId, req.body.qsoNumber, req.body.exchangeData);
    res.status(201).json({ id: contestQsoId });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await deleteContact(req.params.id as string, req.user!.userId);
    if (!deleted) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;
