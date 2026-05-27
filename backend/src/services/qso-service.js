import { db } from '../db/pool.js';

export async function createContact({ date, time, callsign, frequency, notes, received, sent }) {
  const formatted = formatDate(date) + ' 00:00:00';
  const [result] = await db.execute(
    'INSERT INTO Contacts (QSO_Date, QSO_MTZTime, QSO_Callsign, QSO_Frequency, QSO_Notes, QSO_Received, QSO_Sent) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [formatted, time, callsign, frequency, notes, received, sent]
  );
  return result.insertId;
}

export async function createPotaQso(qsoId, parkId, qsoType) {
  const [result] = await db.execute(
    'INSERT INTO POTA_QSOs (QSO_ID, POTAPark_ID, QSO_Type) VALUES (?, ?, ?)',
    [qsoId, parkId, qsoType]
  );
  return result.insertId;
}

export async function createContestQso(qsoId, contestId, qsoNumber, exchangeData) {
  const [result] = await db.execute(
    'INSERT INTO Contest_QSOs (QSO_ID, CONTEST_ID, CONTEST_QSO_NUMBER, CONTEST_QSO_EXCHANGE_DATA) VALUES (?, ?, ?, ?)',
    [qsoId, contestId, qsoNumber, exchangeData]
  );
  return result.insertId;
}

export async function deleteContact(qsoId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM POTA_QSOs WHERE QSO_ID = ?', [qsoId]);
    await conn.execute('DELETE FROM Contest_QSOs WHERE QSO_ID = ?', [qsoId]);
    await conn.execute('DELETE FROM Contacts WHERE QSO_ID = ?', [qsoId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getAllQsosWithPota() {
  const [contacts] = await db.execute(
    'SELECT * FROM Contacts ORDER BY QSO_Date DESC, QSO_MTZTime DESC'
  );
  const [potaRows] = await db.execute(
    'SELECT Contacts.*, POTA_QSOs.* FROM Contacts LEFT JOIN POTA_QSOs ON Contacts.QSO_ID = POTA_QSOs.QSO_ID'
  );

  return contacts.map(contact => {
    const relatedPota = potaRows
      .filter(row => row.QSO_ID === contact.QSO_ID)
      .map(({ POTA_QSO_ID, QSO_ID, POTAPark_ID, QSO_Type }) => ({
        POTA_QSO_ID, QSO_ID, POTAPark_ID, QSO_Type,
      }));
    return { ...contact, POTA_QSOs: relatedPota };
  });
}

export async function getQsosByCallsign(callsign) {
  const [rows] = await db.execute(
    'SELECT * FROM Contacts WHERE QSO_Callsign = ? ORDER BY QSO_ID DESC',
    [callsign]
  );
  return rows;
}

export async function getQsosByPark(parkId) {
  const [rows] = await db.execute(
    'SELECT POTA_QSOs.*, Contacts.* FROM POTA_QSOs INNER JOIN Contacts ON POTA_QSOs.QSO_ID = Contacts.QSO_ID WHERE POTA_QSOs.POTAPark_ID = ? ORDER BY POTA_QSOs.POTA_QSO_ID DESC',
    [parkId]
  );
  return rows;
}

function formatDate(inputString) {
  const inputDate = new Date(inputString);
  if (isNaN(inputDate)) {
    throw new Error(`Invalid QSO date: ${inputString}`);
  }
  const year = inputDate.getFullYear();
  const month = String(inputDate.getMonth() + 1).padStart(2, '0');
  const day = String(inputDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
