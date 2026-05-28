import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createContactInfoSchema } from '../schemas/contact-info.schema.js';
import {
  getContactInfo, contactInfoExists, createContactInfo,
  lookupAndCreateContactInfo, updateContactInfoFromHamDB, getCallsignsNeedingBackfill,
} from '../services/contact-info-service.js';
import logger from '../logger.js';

const router = Router();

router.get('/:callsign', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await getContactInfo(req.params.callsign as string);
    res.json({ Contacts: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:callsign/exists', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exists = await contactInfoExists(req.params.callsign as string);
    res.json({ exists, count: exists ? 1 : 0 });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, validate(createContactInfoSchema), async (req: Request, res: Response, next: NextFunction) => {
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

router.post('/lookup', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const callsign = req.body.callsign;
    if (!callsign || typeof callsign !== 'string') {
      res.status(400).json({ error: 'callsign is required' });
      return;
    }
    const created = await lookupAndCreateContactInfo(callsign);
    res.json({ status: created ? 'created' : 'exists_or_failed' });
  } catch (err) {
    next(err);
  }
});

router.post('/backfill', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const callsigns = await getCallsignsNeedingBackfill();
    let updated = 0;
    let failed = 0;

    for (const callsign of callsigns) {
      try {
        const success = await updateContactInfoFromHamDB(callsign);
        if (success) updated++;
        else failed++;
      } catch {
        failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info({ total: callsigns.length, updated, failed }, 'Backfill complete');
    res.json({ total: callsigns.length, updated, failed });
  } catch (err) {
    next(err);
  }
});

export default router;
