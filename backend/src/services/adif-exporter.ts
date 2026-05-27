import { RowDataPacket } from 'mysql2';

function adifField(name: string, value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  return `<${name}:${value.length}>${value}`;
}

function formatAdifDate(datetime: string | null): string {
  if (!datetime) return '';
  const d = new Date(datetime);
  if (isNaN(d.getTime())) return '';
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatAdifTime(datetime: string | null): string {
  if (!datetime) return '';
  const d = new Date(datetime);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hours}${minutes}${seconds}`;
}

export function exportAdif(rows: RowDataPacket[], parkFilter?: string): string {
  const lines: string[] = [];

  lines.push('ADIF Export from HamLog');
  lines.push(adifField('ADIF_VER', '3.1.0'));
  lines.push(adifField('PROGRAMID', 'HamLog'));
  lines.push(adifField('PROGRAMVERSION', '1.0'));
  lines.push('<EOH>');
  lines.push('');

  for (const row of rows) {
    const utc = row.qso_datetime_utc || row.QSO_Date;
    const freq = row.frequency_mhz
      ? String(row.frequency_mhz)
      : row.QSO_Frequency?.replace(/\.(\d{3})\.\d+$/, '.$1') || '';

    let record = '';
    record += adifField('CALL', row.QSO_Callsign);
    record += adifField('QSO_DATE', formatAdifDate(utc));
    record += adifField('TIME_ON', formatAdifTime(utc));
    record += adifField('FREQ', freq);
    record += adifField('MODE', row.mode);
    record += adifField('BAND', row.band);
    record += adifField('RST_SENT', row.QSO_Sent);
    record += adifField('RST_RCVD', row.QSO_Received);
    record += adifField('NOTES', row.QSO_Notes);

    if (row.POTAPark_ID) {
      record += adifField('SIG', 'POTA');
      record += adifField('SIG_INFO', row.POTAPark_ID);
    }

    record += '<EOR>';
    lines.push(record);
  }

  return lines.join('\n');
}
