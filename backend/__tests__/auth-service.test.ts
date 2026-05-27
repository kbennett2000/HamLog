import { describe, it, expect, beforeAll } from '@jest/globals';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = 'test-secret-for-unit-tests';

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

describe('JWT token handling', () => {
  it('signs and verifies a token with correct payload', () => {
    const payload = { sub: 1, username: 'testuser', callsign: 'W1TEST' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.sub).toBe(1);
    expect(decoded.username).toBe('testuser');
    expect(decoded.callsign).toBe('W1TEST');
  });

  it('rejects a token signed with wrong secret', () => {
    const token = jwt.sign({ sub: 1 }, 'wrong-secret', { expiresIn: '1h' });
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ sub: 1 }, JWT_SECRET, { expiresIn: '-1s' });
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
  });
});

describe('bcrypt password hashing', () => {
  it('hashes and verifies a password', async () => {
    const password = 'mySecurePassword123';
    const hash = await bcrypt.hash(password, 12);

    expect(hash).not.toBe(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await bcrypt.hash('correct', 12);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });
});
