import { contactInfoExists, createContactInfo } from '../api/hamlog-api';

export async function AddCallsignInfo(CallsignsToLookup: string[]) {
  try {
    for (const callsignToLookup of CallsignsToLookup) {
      const exists = await contactInfoExists(callsignToLookup.toUpperCase());

      if (!exists) {
        await createContactInfo({
          callsign: callsignToLookup.toUpperCase(),
          name: 'unknown',
          street: 'unknown',
          city: 'unknown',
          state: '',
          addressCountry: 'unknown',
          latitude: '',
          longitude: '',
          itu: 'unknown',
          grid: 'unknown',
          qth: 'unknown',
          country: 'unknown',
        });
      }
    }
  } catch (error) {
    console.error('Error during callsign lookup:', error);
  }
}
