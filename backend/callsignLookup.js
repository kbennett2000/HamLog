import { parseStringPromise } from 'xml2js';
import mysql from 'mysql2/promise';

const username = 'userName';
const password = 'urlEncodedPassword';

const callsignsToLookup = [ 'XXX', 'YYY', 'ZZZ' ];

const dbConfig = {
  host: '192.168.1.85',
  user: 'testUser',
  password: 'password1',
  database: 'HamLogDB'
};

async function loginAndGetCallsignInfo() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    const loginUrl = `https://www.hamqth.com/xml.php?u=${username}&p=${password}`;
    const loginResponse = await fetch(loginUrl);
    const loginData = await loginResponse.text();

    // Parse the XML response to get the session ID
    const loginDataParsed = await parseStringPromise(loginData);
    const sessionId = loginDataParsed?.HamQTH?.session?.[0]?.session_id?.[0];

    if (!sessionId) {
      console.log('No session ID found. Check login credentials.');
      return;
    }


    for (const callsignToLookup of callsignsToLookup) {
      const lookupUrl = `https://www.hamqth.com/xml.php?id=${sessionId}&callsign=${callsignToLookup}&prg=your_program_name`;
      const lookupResponse = await fetch(lookupUrl);
      const lookupData = await lookupResponse.text();
  
      // Parse the XML response for the callsign lookup
      const lookupDataParsed = await parseStringPromise(lookupData);
      const callsignInfo = lookupDataParsed?.HamQTH?.search?.[0];
  
      // Extracting specific details from the callsign lookup response
      
      const qth = callsignInfo?.qth?.[0] || "unknown";
      const country = callsignInfo?.country?.[0] || "unknown";
      const itu = callsignInfo?.itu?.[0] || "unknown";
      const grid = callsignInfo?.grid?.[0] || "unknown";
      const adrName = callsignInfo?.adr_name?.[0] || "unknown";
      const adrStreet1 = callsignInfo?.adr_street1?.[0] || "unknown";
      const adrCity = callsignInfo?.adr_city?.[0] || "unknown";
      const adrCountry = callsignInfo?.adr_country?.[0] || "unknown";
      const latitude = callsignInfo?.latitude?.[0] || "";
      const longitude = callsignInfo?.longitude?.[0] || "";
      const us_state = callsignInfo?.us_state?.[0] || "";
  
      /*
      console.log('Callsign: ', callsignToLookup);
      console.log('Address Name:', adrName);
      console.log('Address Street:', adrStreet1);
      console.log('City:', adrCity);
      console.log('Address Country:', adrCountry);
      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);
      console.log('ITU Zone:', itu);
      console.log('Grid Square:', grid);
      console.log('QTH:', qth);
      console.log('Country:', country);
      */

      // Check if the callsign is already in the database
      const checkSql = `SELECT COUNT(*) AS count FROM ContactInfo WHERE ContactInfo_Callsign = ?`;
      const [checkResults] = await connection.execute(checkSql, [callsignToLookup]);
  
      if (checkResults[0].count > 0) {
        console.log(`Callsign ${callsignToLookup} already exists in the database.`);
        //return; // Exit the function if the callsign exists
      } else {
        // Assuming auto_increment is enabled for ContactInfo_ID, it's omitted from the INSERT statement
        const insertSql = `
          INSERT INTO ContactInfo (ContactInfo_Callsign, ContactInfo_Name, ContactInfo_Street, ContactInfo_City, ContactInfo_usState, ContactInfo_AddressCountry, ContactInfo_Latitude, ContactInfo_Longitude, ContactInfo_ITUZone, ContactInfo_GridSquare, ContactInfo_QTH, ContactInfo_Country)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertValues = [
          callsignToLookup.toUpperCase(),
          adrName,
          adrStreet1,
          adrCity,
          us_state, 
          adrCountry,
          latitude,
          longitude,
          itu,
          grid,
          qth,
          country
        ];
  
        await connection.execute(insertSql, insertValues);
        console.log('Record inserted successfully - ' + callsignToLookup);
      }
    }
  } catch (error) {
    console.error('Error during HamQTH callsign lookup:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

loginAndGetCallsignInfo();