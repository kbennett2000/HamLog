import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

/**
 * Characterization tests for the REST API (Phase 1).
 * Tests proper HTTP methods, parameterized queries, auth, and transactions.
 *
 * Requires: MySQL running (docker compose up -d).
 * Skips gracefully if the database is unreachable.
 */

let server;
let baseUrl;
let dbPool;
let dbAvailable = false;

const API_KEY = 'hamlog-dev-key';
const authHeaders = { Authorization: `Bearer ${API_KEY}` };

function api(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

function post(path, body) {
  return api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(body),
  });
}

function del(path) {
  return api(path, { method: 'DELETE', headers: authHeaders });
}

beforeAll(async () => {
  // Load .env before anything else
  const dotenv = await import('dotenv');
  dotenv.config();

  process.env.NODE_ENV = 'test';
  process.env.API_KEY = API_KEY;
  process.env.CORS_ORIGIN = '*';

  const { default: pool } = await import('../src/db/pool.js');
  dbPool = pool.promise();

  try {
    await dbPool.execute('SELECT 1');
    dbAvailable = true;
  } catch {
    console.warn('MySQL not reachable — skipping tests. Run: docker compose up -d');
    return;
  }

  const { default: app } = await import('../src/app.js');
  await new Promise((resolve, reject) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
    server.on('error', reject);
  });
});

afterAll(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (dbPool) {
    try { await dbPool.end(); } catch { /* already closed */ }
  }
});

function skipIfNoDb() {
  return !dbAvailable;
}

describe('Read endpoints', () => {
  it('GET /api/qsos returns 200 with an array', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/qsos');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /api/qsos?callsign= returns filtered results', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/qsos?callsign=NONEXISTENT');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
    expect(Array.isArray(body.Contacts)).toBe(true);
  });

  it('GET /api/qsos?park= returns filtered results', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/qsos?park=K-0000');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
  });

  it('GET /api/contact-info/:callsign returns contact info', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/contact-info/NONEXISTENT');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
  });

  it('GET /api/contact-info/:callsign/exists returns exists flag', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/contact-info/NONEXISTENT/exists');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('exists');
    expect(body).toHaveProperty('count');
  });
});

describe('Auth enforcement', () => {
  it('POST /api/qsos without API key returns 401', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/qsos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callsign: 'TEST', frequency: '14.074' }),
    });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/qsos/999999 without API key returns 401', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/qsos/999999', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });

  it('GET /api/qsos without API key returns 200 (reads are public)', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/qsos');
    expect(res.status).toBe(200);
  });
});

describe('Write lifecycle (create + delete)', () => {
  let createdId;

  it('POST /api/qsos creates a contact and returns insertId', async () => {
    if (skipIfNoDb()) return;
    const res = await post('/qsos', {
      date: '01/01/2025',
      time: '12:00',
      callsign: 'TEST0PH1',
      frequency: '14.074',
      notes: 'phase 1 characterization test',
      received: '599',
      sent: '599',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(typeof body.id).toBe('number');
    createdId = body.id;
  });

  it('POST /api/qsos/:id/pota creates a POTA record', async () => {
    if (skipIfNoDb() || !createdId) return;
    const res = await post(`/qsos/${createdId}/pota`, {
      parkId: 'K-0000',
      qsoType: '1',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
  });

  it('POST /api/qsos/:id/contest creates a Contest record', async () => {
    if (skipIfNoDb() || !createdId) return;
    await dbPool.execute(
      "INSERT IGNORE INTO Contests (CONTEST_ID, CONTEST_NAME) VALUES (1, 'Test Contest')"
    );
    const res = await post(`/qsos/${createdId}/contest`, {
      contestId: '1',
      qsoNumber: '001',
      exchangeData: 'CO',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
  });

  it('DELETE /api/qsos/:id deletes contact and related records (transactional)', async () => {
    if (skipIfNoDb() || !createdId) return;
    const res = await del(`/qsos/${createdId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ deleted: true });

    // Verify contact is gone
    const verifyRes = await api('/qsos?callsign=TEST0PH1');
    const verifyBody = await verifyRes.json();
    const remaining = verifyBody.Contacts.filter(c => c.QSO_ID === createdId);
    expect(remaining).toHaveLength(0);

    // Verify POTA records are gone
    const [potaRows] = await dbPool.execute('SELECT * FROM POTA_QSOs WHERE QSO_ID = ?', [createdId]);
    expect(potaRows).toHaveLength(0);

    // Verify Contest records are gone
    const [contestRows] = await dbPool.execute('SELECT * FROM Contest_QSOs WHERE QSO_ID = ?', [createdId]);
    expect(contestRows).toHaveLength(0);
  });

  it('POST /api/qsos returns 400 if callsign is missing', async () => {
    if (skipIfNoDb()) return;
    const res = await post('/qsos', { frequency: '14.074' });
    expect(res.status).toBe(400);
  });
});

describe('SQL injection prevention', () => {
  it('callsign with SQL injection is safely handled', async () => {
    if (skipIfNoDb()) return;
    const res = await post('/qsos', {
      date: '01/01/2025',
      time: '12:00',
      callsign: "';DROP T--",
      frequency: '14.074',
      notes: '',
      received: '',
      sent: '',
    });
    expect(res.status).toBe(201);
    const id = (await res.json()).id;

    // Verify the Contacts table still exists and the malicious callsign was stored literally
    const [rows] = await dbPool.execute('SELECT * FROM Contacts WHERE QSO_ID = ?', [id]);
    expect(rows[0].QSO_Callsign).toBe("';DROP T--");

    // Cleanup
    await del(`/qsos/${id}`);
  });
});

describe('ContactInfo lifecycle', () => {
  it('POST /api/contact-info creates a record for a new callsign', async () => {
    if (skipIfNoDb()) return;
    await dbPool.execute('DELETE FROM ContactInfo WHERE ContactInfo_Callsign = ?', ['TEST0PH1']);

    const res = await post('/contact-info', {
      callsign: 'TEST0PH1',
      name: 'Test User',
      street: '123 Test St',
      city: 'Denver',
      state: 'CO',
      addressCountry: 'US',
      latitude: '39.7392',
      longitude: '-104.9903',
      itu: '7',
      grid: 'DM79',
      qth: 'Denver',
      country: 'United States',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
  });

  it('GET /api/contact-info/:callsign/exists returns true after insert', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/contact-info/TEST0PH1/exists');
    const body = await res.json();
    expect(body.exists).toBe(true);
  });

  it('POST /api/contact-info skips when callsign already exists', async () => {
    if (skipIfNoDb()) return;
    const res = await post('/contact-info', {
      callsign: 'TEST0PH1',
      name: 'Duplicate',
      street: '', city: '', state: '',
      addressCountry: '', latitude: '', longitude: '',
      itu: '', grid: '', qth: '', country: '',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ skipped: true });
  });

  afterAll(async () => {
    if (dbAvailable && dbPool) {
      await dbPool.execute('DELETE FROM ContactInfo WHERE ContactInfo_Callsign = ?', ['TEST0PH1']);
    }
  });
});
