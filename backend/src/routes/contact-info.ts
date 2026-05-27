import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createContactInfoSchema } from '../schemas/contact-info.schema.js';
import {
  getContactInfo, contactInfoExists, createContactInfo,
} from '../services/contact-info-service.js';

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

export default router;
