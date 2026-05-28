import { RowDataPacket } from 'mysql2';
import { db } from '../db/pool.js';

export interface ContactRow {
  QSO_ID: number;
  QSO_Date: string | null;
  QSO_MTZTime: string | null;
  QSO_Callsign: string | null;
  QSO_Frequency: string | null;
  QSO_Notes: string | null;
  QSO_Received: string | null;
  QSO_Sent: string | null;
  qso_datetime_utc: string | null;
  frequency_mhz: number | null;
  mode: string | null;
  band: string | null;
}

export interface PotaQsoRow {
  POTA_QSO_ID: number;
  QSO_ID: number;
  POTAPark_ID: string | null;
  QSO_Type: string | null;
}

export interface ContestQsoRow {
  CONTEST_QSO_ID: number;
  QSO_ID: number;
  CONTEST_ID: number | null;
  CONTEST_QSO_NUMBER: string | null;
  CONTEST_QSO_EXCHANGE_DATA: string | null;
}

export interface HamLogBackup {
  meta: {
    version: string;
    exportedAt: string;
    generator: string;
    username: string;
    callsign: string;
    note: string;
  };
  contacts: ContactRow[];
  potaQsos: PotaQsoRow[];
  contestQsos: ContestQsoRow[];
}

export function assembleBackup(
  contacts: RowDataPacket[],
  potaQsos: RowDataPacket[],
  contestQsos: RowDataPacket[],
  username: string,
  callsign: string,
): HamLogBackup {
  return {
    meta: {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      generator: 'HamLog',
      username,
      callsign,
      note: 'QSO_ID values are internal references. POTA and contest records reference contacts by QSO_ID within this backup.',
    },
    contacts: contacts.map(row => ({ ...row }) as ContactRow),
    potaQsos: potaQsos.map(row => ({ ...row }) as PotaQsoRow),
    contestQsos: contestQsos.map(row => ({ ...row }) as ContestQsoRow),
  };
}

export async function buildJsonBackup(
  userId: number,
  username: string,
  callsign: string,
): Promise<HamLogBackup> {
  const [contacts] = await db.execute<RowDataPacket[]>(
    `SELECT QSO_ID, QSO_Date, QSO_MTZTime, QSO_Callsign, QSO_Frequency,
            QSO_Notes, QSO_Received, QSO_Sent, qso_datetime_utc,
            frequency_mhz, mode, band
     FROM Contacts WHERE user_id = ? ORDER BY qso_datetime_utc DESC`,
    [userId],
  );

  const [potaQsos] = await db.execute<RowDataPacket[]>(
    `SELECT p.POTA_QSO_ID, p.QSO_ID, p.POTAPark_ID, p.QSO_Type
     FROM POTA_QSOs p
     INNER JOIN Contacts c ON p.QSO_ID = c.QSO_ID
     WHERE c.user_id = ?`,
    [userId],
  );

  const [contestQsos] = await db.execute<RowDataPacket[]>(
    `SELECT cq.CONTEST_QSO_ID, cq.QSO_ID, cq.CONTEST_ID,
            cq.CONTEST_QSO_NUMBER, cq.CONTEST_QSO_EXCHANGE_DATA
     FROM Contest_QSOs cq
     INNER JOIN Contacts c ON cq.QSO_ID = c.QSO_ID
     WHERE c.user_id = ?`,
    [userId],
  );

  return assembleBackup(contacts, potaQsos, contestQsos, username, callsign);
}
