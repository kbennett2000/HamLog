import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db/pool.js';
import type { CreateQsoInput } from '../schemas/qso.schema.js';

export async function createContact(input: CreateQsoInput, userId: number): Promise<number> {
  const formatted = formatDate(input.date) + ' 00:00:00';
  const timeStr = input.time || '00:00';
  const utcDatetime = toUtcDatetime(input.date, timeStr);
  const freqDecimal = parseFrequency(input.frequency);

  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO Contacts
      (user_id, QSO_Date, QSO_MTZTime, QSO_Callsign, QSO_Frequency, QSO_Notes, QSO_Received, QSO_Sent,
       qso_datetime_utc, frequency_mhz, mode, band)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, formatted, timeStr, input.callsign, input.frequency, input.notes, input.received, input.sent,
     utcDatetime, freqDecimal, input.mode || null, input.band || null]
  );
  return result.insertId;
}

export async function verifyContactOwnership(qsoId: string, userId: number): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT QSO_ID FROM Contacts WHERE QSO_ID = ? AND user_id = ?',
    [qsoId, userId]
  );
  return rows.length > 0;
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

export async function deleteContact(qsoId: string, userId: number): Promise<boolean> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [check] = await conn.execute<RowDataPacket[]>(
      'SELECT QSO_ID FROM Contacts WHERE QSO_ID = ? AND user_id = ?',
      [qsoId, userId]
    );
    if (check.length === 0) {
      await conn.rollback();
      return false;
    }

    await conn.execute('DELETE FROM POTA_QSOs WHERE QSO_ID = ?', [qsoId]);
    await conn.execute('DELETE FROM Contest_QSOs WHERE QSO_ID = ?', [qsoId]);
    await conn.execute('DELETE FROM Contacts WHERE QSO_ID = ? AND user_id = ?', [qsoId, userId]);
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getAllQsosWithPota(userId: number): Promise<RowDataPacket[]> {
  const [contacts] = await db.execute<RowDataPacket[]>(
    'SELECT * FROM Contacts WHERE user_id = ? ORDER BY QSO_Date DESC, QSO_MTZTime DESC',
    [userId]
  );
  const [potaRows] = await db.execute<RowDataPacket[]>(
    `SELECT Contacts.*, POTA_QSOs.* FROM Contacts
     LEFT JOIN POTA_QSOs ON Contacts.QSO_ID = POTA_QSOs.QSO_ID
     WHERE Contacts.user_id = ?`,
    [userId]
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

export async function getQsosByCallsign(callsign: string, userId: number): Promise<RowDataPacket[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT * FROM Contacts WHERE QSO_Callsign = ? AND user_id = ? ORDER BY QSO_ID DESC',
    [callsign, userId]
  );
  return rows;
}

export async function getQsosByPark(parkId: string, userId: number): Promise<RowDataPacket[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT POTA_QSOs.*, Contacts.* FROM POTA_QSOs
     INNER JOIN Contacts ON POTA_QSOs.QSO_ID = Contacts.QSO_ID
     WHERE POTA_QSOs.POTAPark_ID = ? AND Contacts.user_id = ?
     ORDER BY POTA_QSOs.POTA_QSO_ID DESC`,
    [parkId, userId]
  );
  return rows;
}

export async function getQsosForExport(userId: number, parkFilter?: string): Promise<RowDataPacket[]> {
  if (parkFilter) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT c.*, p.POTAPark_ID, p.QSO_Type AS POTA_QSO_Type
       FROM Contacts c
       LEFT JOIN POTA_QSOs p ON c.QSO_ID = p.QSO_ID
       WHERE p.POTAPark_ID = ? AND c.user_id = ?
       ORDER BY c.qso_datetime_utc DESC, c.QSO_Date DESC`,
      [parkFilter, userId]
    );
    return rows;
  }

  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT c.*, p.POTAPark_ID, p.QSO_Type AS POTA_QSO_Type
     FROM Contacts c
     LEFT JOIN POTA_QSOs p ON c.QSO_ID = p.QSO_ID
     WHERE c.user_id = ?
     ORDER BY c.qso_datetime_utc DESC, c.QSO_Date DESC`,
    [userId]
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

function toUtcDatetime(dateStr: string, timeStr: string): string {
  const date = formatDate(dateStr);
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${date} ${time}`;
}

function parseFrequency(freq: string): number | null {
  if (!freq) return null;
  const dotCount = (freq.match(/\./g) || []).length;
  const cleaned = dotCount >= 2
    ? freq.substring(0, freq.indexOf('.', freq.indexOf('.') + 1))
    : freq;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}
