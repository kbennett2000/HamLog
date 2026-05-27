export interface AdifRecord {
  call?: string;
  qso_date?: string;
  time_on?: string;
  freq?: string;
  mode?: string;
  band?: string;
  rst_sent?: string;
  rst_rcvd?: string;
  notes?: string;
  sig?: string;
  sig_info?: string;
  my_sig?: string;
  my_sig_info?: string;
  [key: string]: string | undefined;
}

const FIELD_REGEX = /<([A-Za-z0-9_]+):(\d+)(?::[A-Za-z])?>/g;

export function parseAdif(content: string): AdifRecord[] {
  const records: AdifRecord[] = [];

  const eohIndex = content.search(/<eoh>/i);
  const body = eohIndex >= 0
    ? content.substring(eohIndex + 5)
    : content;

  const rawRecords = body.split(/<eor>/i);

  for (const rawRecord of rawRecords) {
    const trimmed = rawRecord.trim();
    if (!trimmed) continue;

    const record: AdifRecord = {};
    let match: RegExpExecArray | null;
    const regex = new RegExp(FIELD_REGEX.source, 'gi');

    while ((match = regex.exec(trimmed)) !== null) {
      const fieldName = match[1].toLowerCase();
      const length = parseInt(match[2], 10);
      const valueStart = regex.lastIndex;
      const value = trimmed.substring(valueStart, valueStart + length);
      record[fieldName] = value;
    }

    if (Object.keys(record).length > 0) {
      records.push(record);
    }
  }

  return records;
}

export function adifRecordToQso(record: AdifRecord) {
  const date = record.qso_date
    ? `${record.qso_date.substring(0, 4)}-${record.qso_date.substring(4, 6)}-${record.qso_date.substring(6, 8)}`
    : null;

  let time = record.time_on || '';
  if (time.length === 4) time = `${time.substring(0, 2)}:${time.substring(2, 4)}:00`;
  if (time.length === 6) time = `${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}`;

  const freq = record.freq || '';

  const isPota = record.sig?.toUpperCase() === 'POTA';
  const parkId = isPota ? record.sig_info : null;

  return {
    date: date ? `${date} ${time}` : null,
    time,
    callsign: record.call || '',
    frequency: freq,
    notes: record.notes || '',
    received: record.rst_rcvd || '',
    sent: record.rst_sent || '',
    mode: record.mode || '',
    band: record.band || '',
    potaParkId: parkId,
    potaQsoType: isPota ? '1' : null,
  };
}
