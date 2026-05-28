/**
 * Unit tests for getQsoCountForRange (src/services/qso-service.ts).
 *
 * Native-ESM Jest: globals come from '@jest/globals', and module mocking uses
 * jest.unstable_mockModule + dynamic import (jest.mock is not hoisted under ESM).
 * The db pool is mocked because mysql.createPool would open a real connection at
 * import time.
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../src/db/pool.js', () => ({
  default: {},
  db: { execute: jest.fn() },
}));

const { getQsoCountForRange } = await import('../src/services/qso-service.js');
const { db } = await import('../src/db/pool.js');
const mockExecute = db.execute as unknown as jest.Mock;

describe('getQsoCountForRange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the count and issues no date clauses when called with userId only', async () => {
    mockExecute.mockResolvedValue([[{ count: 7 }], []]);

    const result = await getQsoCountForRange(1);

    expect(result).toBe(7);

    const [sql, params] = mockExecute.mock.calls[0];
    expect(sql).toBe('SELECT COUNT(*) AS count FROM Contacts WHERE user_id = ?');
    expect(params).toEqual([1]);
  });

  it('appends only the >= clause and includes from in params when only from is supplied', async () => {
    mockExecute.mockResolvedValue([[{ count: 42 }], []]);

    const result = await getQsoCountForRange(1, '2024-01-01');

    expect(result).toBe(42);

    const [sql, params] = mockExecute.mock.calls[0];
    expect(sql).toContain('AND QSO_Date >= ?');
    expect(sql).not.toContain('AND QSO_Date <= ?');
    expect(params).toEqual([1, '2024-01-01']);
  });

  it('appends only the <= clause and includes to in params when only to is supplied', async () => {
    mockExecute.mockResolvedValue([[{ count: 15 }], []]);

    const result = await getQsoCountForRange(1, undefined, '2024-12-31');

    expect(result).toBe(15);

    const [sql, params] = mockExecute.mock.calls[0];
    expect(sql).toContain('AND QSO_Date <= ?');
    expect(sql).not.toContain('AND QSO_Date >= ?');
    expect(params).toEqual([1, '2024-12-31']);
  });

  it('appends >= clause before <= clause and includes both dates in params when both are supplied', async () => {
    mockExecute.mockResolvedValue([[{ count: 99 }], []]);

    const result = await getQsoCountForRange(2, '2024-01-01', '2024-12-31');

    expect(result).toBe(99);

    const [sql, params] = mockExecute.mock.calls[0];
    expect(sql).toContain('AND QSO_Date >= ?');
    expect(sql).toContain('AND QSO_Date <= ?');
    expect(sql.indexOf('AND QSO_Date >= ?')).toBeLessThan(sql.indexOf('AND QSO_Date <= ?'));
    expect(params).toEqual([2, '2024-01-01', '2024-12-31']);
  });

  it('returns 0 when the count row is present but count is 0', async () => {
    mockExecute.mockResolvedValue([[{ count: 0 }], []]);

    const result = await getQsoCountForRange(1);

    expect(result).toBe(0);
  });

  it('returns 0 when the rows array is empty (no rows returned)', async () => {
    mockExecute.mockResolvedValue([[], []]);

    const result = await getQsoCountForRange(1);

    expect(result).toBe(0);
  });
});
