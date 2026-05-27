export function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY;

  if (!expected) {
    return res.status(503).json({ error: 'API_KEY not configured' });
  }

  const header = req.headers.authorization;
  if (!header || header !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
