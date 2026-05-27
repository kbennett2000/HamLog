import { Router, Request, Response } from 'express';
import { register, login, AuthError } from '../services/auth-service.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import { requireAuth } from '../middleware/auth.js';
import logger from '../logger.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await register(input);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Username or callsign already taken' });
      return;
    }
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    logger.error({ err }, 'Registration failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await login(input);
    res.json(result);
  } catch (err: any) {
    if (err instanceof AuthError) {
      res.status(401).json({ error: err.message });
      return;
    }
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    logger.error({ err }, 'Login failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json(req.user);
});

export default router;
