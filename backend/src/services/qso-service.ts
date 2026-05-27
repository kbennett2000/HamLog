import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db/pool.js';
import type { CreateQsoInput } from '../schemas/qso.schema.js';

export async function createContact(input: CreateQsoInput): Promise<number> {
  const formatted = formatDate(input.date) + ' 00:00:00';
  const [result] = await db.execute<ResultSetHeader>(
    'INSERT INTO Contacts (QSO_Date, QSO_MTZTime, QSO_Callsign, QSO_Frequency, QSO_Notes, QSO_Received, QSO_Sent) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [formatted, input.time, input.callsign, input.frequency, input.notes, input.received, input.sent]
  );
  return result.insertId;
}

export async function createPotaQso(qsoId: string, parkId: string, qsoType: string): Promise<number> {
  const [result] = await db.execute<ResultSetHeader>(
    'INSERT INTO POTA_QSOs (QSO_ID, POTAPark_ID, QSO_Type) VALUES (?, ?, ?)',
    [qsoId, parkId, qsoType]
  );
  return result.insertId;
}

export async function createContestQso(qsoId: string, contestId: string, qsoNumber: string, exchangeData: string): Promise<number> {
  const [result] = await db.execute<ResultSetHeader>(
    'INSERT INTO Contest_QSOs (QSO_ID, CONTEST_ID, CONTEST_QSO_NUMBER, CONTEST_QSO_EXCHANGE_DATA) VALUES (?, ?, ?, ?)',
    [qsoId, contestId, qsoNumber, exchangeData]
  );
  return result.insertId;
}

export async function deleteContact(qsoId: string): Promise<void> {
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

export async function getAllQsosWithPota(): Promise<RowDataPacket[]> {
  const [contacts] = await db.execute<RowDataPacket[]>(
    'SELECT * FROM Contacts ORDER BY QSO_Date DESC, QSO_MTZTime DESC'
  );
  const [potaRows] = await db.execute<RowDataPacket[]>(
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

export async function getQsosByCallsign(callsign: string): Promise<RowDataPacket[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT * FROM Contacts WHERE QSO_Callsign = ? ORDER BY QSO_ID DESC',
    [callsign]
  );
  return rows;
}

export async function getQsosByPark(parkId: string): Promise<RowDataPacket[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT POTA_QSOs.*, Contacts.* FROM POTA_QSOs INNER JOIN Contacts ON POTA_QSOs.QSO_ID = Contacts.QSO_ID WHERE POTA_QSOs.POTAPark_ID = ? ORDER BY POTA_QSOs.POTA_QSO_ID DESC',
    [parkId]
  );
  return rows;
}

function formatDate(inputString: string): string {
  const inputDate = new Date(inputString);
  if (isNaN(inputDate.getTime())) {
    throw new Error(`Invalid QSO date: ${inputString}`);
  }
  const year = inputDate.getFullYear();
  const month = String(inputDate.getMonth() + 1).padStart(2, '0');
  const day = String(inputDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
