import { db } from '../db/pool.js';

export async function getContactInfo(callsign) {
  const [rows] = await db.execute(
    'SELECT * FROM ContactInfo WHERE ContactInfo_Callsign = ?',
    [callsign]
  );
  return rows;
}

export async function contactInfoExists(callsign) {
  const [rows] = await db.execute(
    'SELECT COUNT(*) as count FROM ContactInfo WHERE ContactInfo_Callsign = ?',
    [callsign]
  );
  return rows[0].count > 0;
}

export async function createContactInfo(data) {
  const exists = await contactInfoExists(data.callsign);
  if (exists) {
    return { skipped: true };
  }

  if (data.callsign.length <= 3) {
    return { skipped: true };
  }

  const [result] = await db.execute(
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
