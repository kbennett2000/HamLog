import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

/**
 * Characterization tests — pin the current API behavior so Phase 1
 * restructuring can't silently break anything. These tests intentionally
 * use the existing (broken) GET-for-writes interface.
 *
 * Requires: MySQL running (docker compose up -d) with the HamLogDB schema.
 * Skips gracefully if the database is unreachable.
 */

let server;
let baseUrl;
let pool;
let dbAvailable = false;

function get(path) {
  return fetch(`${baseUrl}${path}`);
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  const mod = await import('../index.js');
  const app = mod.app;
  pool = mod.dbHamLog.promise();

  // Check DB connectivity before running tests
  try {
    await pool.execute('SELECT 1');
    dbAvailable = true;
  } catch {
    console.warn('MySQL not reachable — skipping characterization tests. Run: docker compose up -d');
    return;
  }

  await new Promise((resolve, reject) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
    server.on('error', reject);
  });
});

afterAll(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  if (pool) {
    try { await pool.end(); } catch { /* already closed */ }
  }
});

function skipIfNoDb() {
  if (!dbAvailable) {
    return true;
  }
  return false;
}

describe('Characterization: read endpoints', () => {
  it('GET /getContactsAndPOTAQSOs returns 200 with an array', async () => {
    if (skipIfNoDb()) return;
    const res = await get('/getContactsAndPOTAQSOs');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /Get_Contacts_for_Callsign returns 200 with Contacts key', async () => {
    if (skipIfNoDb()) return;
    const res = await get('/Get_Contacts_for_Callsign?QSO_Callsign=TESTCALL');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
    expect(Array.isArray(body.Contacts)).toBe(true);
  });

  it('GET /Get_Contacts_for_ParkNumber returns 200 with Contacts key', async () => {
    if (skipIfNoDb()) return;
    const res = await get('/Get_Contacts_for_ParkNumber?ParkNumber=K-0000');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
    expect(Array.isArray(body.Contacts)).toBe(true);
  });

  it('GET /Last_Insert_ID returns 200 with LastInsertID key', async () => {
    if (skipIfNoDb()) return;
    const res = await get('/Last_Insert_ID');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('LastInsertID');
    expect(Array.isArray(body.LastInsertID)).toBe(true);
  });

  it('GET /Get_Callsign_Info returns 200 with Contacts key', async () => {
    if (skipIfNoDb()) return;
    const res = await get('/Get_Callsign_Info?Callsign=TESTCALL');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
  });

  it('GET /Get_ContactInfo_Count returns 200 with count', async () => {
    if (skipIfNoDb()) return;
    const res = await get('/Get_ContactInfo_Count?callsignToLookup=TESTCALL');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
    expect(body.Contacts[0]).toHaveProperty('count');
  });
});

describe('Characterization: write endpoints (create + delete lifecycle)', () => {
  let createdQsoId;

  it('GET /Create_Contacts creates a contact and returns 200', async () => {
    if (skipIfNoDb()) return;
    const params = new URLSearchParams({
      QSO_Date: '01/01/2025',
      QSO_MTZTime: '12:00',
      QSO_Callsign: 'TEST0CHR',
      QSO_Frequency: '14.074',
      QSO_Notes: 'characterization test',
      QSO_Received: '599',
      QSO_Sent: '599',
    });
    const res = await get(`/Create_Contacts?${params}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
    expect(body.Contacts).toHaveProperty('insertId');
    createdQsoId = body.Contacts.insertId;
    expect(typeof createdQsoId).toBe('number');
    expect(createdQsoId).toBeGreaterThan(0);
  });

  it('GET /Create_POTA_QSOs creates a POTA QSO and returns 200', async () => {
    if (skipIfNoDb() || !createdQsoId) return;
    const params = new URLSearchParams({
      QSO_ID: String(createdQsoId),
      POTAPark_ID: 'K-0000',
      QSO_Type: '1',
    });
    const res = await get(`/Create_POTA_QSOs?${params}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('POTA_QSOs');
  });

  it('GET /Create_Contest_QSOs creates a Contest QSO and returns 200', async () => {
    if (skipIfNoDb() || !createdQsoId) return;
    // Need a Contest record first for the FK
    await pool.execute(
      "INSERT IGNORE INTO Contests (CONTEST_ID, CONTEST_NAME) VALUES (1, 'Test Contest')"
    );
    const params = new URLSearchParams({
      QSO_ID: String(createdQsoId),
      Contest_ID: '1',
      Contest_QSO_Number: '001',
      Contest_QSO_Exchange_Data: 'CO',
    });
    const res = await get(`/Create_Contest_QSOs?${params}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    // index.js returns { POTA_QSOs: rows } here due to a copy-paste bug — pinning intentionally
    expect(body).toHaveProperty('POTA_QSOs');
  });

  it('GET /Delete_Contacts deletes the contact and related records', async () => {
    if (skipIfNoDb() || !createdQsoId) return;
    const res = await get(`/Delete_Contacts?QSO_ID=${createdQsoId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');

    // Verify the contact is gone
    const verifyRes = await get('/Get_Contacts_for_Callsign?QSO_Callsign=TEST0CHR');
    const verifyBody = await verifyRes.json();
    const remaining = verifyBody.Contacts.filter(c => c.QSO_ID === createdQsoId);
    expect(remaining).toHaveLength(0);
  });
});

describe('Characterization: ContactInfo lifecycle', () => {
  it('GET /Create_ContactInfo inserts when callsign is new', async () => {
    if (skipIfNoDb()) return;
    // Clean up first in case a previous test run left data
    await pool.execute('DELETE FROM ContactInfo WHERE ContactInfo_Callsign = ?', ['TEST0CHR']);

    const params = new URLSearchParams({
      callsignToLookup: 'TEST0CHR',
      adrName: 'Test User',
      adrStreet1: '123 Test St',
      adrCity: 'Denver',
      us_state: 'CO',
      adrCountry: 'US',
      latitude: '39.7392',
      longitude: '-104.9903',
      itu: '7',
      grid: 'DM79',
      qth: 'Denver',
      country: 'United States',
    });
    const res = await get(`/Create_ContactInfo?${params}`);
    expect(res.status).toBe(200);
  });

  it('GET /Get_ContactInfo_Count shows count > 0 after insert', async () => {
    if (skipIfNoDb()) return;
    const res = await get('/Get_ContactInfo_Count?callsignToLookup=TEST0CHR');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Number(body.Contacts[0].count)).toBeGreaterThan(0);
  });

  it('GET /Create_ContactInfo skips when callsign already exists', async () => {
    if (skipIfNoDb()) return;
    const params = new URLSearchParams({
      callsignToLookup: 'TEST0CHR',
      adrName: 'Duplicate',
      adrStreet1: '',
      adrCity: '',
      us_state: '',
      adrCountry: '',
      latitude: '',
      longitude: '',
      itu: '',
      grid: '',
      qth: '',
      country: '',
    });
    const res = await get(`/Create_ContactInfo?${params}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).not.toHaveProperty('Contacts');
  });

  afterAll(async () => {
    if (dbAvailable && pool) {
      await pool.execute('DELETE FROM ContactInfo WHERE ContactInfo_Callsign = ?', ['TEST0CHR']);
    }
  });
});
