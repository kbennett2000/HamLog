import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { requireApiKey } from '../middleware/api-key.js';
import { validate } from '../middleware/validate.js';
import { createQsoSchema, createPotaQsoSchema, createContestQsoSchema } from '../schemas/qso.schema.js';
import {
  createContact, createPotaQso, createContestQso,
  deleteContact, getAllQsosWithPota,
  getQsosByCallsign, getQsosByPark, getQsosForExport,
} from '../services/qso-service.js';
import { parseAdif, adifRecordToQso } from '../services/adif-parser.js';
import { exportAdif } from '../services/adif-exporter.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { callsign, park } = req.query;

    if (typeof callsign === 'string') {
      const rows = await getQsosByCallsign(callsign);
      return res.json({ Contacts: rows });
    }

    if (typeof park === 'string') {
      const rows = await getQsosByPark(park);
      return res.json({ Contacts: rows });
    }

    const result = await getAllQsosWithPota();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireApiKey, validate(createQsoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = await createContact(req.body);
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/pota', requireApiKey, validate(createPotaQsoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const potaId = await createPotaQso(req.params.id as string, req.body.parkId, req.body.qsoType);
    res.status(201).json({ id: potaId });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/contest', requireApiKey, validate(createContestQsoSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contestQsoId = await createContestQso(req.params.id as string, req.body.contestId, req.body.qsoNumber, req.body.exchangeData);
    res.status(201).json({ id: contestQsoId });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteContact(req.params.id as string);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/qsos/export — export all QSOs as ADIF (optionally filtered by park)
router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const park = typeof req.query.park === 'string' ? req.query.park : undefined;
    const rows = await getQsosForExport(park);
    const adif = exportAdif(rows, park);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="hamlog-export.adi"`);
    res.send(adif);
  } catch (err) {
    next(err);
  }
});

// POST /api/qsos/import — import QSOs from an ADIF file
router.post('/import', requireApiKey, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

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
      });

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

export default router;
