import { describe, it, expect } from '@jest/globals';

/**
 * Unit tests for GET /api/qsos/map query validation (Security F7).
 * Exercises validateQuery(mapQuerySchema) directly with mock req/res/next —
 * no DB or running server needed.
 */

async function getValidator() {
  const { validateQuery } = await import('../src/middleware/validate.js');
  const { mapQuerySchema } = await import('../src/schemas/map.schema.js');
  return validateQuery(mapQuerySchema);
}

function mockReq(query: Record<string, unknown>) {
  return { query } as any;
}

function mockRes() {
  const res: any = {};
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: any) => { res.body = body; return res; };
  return res;
}

describe('validateQuery(mapQuerySchema) — /api/qsos/map', () => {
  it('passes a valid from/to pair (calls next, no response)', async () => {
    const mw = await getValidator();
    const req = mockReq({ from: '2026-01-01', to: '2026-06-04' });
    const res = mockRes();
    let nextCalled = false;

    mw(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeUndefined();
  });

  it('passes when both params are omitted', async () => {
    const mw = await getValidator();
    const req = mockReq({});
    const res = mockRes();
    let nextCalled = false;

    mw(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeUndefined();
  });

  it('passes when params are empty strings (preserved no-filter behavior)', async () => {
    const mw = await getValidator();
    const req = mockReq({ from: '', to: '' });
    const res = mockRes();
    let nextCalled = false;

    mw(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeUndefined();
  });

  it('passes when only one param is provided', async () => {
    const mw = await getValidator();
    const req = mockReq({ from: '2026-01-01' });
    const res = mockRes();
    let nextCalled = false;

    mw(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeUndefined();
  });

  it('rejects a non-date string with 400 and the app error shape', async () => {
    const mw = await getValidator();
    const req = mockReq({ from: 'notadate' });
    const res = mockRes();
    let nextCalled = false;

    mw(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details[0].field).toBe('from');
  });

  it('rejects an out-of-range date (2026-13-40) with 400', async () => {
    const mw = await getValidator();
    const req = mockReq({ to: '2026-13-40' });
    const res = mockRes();
    let nextCalled = false;

    mw(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});
