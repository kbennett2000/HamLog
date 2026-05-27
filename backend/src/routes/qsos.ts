import { Router, Request, Response, NextFunction } from 'express';
import { requireApiKey } from '../middleware/api-key.js';
import { validate } from '../middleware/validate.js';
import { createQsoSchema, createPotaQsoSchema, createContestQsoSchema } from '../schemas/qso.schema.js';
import {
  createContact, createPotaQso, createContestQso,
  deleteContact, getAllQsosWithPota,
  getQsosByCallsign, getQsosByPark,
} from '../services/qso-service.js';

const router = Router();

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

export default router;
