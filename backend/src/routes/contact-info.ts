import { Router, Request, Response, NextFunction } from 'express';
import { requireApiKey } from '../middleware/api-key.js';
import { validate } from '../middleware/validate.js';
import { createContactInfoSchema } from '../schemas/contact-info.schema.js';
import {
  getContactInfo, contactInfoExists, createContactInfo,
} from '../services/contact-info-service.js';

const router = Router();

router.get('/:callsign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await getContactInfo(req.params.callsign as string);
    res.json({ Contacts: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:callsign/exists', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exists = await contactInfoExists(req.params.callsign as string);
    res.json({ exists, count: exists ? 1 : 0 });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireApiKey, validate(createContactInfoSchema), async (req: Request, res: Response, next: NextFunction) => {
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
