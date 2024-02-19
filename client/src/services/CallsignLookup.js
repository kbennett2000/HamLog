import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import config from '../config';
const { 
  ServerURL,
  ServerPort,
  HamQTHUsername,
  HamQTHPassword,
} = config;

export async function AddCallsignInfo(CallsignsToLookup) {
  try {

    /*
    *************************************************************************
    2/18/24:
      HamQTH data is often wrong. 
      Commenting out lookup to HamQTH.
      Insert "unknown" in the DB to be used as a flag for QRZ lookups later
      TODO: Find better lookup service to replace HamQTH
    *************************************************************************

    const loginUrl = `https://www.hamqth.com/xml.php?u=${HamQTHUsername}&p=${HamQTHPassword}`;
    const loginResponse = await fetch(loginUrl);
    const loginData = await loginResponse.text();

    // Parse the XML response to get the session ID
    const loginDataParsed = await parseStringPromise(loginData);
    const sessionId = loginDataParsed?.HamQTH?.session?.[0]?.session_id?.[0];

    if (!sessionId) {
      console.log('No session ID found. Check login credentials.');
      return;
    }

    */

    for (const callsignToLookup of CallsignsToLookup) {

      /*
      *************************************************************************
      2/18/24:
        HamQTH data is often wrong. 
        Commenting out lookup to HamQTH.
        Insert "unknown" in the DB to be used as a flag for QRZ lookups later
        TODO: Find better lookup service to replace HamQTH
      *************************************************************************


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
      */

      const qth = "unknown";
      const country =  "unknown";
      const itu =  "unknown";
      const grid =  "unknown";
      const adrName =  "unknown";
      const adrStreet1 =  "unknown";
      const adrCity =  "unknown";
      const adrCountry =  "unknown";
      const latitude =  "";
      const longitude =  "";
      const us_state = "";

      //   callsignToLookup
      const queryString = `${ServerURL}:${ServerPort}/Get_ContactInfo_Count?callsignToLookup=${callsignToLookup.toUpperCase()}`;      
      const res = await axios.get(queryString);

      if (res.data.Contacts[0].count > 0) {
        // console.log(`Callsign ${callsignToLookup} already exists in the database.`);
      } else {
        const queryString = `${ServerURL}:${ServerPort}/Create_ContactInfo?callsignToLookup=${callsignToLookup.toUpperCase()}&adrName=${adrName}&adrStreet1=${adrStreet1}&adrCity=${adrCity}&us_state=${us_state}&adrCountry=${adrCountry}&latitude=${latitude}&longitude=${longitude}&itu=${itu}&grid=${grid}&qth=${qth}&country=${country}`;
        console.log("CallsignLookup:");
        console.log(queryString);
        await axios.get(queryString);
      }
    }
  } catch (error) {
    console.error('Error during HamQTH callsign lookup:', error);
  } 
}