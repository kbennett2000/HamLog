import type { Contact, SearchFilters } from '../types/qso';

export function filterQsos(qsos: Contact[], filters: SearchFilters): Contact[] {
  return qsos.filter(qso => {
    if (filters.callsign && !qso.QSO_Callsign.toLowerCase().includes(filters.callsign.toLowerCase())) {
      return false;
    }

    if (filters.dateFrom) {
      const qsoDate = new Date(qso.QSO_Date).toISOString().slice(0, 10);
      if (qsoDate < filters.dateFrom) return false;
    }

    if (filters.dateTo) {
      const qsoDate = new Date(qso.QSO_Date).toISOString().slice(0, 10);
      if (qsoDate > filters.dateTo) return false;
    }

    if (filters.frequency && !qso.QSO_Frequency.includes(filters.frequency)) {
      return false;
    }

    if (filters.band && qso.band !== filters.band) {
      return false;
    }

    if (filters.mode && qso.mode !== filters.mode) {
      return false;
    }

    if (filters.potaPark) {
      const parkMatch = qso.POTA_QSOs.some(p =>
        p.POTAPark_ID.toLowerCase().includes(filters.potaPark.toLowerCase())
      );
      if (!parkMatch) return false;
    }

    if (filters.notes && !qso.QSO_Notes?.toLowerCase().includes(filters.notes.toLowerCase())) {
      return false;
    }

    return true;
  });
}
