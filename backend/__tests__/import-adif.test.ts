import { jest, describe, it, expect, beforeEach } from '@jest/globals';

/**
 * Data-quality F9 — importAdif skip-and-report. A single bad record must NOT abort the
 * batch; valid records import and bad ones are reported with a reason.
 *
 * Native-ESM Jest: the db pool is mocked so createContact/createPotaQso don't open a
 * real connection (mysql.createPool runs at import time). Every db.execute resolves to
 * an insert result, so each valid record "inserts" successfully.
 */

jest.unstable_mockModule('../src/db/pool.js', () => ({
  default: {},
  db: { execute: jest.fn() },
}));

const { importAdif } = await import('../src/services/qso-service.js');
const { db } = await import('../src/db/pool.js');
const mockExecute = db.execute as unknown as jest.Mock;

describe('importAdif', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue([{ insertId: 1 }, []]);
  });

  it('imports valid records and skips-and-reports the bad ones (never throws)', async () => {
    const records = [
      { call: 'W1AW', qso_date: '20260101', time_on: '1200', freq: '14.074' }, // ok
      { call: 'W1 AW', qso_date: '20260101', freq: '14.074' },                 // bad callsign
      { call: 'N0CALL', qso_date: '20260101', freq: '0' },                     // bad frequency
      { call: 'K1ABC', qso_date: '20260101' },                                 // ok, band-only (no freq)
      { qso_date: '20260101' },                                                // missing callsign
    ];

    const result = await importAdif(records, 1);

    expect(result.importedIds).toHaveLength(2);
    expect(result.skipped).toHaveLength(3);

    const reasons = result.skipped.map((s) => s.reason);
    expect(reasons).toContain('invalid callsign format');
    expect(reasons).toContain('invalid frequency');
    expect(reasons).toContain('missing callsign');
  });

  it('does not abort the batch when one insert throws', async () => {
    // First insert rejects, subsequent inserts succeed.
    mockExecute
      .mockRejectedValueOnce(new Error('db blip'))
      .mockResolvedValue([{ insertId: 2 }, []]);

    const records = [
      { call: 'W1AW', qso_date: '20260101', freq: '14.074' }, // insert throws -> skipped
      { call: 'K1ABC', qso_date: '20260101', freq: '7.040' }, // imported
    ];

    const result = await importAdif(records, 1);

    expect(result.importedIds).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toBe('insert failed');
  });
});
