import { triggerCallsignLookup } from '../api/hamlog-api';

export async function AddCallsignInfo(CallsignsToLookup: string[]) {
  try {
    for (const callsignToLookup of CallsignsToLookup) {
      await triggerCallsignLookup(callsignToLookup.toUpperCase());
    }
  } catch {
    // callsign lookup failed silently
  }
}
