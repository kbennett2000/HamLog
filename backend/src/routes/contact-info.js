import { Router } from 'express';
import { requireApiKey } from '../middleware/api-key.js';
import {
  getContactInfo, contactInfoExists, createContactInfo,
} from '../services/contact-info-service.js';

const router = Router();

// GET /api/contact-info/:callsign — get info for a callsign
router.get('/:callsign', async (req, res, next) => {
  try {
    const rows = await getContactInfo(req.params.callsign);
    res.json({ Contacts: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/contact-info/:callsign/exists — check if callsign has info
router.get('/:callsign/exists', async (req, res, next) => {
  try {
    const exists = await contactInfoExists(req.params.callsign);
    res.json({ exists, count: exists ? 1 : 0 });
  } catch (err) {
    next(err);
  }
});

// POST /api/contact-info — create contact info (skips if already exists)
router.post('/', requireApiKey, async (req, res, next) => {
  try {
    const result = await createContactInfo(req.body);
    if (result.skipped) {
      return res.json({ skipped: true });
    }
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
});

export default router;
