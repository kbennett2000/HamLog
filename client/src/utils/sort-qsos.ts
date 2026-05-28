import type { Contact, SortConfig } from '../types/qso';

const BAND_ORDER: Record<string, number> = {
  '160m': 1, '80m': 2, '60m': 3, '40m': 4, '30m': 5,
  '20m': 6, '17m': 7, '15m': 8, '12m': 9, '10m': 10,
  '6m': 11, '2m': 12, '70cm': 13,
};

export function sortQsos(qsos: Contact[], sort: SortConfig): Contact[] {
  const sorted = [...qsos];
  const dir = sort.direction === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    let cmp = 0;

    switch (sort.field) {
      case 'date': {
        const dateA = new Date(a.QSO_Date).getTime();
        const dateB = new Date(b.QSO_Date).getTime();
        cmp = dateA - dateB;
        if (cmp === 0) cmp = (a.QSO_MTZTime || '').localeCompare(b.QSO_MTZTime || '');
        break;
      }
      case 'callsign':
        cmp = (a.QSO_Callsign || '').localeCompare(b.QSO_Callsign || '');
        break;
      case 'frequency': {
        const fa = a.frequency_mhz ?? Infinity;
        const fb = b.frequency_mhz ?? Infinity;
        cmp = fa - fb;
        break;
      }
      case 'mode': {
        const ma = a.mode || '￿';
        const mb = b.mode || '￿';
        cmp = ma.localeCompare(mb);
        break;
      }
      case 'band': {
        const ba = BAND_ORDER[a.band || ''] ?? 999;
        const bb = BAND_ORDER[b.band || ''] ?? 999;
        cmp = ba - bb;
        break;
      }
    }

    return cmp * dir;
  });

  return sorted;
}
