import { Request, Response, NextFunction } from 'express';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.API_KEY;

  if (!expected) {
    res.status(503).json({ error: 'API_KEY not configured' });
    return;
  }

  const header = req.headers.authorization;
  if (!header || header !== `Bearer ${expected}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
