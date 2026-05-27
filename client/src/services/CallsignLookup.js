import axios from 'axios';
import config from '../config';
const { ApiBaseUrl, ApiKey } = config;

export async function AddCallsignInfo(CallsignsToLookup) {
  try {
    for (const callsignToLookup of CallsignsToLookup) {
      // HamQTH lookup disabled (2/18/24) — insert "unknown" as placeholder
      const qth = "unknown";
      const country = "unknown";
      const itu = "unknown";
      const grid = "unknown";
      const adrName = "unknown";
      const adrStreet1 = "unknown";
      const adrCity = "unknown";
      const adrCountry = "unknown";
      const latitude = "";
      const longitude = "";
      const us_state = "";

      const res = await axios.get(`${ApiBaseUrl}/contact-info/${callsignToLookup.toUpperCase()}/exists`);

      if (res.data.exists) {
        // Already in database
      } else {
        await axios.post(`${ApiBaseUrl}/contact-info`, {
          callsign: callsignToLookup.toUpperCase(),
          name: adrName,
          street: adrStreet1,
          city: adrCity,
          state: us_state,
          addressCountry: adrCountry,
          latitude,
          longitude,
          itu,
          grid,
          qth,
          country,
        }, {
          headers: { Authorization: `Bearer ${ApiKey}` },
        });
      }
    }
  } catch (error) {
    console.error('Error during callsign lookup:', error);
  }
}
