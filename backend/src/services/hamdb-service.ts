import logger from '../logger.js';

export interface HamDBResult {
  callsign: string;
  name: string;
  addr1: string;
  addr2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  grid: string;
  lat: string;
  lon: string;
}

export async function lookupCallsign(callsign: string): Promise<HamDBResult | null> {
  try {
    const url = `https://www.hamdb.org/api/lookup/${encodeURIComponent(callsign)}/json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      logger.warn({ callsign, status: res.status }, 'HamDB API returned non-OK status');
      return null;
    }

    const data = await res.json();
    const info = data?.hamdb?.callsign;

    if (!info || info.call === 'NOT_FOUND') {
      return null;
    }

    return {
      callsign: info.call || callsign,
      name: [info.fname, info.mi, info.name].filter(Boolean).join(' ').trim() || '',
      addr1: info.addr1 || '',
      addr2: info.addr2 || '',
      city: info.addr2 || '',
      state: info.state || '',
      zip: info.zip || '',
      country: info.country || '',
      grid: info.grid || '',
      lat: info.lat || '',
      lon: info.lon || '',
    };
  } catch (err) {
    logger.warn({ err, callsign }, 'HamDB lookup failed');
    return null;
  }
}
