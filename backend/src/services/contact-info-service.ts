import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db/pool.js';
import type { CreateContactInfoInput } from '../schemas/contact-info.schema.js';

export async function getContactInfo(callsign: string): Promise<RowDataPacket[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT * FROM ContactInfo WHERE ContactInfo_Callsign = ?',
    [callsign]
  );
  return rows;
}

export async function contactInfoExists(callsign: string): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM ContactInfo WHERE ContactInfo_Callsign = ?',
    [callsign]
  );
  return rows[0].count > 0;
}

export async function createContactInfo(data: CreateContactInfoInput): Promise<{ skipped: boolean; insertId?: number }> {
  const exists = await contactInfoExists(data.callsign);
  if (exists) {
    return { skipped: true };
  }

  if (data.callsign.length <= 3) {
    return { skipped: true };
  }

  const [result] = await db.execute<ResultSetHeader>(
    'INSERT INTO ContactInfo (ContactInfo_Callsign, ContactInfo_Name, ContactInfo_Street, ContactInfo_City, ContactInfo_usState, ContactInfo_AddressCountry, ContactInfo_Latitude, ContactInfo_Longitude, ContactInfo_ITUZone, ContactInfo_GridSquare, ContactInfo_QTH, ContactInfo_Country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.callsign.toUpperCase(),
      data.name, data.street, data.city, data.state,
      data.addressCountry, data.latitude, data.longitude,
      data.itu, data.grid, data.qth, data.country,
    ]
  );
  return { skipped: false, insertId: result.insertId };
}
