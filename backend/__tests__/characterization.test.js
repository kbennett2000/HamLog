import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

/**
 * Characterization tests for the REST API.
 * Tests JWT auth, user-scoped data, parameterized queries, and transactions.
 *
 * Requires: MySQL running (docker compose up -d) with migrations applied.
 * Skips gracefully if the database is unreachable.
 */

let server;
let baseUrl;
let dbPool;
let dbAvailable = false;

let authToken;
let testUserId;

function api(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

function authApi(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${authToken}`,
    },
  });
}

function post(path, body) {
  return authApi(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function del(path) {
  return authApi(path, { method: 'DELETE' });
}

beforeAll(async () => {
  const dotenv = await import('dotenv');
  dotenv.config();

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-for-characterization-tests';
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

  // Run migrations
  const { runMigrations } = await import('../src/migrations/migrate.js');
  await runMigrations();

  const { default: app } = await import('../src/app.js');
  await new Promise((resolve, reject) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
    server.on('error', reject);
  });

  // Clean up any prior test user (delete child records first)
  await dbPool.execute('DELETE FROM Contest_QSOs WHERE QSO_ID IN (SELECT QSO_ID FROM Contacts WHERE user_id IN (SELECT id FROM Users WHERE username = ?))', ['testuser_char']);
  await dbPool.execute('DELETE FROM POTA_QSOs WHERE QSO_ID IN (SELECT QSO_ID FROM Contacts WHERE user_id IN (SELECT id FROM Users WHERE username = ?))', ['testuser_char']);
  await dbPool.execute('DELETE FROM Contacts WHERE user_id IN (SELECT id FROM Users WHERE username = ?)', ['testuser_char']);
  await dbPool.execute('DELETE FROM Users WHERE username = ?', ['testuser_char']);

  // Register a test user
  const regRes = await api('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser_char', password: 'testpass123', callsign: 'T0CHAR' }),
  });
  const regBody = await regRes.json();
  authToken = regBody.token;
  testUserId = regBody.user.id;
});

afterAll(async () => {
  if (dbAvailable && dbPool && testUserId) {
    await dbPool.execute('DELETE FROM Contest_QSOs WHERE QSO_ID IN (SELECT QSO_ID FROM Contacts WHERE user_id = ?)', [testUserId]);
    await dbPool.execute('DELETE FROM POTA_QSOs WHERE QSO_ID IN (SELECT QSO_ID FROM Contacts WHERE user_id = ?)', [testUserId]);
    await dbPool.execute('DELETE FROM Contacts WHERE user_id = ?', [testUserId]);
    await dbPool.execute('DELETE FROM Users WHERE id = ?', [testUserId]);
  }
  if (server) await new Promise(resolve => server.close(resolve));
  if (dbPool) {
    try { await dbPool.end(); } catch { /* already closed */ }
  }
});

function skipIfNoDb() {
  return !dbAvailable;
}

describe('Auth endpoints', () => {
  it('POST /api/auth/register returns 409 for duplicate username', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser_char', password: 'testpass123', callsign: 'T0DUP' }),
    });
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/login returns token for valid credentials', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser_char', password: 'testpass123' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('token');
    expect(body.user.username).toBe('testuser_char');
  });

  it('POST /api/auth/login returns 401 for wrong password', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser_char', password: 'wrongpass' }),
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me returns user profile with valid token', async () => {
    if (skipIfNoDb()) return;
    const res = await authApi('/auth/me');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe('testuser_char');
    expect(body.callsign).toBe('T0CHAR');
  });
});

describe('Auth enforcement', () => {
  it('GET /api/qsos without token returns 401', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/qsos');
    expect(res.status).toBe(401);
  });

  it('POST /api/qsos without token returns 401', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/qsos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callsign: 'TEST', frequency: '14.074' }),
    });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/qsos/999999 without token returns 401', async () => {
    if (skipIfNoDb()) return;
    const res = await api('/qsos/999999', { method: 'DELETE' });
    expect(res.status).toBe(401);
  });
});

describe('Read endpoints (authenticated)', () => {
  it('GET /api/qsos returns 200 with an array', async () => {
    if (skipIfNoDb()) return;
    const res = await authApi('/qsos');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /api/qsos?callsign= returns filtered results', async () => {
    if (skipIfNoDb()) return;
    const res = await authApi('/qsos?callsign=NONEXISTENT');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
    expect(Array.isArray(body.Contacts)).toBe(true);
  });

  it('GET /api/qsos?park= returns filtered results', async () => {
    if (skipIfNoDb()) return;
    const res = await authApi('/qsos?park=K-0000');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
  });

  it('GET /api/contact-info/:callsign returns contact info', async () => {
    if (skipIfNoDb()) return;
    const res = await authApi('/contact-info/NONEXISTENT');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('Contacts');
  });

  it('GET /api/contact-info/:callsign/exists returns exists flag', async () => {
    if (skipIfNoDb()) return;
    const res = await authApi('/contact-info/NONEXISTENT/exists');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('exists');
    expect(body).toHaveProperty('count');
  });
});

describe('Write lifecycle (create + delete)', () => {
  let createdId;

  it('POST /api/qsos creates a contact and returns insertId', async () => {
    if (skipIfNoDb()) return;
    const res = await post('/qsos', {
      date: '01/01/2025',
      time: '12:00',
      callsign: 'TEST0CHR',
      frequency: '14.074',
      notes: 'characterization test',
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

    const verifyRes = await authApi('/qsos?callsign=TEST0CHR');
    const verifyBody = await verifyRes.json();
    const remaining = verifyBody.Contacts.filter(c => c.QSO_ID === createdId);
    expect(remaining).toHaveLength(0);

    const [potaRows] = await dbPool.execute('SELECT * FROM POTA_QSOs WHERE QSO_ID = ?', [createdId]);
    expect(potaRows).toHaveLength(0);

    const [contestRows] = await dbPool.execute('SELECT * FROM Contest_QSOs WHERE QSO_ID = ?', [createdId]);
    expect(contestRows).toHaveLength(0);
  });

  it('POST /api/qsos returns 400 if callsign is missing', async () => {
    if (skipIfNoDb()) return;
    const res = await post('/qsos', { frequency: '14.074' });
    expect(res.status).toBe(400);
  });
});

describe('Multi-user data isolation', () => {
  let user2Token;
  let user2Id;
  let user1QsoId;

  beforeAll(async () => {
    if (!dbAvailable) return;

    // Clean up any prior user2 (delete child records first)
    await dbPool.execute('DELETE FROM Contest_QSOs WHERE QSO_ID IN (SELECT QSO_ID FROM Contacts WHERE user_id IN (SELECT id FROM Users WHERE username = ?))', ['testuser_char2']);
    await dbPool.execute('DELETE FROM POTA_QSOs WHERE QSO_ID IN (SELECT QSO_ID FROM Contacts WHERE user_id IN (SELECT id FROM Users WHERE username = ?))', ['testuser_char2']);
    await dbPool.execute('DELETE FROM Contacts WHERE user_id IN (SELECT id FROM Users WHERE username = ?)', ['testuser_char2']);
    await dbPool.execute('DELETE FROM Users WHERE username = ?', ['testuser_char2']);

    // Create user 2
    const res = await api('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser_char2', password: 'testpass123', callsign: 'T0CHR2' }),
    });
    const body = await res.json();
    user2Token = body.token;
    user2Id = body.user.id;

    // Create a QSO as user 1
    const qsoRes = await post('/qsos', {
      date: '01/01/2025',
      time: '12:00',
      callsign: 'ISOLATED',
      frequency: '14.074',
      notes: 'isolation test',
      received: '599',
      sent: '599',
    });
    user1QsoId = (await qsoRes.json()).id;
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    if (user1QsoId) await del(`/qsos/${user1QsoId}`);
    if (user2Id) {
      await dbPool.execute('DELETE FROM Contest_QSOs WHERE QSO_ID IN (SELECT QSO_ID FROM Contacts WHERE user_id = ?)', [user2Id]);
      await dbPool.execute('DELETE FROM POTA_QSOs WHERE QSO_ID IN (SELECT QSO_ID FROM Contacts WHERE user_id = ?)', [user2Id]);
      await dbPool.execute('DELETE FROM Contacts WHERE user_id = ?', [user2Id]);
      await dbPool.execute('DELETE FROM Users WHERE id = ?', [user2Id]);
    }
  });

  it('user 2 cannot see user 1 QSOs', async () => {
    if (skipIfNoDb()) return;
    const res = await fetch(`${baseUrl}/qsos`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const body = await res.json();
    const found = body.find(q => q.QSO_ID === user1QsoId);
    expect(found).toBeUndefined();
  });

  it('user 2 cannot delete user 1 QSO', async () => {
    if (skipIfNoDb()) return;
    const res = await fetch(`${baseUrl}/qsos/${user1QsoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    expect(res.status).toBe(404);
  });

  it('user 2 cannot link POTA to user 1 QSO', async () => {
    if (skipIfNoDb()) return;
    const res = await fetch(`${baseUrl}/qsos/${user1QsoId}/pota`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ parkId: 'K-0000', qsoType: '1' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('SQL injection prevention', () => {
  // Probe a free-form field (notes) rather than callsign: callsign now has light
  // format validation (Data-quality F9) and would 400 an injection-shaped value, so
  // notes is the right field to prove parameterization stores hostile input verbatim.
  it('injection string in a free-form field is safely handled', async () => {
    if (skipIfNoDb()) return;
    const injection = "';DROP TABLE Contacts;--";
    const res = await post('/qsos', {
      date: '01/01/2025',
      time: '12:00',
      callsign: 'W1SQL',
      frequency: '14.074',
      notes: injection,
      received: '',
      sent: '',
    });
    expect(res.status).toBe(201);
    const id = (await res.json()).id;

    const [rows] = await dbPool.execute('SELECT * FROM Contacts WHERE QSO_ID = ?', [id]);
    expect(rows[0].QSO_Notes).toBe(injection);

    await del(`/qsos/${id}`);
  });
});

describe('ContactInfo lifecycle', () => {
  it('POST /api/contact-info creates a record for a new callsign', async () => {
    if (skipIfNoDb()) return;
    await dbPool.execute('DELETE FROM ContactInfo WHERE ContactInfo_Callsign = ?', ['T0CHRCI']);

    const res = await post('/contact-info', {
      callsign: 'T0CHRCI',
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
    const res = await authApi('/contact-info/T0CHRCI/exists');
    const body = await res.json();
    expect(body.exists).toBe(true);
  });

  it('POST /api/contact-info skips when callsign already exists', async () => {
    if (skipIfNoDb()) return;
    const res = await post('/contact-info', {
      callsign: 'T0CHRCI',
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
      await dbPool.execute('DELETE FROM ContactInfo WHERE ContactInfo_Callsign = ?', ['T0CHRCI']);
    }
  });
});
