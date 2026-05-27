import { Router } from 'express';
import { requireApiKey } from '../middleware/api-key.js';
import {
  createContact, createPotaQso, createContestQso,
  deleteContact, getAllQsosWithPota,
  getQsosByCallsign, getQsosByPark,
} from '../services/qso-service.js';

const router = Router();

// GET /api/qsos — list all QSOs (with optional callsign or park filter)
router.get('/', async (req, res, next) => {
  try {
    const { callsign, park } = req.query;

    if (callsign) {
      const rows = await getQsosByCallsign(callsign);
      return res.json({ Contacts: rows });
    }

    if (park) {
      const rows = await getQsosByPark(park);
      return res.json({ Contacts: rows });
    }

    const result = await getAllQsosWithPota();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/qsos — create a new contact
router.post('/', requireApiKey, async (req, res, next) => {
  try {
    const { date, time, callsign, frequency, notes, received, sent } = req.body;

    if (!callsign || !frequency || !date) {
      return res.status(400).json({ error: 'callsign, frequency, and date are required' });
    }

    const id = await createContact({ date, time, callsign, frequency, notes, received, sent });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
});

// POST /api/qsos/:id/pota — add a POTA record to a contact
router.post('/:id/pota', requireApiKey, async (req, res, next) => {
  try {
    const { parkId, qsoType } = req.body;
    if (!parkId || !qsoType) {
      return res.status(400).json({ error: 'parkId and qsoType are required' });
    }
    const potaId = await createPotaQso(req.params.id, parkId, qsoType);
    res.status(201).json({ id: potaId });
  } catch (err) {
    next(err);
  }
});

// POST /api/qsos/:id/contest — add a Contest record to a contact
router.post('/:id/contest', requireApiKey, async (req, res, next) => {
  try {
    const { contestId, qsoNumber, exchangeData } = req.body;
    if (!contestId) {
      return res.status(400).json({ error: 'contestId is required' });
    }
    const contestQsoId = await createContestQso(req.params.id, contestId, qsoNumber, exchangeData);
    res.status(201).json({ id: contestQsoId });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/qsos/:id — delete a contact and related records (transactional)
router.delete('/:id', requireApiKey, async (req, res, next) => {
  try {
    await deleteContact(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export default router;
