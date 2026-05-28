import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../db/pool.js';
import type { CreateContactInfoInput } from '../schemas/contact-info.schema.js';
import { lookupCallsign } from './hamdb-service.js';
import logger from '../logger.js';

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

export async function lookupAndCreateContactInfo(callsign: string): Promise<boolean> {
  const upper = callsign.toUpperCase();
  if (upper.length <= 3) return false;

  const exists = await contactInfoExists(upper);
  if (exists) return false;

  const result = await lookupCallsign(upper);
  if (!result) {
    await createContactInfo({
      callsign: upper, name: '', street: '', city: '', state: '',
      addressCountry: '', latitude: '', longitude: '', itu: '', grid: '', qth: '', country: '',
    });
    return false;
  }

  await createContactInfo({
    callsign: upper,
    name: result.name,
    street: result.addr1,
    city: result.city,
    state: result.state,
    addressCountry: result.country,
    latitude: result.lat,
    longitude: result.lon,
    itu: '',
    grid: result.grid,
    qth: '',
    country: result.country,
  });

  logger.info({ callsign: upper }, 'ContactInfo populated from HamDB');
  return true;
}

export async function updateContactInfoFromHamDB(callsign: string): Promise<boolean> {
  const upper = callsign.toUpperCase();
  const result = await lookupCallsign(upper);
  if (!result || (!result.lat && !result.lon)) return false;

  await db.execute(
    `UPDATE ContactInfo SET
      ContactInfo_Name = ?, ContactInfo_City = ?, ContactInfo_usState = ?,
      ContactInfo_AddressCountry = ?, ContactInfo_Latitude = ?,
      ContactInfo_Longitude = ?, ContactInfo_GridSquare = ?, ContactInfo_Country = ?
     WHERE ContactInfo_Callsign = ?`,
    [result.name, result.city, result.state, result.country, result.lat, result.lon, result.grid, result.country, upper]
  );
  return true;
}

export async function getCallsignsNeedingBackfill(): Promise<string[]> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT ContactInfo_Callsign FROM ContactInfo
     WHERE ContactInfo_Latitude = '' OR ContactInfo_Latitude IS NULL`
  );
  return rows.map(r => r.ContactInfo_Callsign);
}
