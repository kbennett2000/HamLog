export interface PotaQso {
  POTA_QSO_ID: number;
  QSO_ID: number;
  POTAPark_ID: string;
  QSO_Type: string;
}

export interface Contact {
  QSO_ID: number;
  QSO_Date: string;
  QSO_MTZTime: string;
  QSO_Callsign: string;
  QSO_Frequency: string;
  QSO_Notes: string;
  QSO_Received: string;
  QSO_Sent: string;
  qso_datetime_utc: string | null;
  frequency_mhz: number | null;
  mode: string | null;
  band: string | null;
  POTA_QSOs: PotaQso[];
}

export interface MapMarker {
  qsoId: number;
  callsign: string;
  date: string;
  time: string;
  frequency: string;
  mode: string | null;
  band: string | null;
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
}

export interface ContactInfo {
  ContactInfo_ID: number;
  ContactInfo_Callsign: string;
  ContactInfo_Name: string;
  ContactInfo_Street: string;
  ContactInfo_City: string;
  ContactInfo_usState: string;
  ContactInfo_AddressCountry: string;
  ContactInfo_Latitude: string;
  ContactInfo_Longitude: string;
  ContactInfo_ITUZone: string;
  ContactInfo_GridSquare: string;
  ContactInfo_QTH: string;
  ContactInfo_Country: string;
}
