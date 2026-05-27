import { describe, it, expect, beforeAll } from '@jest/globals';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-for-middleware-tests';

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

describe('requireAuth middleware logic', () => {
  async function getMiddleware() {
    const { requireAuth } = await import('../src/middleware/auth.js');
    return requireAuth;
  }

  function mockReq(authHeader?: string) {
    return {
      headers: authHeader ? { authorization: authHeader } : {},
      user: undefined,
    } as any;
  }

  function mockRes() {
    const res: any = {};
    res.status = (code: number) => { res.statusCode = code; return res; };
    res.json = (body: any) => { res.body = body; return res; };
    return res;
  }

  it('returns 401 when no Authorization header', async () => {
    const requireAuth = await getMiddleware();
    const req = mockReq();
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    expect(res.statusCode).toBe(401);
    expect(nextCalled).toBe(false);
  });

  it('returns 401 for invalid token', async () => {
    const requireAuth = await getMiddleware();
    const req = mockReq('Bearer invalid.token.here');
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    expect(res.statusCode).toBe(401);
    expect(nextCalled).toBe(false);
  });

  it('sets req.user and calls next for valid token', async () => {
    const requireAuth = await getMiddleware();
    const token = jwt.sign({ sub: 42, username: 'testuser', callsign: 'W1TST' }, JWT_SECRET, { expiresIn: '1h' });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(req.user).toEqual({
      userId: 42,
      username: 'testuser',
      callsign: 'W1TST',
    });
  });

  it('returns 401 for expired token', async () => {
    const requireAuth = await getMiddleware();
    const token = jwt.sign({ sub: 1 }, JWT_SECRET, { expiresIn: '-1s' });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => { nextCalled = true; });

    expect(res.statusCode).toBe(401);
    expect(nextCalled).toBe(false);
  });
});
