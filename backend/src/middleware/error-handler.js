export function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
}
