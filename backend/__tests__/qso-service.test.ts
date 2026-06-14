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

const { getQsoCountForRange, createContact, DuplicateQsoError } = await import('../src/services/qso-service.js');
const { db } = await import('../src/db/pool.js');
const mockExecute = db.execute as unknown as jest.Mock;

const sampleQso = {
  date: '2026-01-01', time: '12:00', callsign: 'W1AW', frequency: '14.074',
  notes: '', received: '', sent: '', mode: 'SSB', band: '20m',
};

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

describe('createContact duplicate detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws DuplicateQsoError and does not INSERT when a matching QSO exists', async () => {
    mockExecute.mockResolvedValueOnce([[{ QSO_ID: 42 }], []]); // dedup lookup hits

    await expect(createContact(sampleQso, 1)).rejects.toBeInstanceOf(DuplicateQsoError);

    expect(mockExecute).toHaveBeenCalledTimes(1); // only the SELECT, never the INSERT
    const [sql, params] = mockExecute.mock.calls[0];
    expect(sql).toContain('SELECT QSO_ID FROM Contacts');
    expect(sql).toContain('<=>'); // null-safe band/mode comparison
    // params: [userId, callsign, utcDatetime, band, mode]. The datetime is built by the
    // same code used on insert, so it stays consistent for matching; assert the parts
    // that are TZ-independent.
    expect([params[0], params[1], params[3], params[4]]).toEqual([1, 'W1AW', '20m', 'SSB']);
    expect(params[2]).toMatch(/ 12:00:00$/);
  });

  it('proceeds to INSERT and returns the new id when no duplicate is found', async () => {
    mockExecute
      .mockResolvedValueOnce([[], []])               // dedup lookup: no match
      .mockResolvedValueOnce([{ insertId: 7 }, []])  // INSERT
      .mockResolvedValue([[], []]);                  // background contact-info lookups

    const id = await createContact(sampleQso, 1);

    expect(id).toBe(7);
    const [sql] = mockExecute.mock.calls[1];
    expect(sql).toContain('INSERT INTO Contacts');
  });

  it('treats empty band/mode as NULL in the dedup lookup', async () => {
    mockExecute.mockResolvedValueOnce([[], []]).mockResolvedValue([{ insertId: 1 }, []]);

    await createContact({ ...sampleQso, band: '', mode: '' }, 1);

    const [, params] = mockExecute.mock.calls[0];
    expect([params[0], params[1], params[3], params[4]]).toEqual([1, 'W1AW', null, null]);
  });
});
