import { describe, it, expect } from '@jest/globals';
import { RowDataPacket } from 'mysql2';
import { assembleBackup } from '../src/services/backup-service.js';

function makeContact(overrides: Partial<Record<string, unknown>> = {}): RowDataPacket {
  return {
    QSO_ID: 1,
    user_id: 1,
    QSO_Date: '2026-05-27T00:00:00.000Z',
    QSO_MTZTime: '14:30',
    QSO_Callsign: 'W1AW',
    QSO_Frequency: '14.074',
    QSO_Notes: 'Test QSO',
    QSO_Received: '599',
    QSO_Sent: '599',
    qso_datetime_utc: '2026-05-27T14:30:00.000Z',
    frequency_mhz: 14.074,
    mode: 'FT8',
    band: '20m',
    ...overrides,
    constructor: { name: 'RowDataPacket' },
  } as unknown as RowDataPacket;
}

function makePotaQso(overrides: Partial<Record<string, unknown>> = {}): RowDataPacket {
  return {
    POTA_QSO_ID: 1,
    QSO_ID: 1,
    POTAPark_ID: 'K-0001',
    QSO_Type: '1',
    ...overrides,
    constructor: { name: 'RowDataPacket' },
  } as unknown as RowDataPacket;
}

function makeContestQso(overrides: Partial<Record<string, unknown>> = {}): RowDataPacket {
  return {
    CONTEST_QSO_ID: 1,
    QSO_ID: 1,
    CONTEST_ID: 1,
    CONTEST_QSO_NUMBER: '001',
    CONTEST_QSO_EXCHANGE_DATA: '5NN IL',
    ...overrides,
    constructor: { name: 'RowDataPacket' },
  } as unknown as RowDataPacket;
}

describe('assembleBackup', () => {
  it('produces a valid backup structure with data', () => {
    const contacts = [makeContact()];
    const potaQsos = [makePotaQso()];
    const contestQsos = [makeContestQso()];

    const backup = assembleBackup(contacts, potaQsos, contestQsos, 'testuser', 'AE9S');

    expect(backup.meta.version).toBe('1.0');
    expect(backup.meta.generator).toBe('HamLog');
    expect(backup.meta.username).toBe('testuser');
    expect(backup.meta.callsign).toBe('AE9S');
    expect(backup.meta.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(backup.meta.note).toBeTruthy();
    expect(backup.contacts).toHaveLength(1);
    expect(backup.potaQsos).toHaveLength(1);
    expect(backup.contestQsos).toHaveLength(1);
  });

  it('handles empty data sets', () => {
    const backup = assembleBackup([], [], [], 'testuser', 'AE9S');

    expect(backup.meta.version).toBe('1.0');
    expect(backup.meta.username).toBe('testuser');
    expect(backup.contacts).toEqual([]);
    expect(backup.potaQsos).toEqual([]);
    expect(backup.contestQsos).toEqual([]);
  });

  it('preserves null fields in contacts', () => {
    const contact = makeContact({ QSO_Notes: null, mode: null, band: null });
    const backup = assembleBackup([contact], [], [], 'testuser', 'AE9S');

    expect(backup.contacts[0]).toHaveProperty('QSO_Notes', null);
    expect(backup.contacts[0]).toHaveProperty('mode', null);
    expect(backup.contacts[0]).toHaveProperty('band', null);
  });

  it('preserves contact field values', () => {
    const contact = makeContact({ QSO_Callsign: 'N0CALL', frequency_mhz: 7.074 });
    const backup = assembleBackup([contact], [], [], 'testuser', 'AE9S');

    expect(backup.contacts[0]).toHaveProperty('QSO_Callsign', 'N0CALL');
    expect(backup.contacts[0]).toHaveProperty('frequency_mhz', 7.074);
  });

  it('preserves POTA QSO data', () => {
    const pota = makePotaQso({ POTAPark_ID: 'K-4567', QSO_Type: '2' });
    const backup = assembleBackup([], [pota], [], 'testuser', 'AE9S');

    expect(backup.potaQsos[0]).toHaveProperty('POTAPark_ID', 'K-4567');
    expect(backup.potaQsos[0]).toHaveProperty('QSO_Type', '2');
  });

  it('preserves contest QSO data', () => {
    const contest = makeContestQso({ CONTEST_QSO_NUMBER: '042', CONTEST_QSO_EXCHANGE_DATA: '5NN OH' });
    const backup = assembleBackup([], [], [contest], 'testuser', 'AE9S');

    expect(backup.contestQsos[0]).toHaveProperty('CONTEST_QSO_NUMBER', '042');
    expect(backup.contestQsos[0]).toHaveProperty('CONTEST_QSO_EXCHANGE_DATA', '5NN OH');
  });
});
