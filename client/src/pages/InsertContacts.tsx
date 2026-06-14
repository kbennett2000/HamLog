import React, { useState, useRef } from 'react';
import CallsignInfo from './CallsignInfo';
import QSOsForParkNumber from './QSOsForParkNumber';
import { createQso, createPotaQso, createContestQso } from '../api/hamlog-api';
import { X, Plus } from 'lucide-react';
import config from '../config';
const { InputBoxClassName, ButtonClassNameBlue, ButtonClassNameDashed, InputLabel1 } = config;

const CONTEST_QSO_LIMIT = 1;

interface InsertContactsProps {
  isOpen: boolean;
  onClose: () => void;
  onClosed: () => void;
}

const InsertContacts: React.FC<InsertContactsProps> = ({ isOpen, onClose, onClosed }) => {
  const contestQSOCounterRef = useRef(0);
  const [showCallsignInfo, setShowCallsignInfo] = useState(false);
  const [currentCallsign, setCurrentCallsign] = useState('');
  const [showQSOsForParkNumber, setShowQSOsForParkNumber] = useState(false);
  const [currentParkNumber, setCurrentParkNumber] = useState('');

  const initialFormData = {
    QSO_Callsign: '',
    QSO_Frequency: '',
    QSO_Notes: '',
    QSO_Received: '',
    QSO_Sent: '',
    QSO_Mode: '',
    QSO_Band: '',
  };

  const initialPOTAQSOFormData: Record<string, string>[] = [];
  const initialContestQSOFormData: Record<string, string>[] = [];

  const [formData, setFormData] = useState(initialFormData);
  const [qsoRecords, setQSORecords] = useState(initialPOTAQSOFormData);
  const [contestRecords, setContestRecords] = useState(initialContestQSOFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCallsignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.toUpperCase() });
  };

  const handleQSOChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newQSORecords = [...qsoRecords];
    (newQSORecords[index] as any)[e.target.name] = e.target.value;
    setQSORecords(newQSORecords);
  };

  const handleQSOPOTAIDChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newQSORecords = [...qsoRecords];
    (newQSORecords[index] as any)[e.target.name] = e.target.value.toUpperCase();
    setQSORecords(newQSORecords);
  };

  const handleContestChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newContestRecords = [...contestRecords];
    (newContestRecords[index] as any)[e.target.name] = e.target.value;
    setContestRecords(newContestRecords);
  };

  const addQSORecord = () => {
    setQSORecords([...qsoRecords, { QSO_ID: '', POTAPark_ID: '', QSO_Type: '1' }]);
  };

  const addContestRecord = () => {
    if (contestQSOCounterRef.current < CONTEST_QSO_LIMIT) {
      contestQSOCounterRef.current++;
      setContestRecords([...contestRecords, { QSO_ID: '', Contest_ID: '', Contest_QSO_Number: '', Contest_QSO_Exchange_Data: '' }]);
    }
  };

  function formatDateToMMDDYYYY(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${month}/${day}/${year}`;
  }

  function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const handleCallsignMouseOver = (qsoCallsign: string) => {
    setCurrentCallsign(qsoCallsign);
    setShowCallsignInfo(true);
  }

  const handleCallsignMouseLeave = () => {
    setShowCallsignInfo(false);
  }

  const handleParkNumberMouseOver = (parkNumber: string) => {
    setCurrentParkNumber(parkNumber);
    setShowQSOsForParkNumber(true);
  }

  const handleParkNumberMouseLeave = () => {
    setShowQSOsForParkNumber(false);
  }

  const handleClose = () => {
    setFormData(initialFormData);
    setQSORecords(initialPOTAQSOFormData);
    setContestRecords(initialContestQSOFormData);
    contestQSOCounterRef.current = 0;
    onClose();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.QSO_Callsign.trim() || !formData.QSO_Frequency.trim()) {
      alert('Callsign and Frequency fields cannot be blank.');
      return;
    }

    const callsignsToAdd = formData.QSO_Callsign.split(',');
    const createdIds = [];
    const failures: string[] = [];

    for (const callsign of callsignsToAdd) {
      try {
        const result = await createQso({
          date: formatDateToMMDDYYYY(new Date()),
          time: getCurrentTime(),
          callsign: callsign.trim(),
          frequency: formData.QSO_Frequency,
          notes: formData.QSO_Notes,
          received: formData.QSO_Received,
          sent: formData.QSO_Sent,
          mode: formData.QSO_Mode,
          band: formData.QSO_Band,
        });
        createdIds.push(result.id);
      } catch (err) {
        const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          ?? 'could not be added';
        failures.push(`${callsign.trim()}: ${message}`);
      }
    }

    if (failures.length) {
      alert(`Some QSOs were not added:\n${failures.join('\n')}`);
    }

    for (const qsoId of createdIds) {
      for (const qsoRecord of qsoRecords) {
        if (qsoRecord.POTAPark_ID && qsoRecord.QSO_Type) {
          try {
            await createPotaQso(qsoId, qsoRecord.POTAPark_ID, qsoRecord.QSO_Type);
          } catch {
            // POTA QSO creation failed silently
          }
        }
      }

      for (const contestRecord of contestRecords) {
        if (contestRecord.Contest_ID) {
          try {
            await createContestQso(qsoId, contestRecord.Contest_ID, contestRecord.Contest_QSO_Number, contestRecord.Contest_QSO_Exchange_Data);
          } catch {
            // Contest QSO creation failed silently
          }
        }
      }
    }

    // Keep the form open with the user's input intact if nothing was saved (e.g. the
    // only callsign was a duplicate), so they can correct it without re-typing.
    if (createdIds.length === 0) {
      return;
    }

    setFormData(initialFormData);
    setQSORecords(initialPOTAQSOFormData);
    setContestRecords(initialContestQSOFormData);
    onClose();
    onClosed();
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-[var(--color-surface-900)]/60 backdrop-blur-sm z-40 animate-fade-in">
      <div className="fixed inset-x-0 bottom-0 sm:relative sm:top-8 sm:mx-auto p-6 w-full sm:max-w-lg bg-[var(--color-card-bg)] rounded-t-2xl sm:rounded-2xl shadow-modal animate-slide-in-up max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Add QSO</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-100)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={InputLabel1} htmlFor="QSO_Callsign">Callsign</label>
              <input
                type="text"
                name="QSO_Callsign"
                value={formData.QSO_Callsign}
                onChange={handleCallsignChange}
                className={`${InputBoxClassName} font-mono uppercase`}
                autoFocus
                onMouseLeave={() => handleCallsignMouseLeave()}
                onMouseOver={(e) => { const val = (e.target as HTMLInputElement).value; if (val) handleCallsignMouseOver(val); }}
              />
            </div>
            <div>
              <label className={InputLabel1} htmlFor="QSO_Frequency">Frequency</label>
              <input
                type="text"
                name="QSO_Frequency"
                value={formData.QSO_Frequency}
                onChange={handleChange}
                className={`${InputBoxClassName} font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={InputLabel1} htmlFor="QSO_Received">Received</label>
              <input type="text" name="QSO_Received" value={formData.QSO_Received} onChange={handleChange} className={InputBoxClassName} />
            </div>
            <div>
              <label className={InputLabel1} htmlFor="QSO_Sent">Sent</label>
              <input type="text" name="QSO_Sent" value={formData.QSO_Sent} onChange={handleChange} className={InputBoxClassName} />
            </div>
          </div>

          <div>
            <label className={InputLabel1} htmlFor="QSO_Notes">Notes</label>
            <input type="text" name="QSO_Notes" value={formData.QSO_Notes} onChange={handleChange} className={InputBoxClassName} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={InputLabel1} htmlFor="QSO_Mode">Mode</label>
              <input type="text" name="QSO_Mode" value={formData.QSO_Mode} onChange={handleChange} className={InputBoxClassName} placeholder="SSB, CW, FT8..." />
            </div>
            <div>
              <label className={InputLabel1} htmlFor="QSO_Band">Band</label>
              <input type="text" name="QSO_Band" value={formData.QSO_Band} onChange={handleChange} className={InputBoxClassName} placeholder="20m, 40m..." />
            </div>
          </div>

          {qsoRecords.length > 0 && (
            <div className="border-t border-[var(--color-card-border)] pt-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">POTA Records</h3>
              {qsoRecords.map((qso, index) => (
                <div key={index} className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={InputLabel1} htmlFor={`POTAPark_ID_${index}`}>Park ID</label>
                    <input
                      type="text"
                      name="POTAPark_ID"
                      id={`POTAPark_ID_${index}`}
                      value={qso.POTAPark_ID}
                      onChange={(e) => handleQSOPOTAIDChange(index, e)}
                      className={`${InputBoxClassName} font-mono uppercase`}
                      onMouseLeave={() => handleParkNumberMouseLeave()}
                      onMouseOver={(e) => { const val = (e.target as HTMLInputElement).value; if (val) handleParkNumberMouseOver(val); }}
                    />
                  </div>
                  <div>
                    <label className={InputLabel1} htmlFor={`QSO_Type_${index}`}>QSO Type</label>
                    <select
                      name="QSO_Type"
                      id={`QSO_Type_${index}`}
                      value={qso.QSO_Type}
                      onChange={(e) => handleQSOChange(index, e)}
                      className={InputBoxClassName}
                    >
                      <option value="1">Hunter</option>
                      <option value="2">Activator</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {contestRecords.length > 0 && (
            <div className="border-t border-[var(--color-card-border)] pt-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Contest Records</h3>
              {contestRecords.map((contest, index) => (
                <div key={index} className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={InputLabel1} htmlFor={`Contest_ID_${index}`}>Contest ID</label>
                    <input type="text" name="Contest_ID" id={`Contest_ID_${index}`} value={contest.Contest_ID} onChange={(e) => handleContestChange(index, e)} className={InputBoxClassName} />
                  </div>
                  <div>
                    <label className={InputLabel1} htmlFor={`Contest_QSO_Number_${index}`}>QSO No</label>
                    <input type="text" name="Contest_QSO_Number" id={`Contest_QSO_Number_${index}`} value={contest.Contest_QSO_Number} onChange={(e) => handleContestChange(index, e)} className={InputBoxClassName} />
                  </div>
                  <div>
                    <label className={InputLabel1} htmlFor={`Contest_QSO_Exchange_Data_${index}`}>Exchange</label>
                    <input type="text" name="Contest_QSO_Exchange_Data" id={`Contest_QSO_Exchange_Data_${index}`} value={contest.Contest_QSO_Exchange_Data} onChange={(e) => handleContestChange(index, e)} className={InputBoxClassName} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={addQSORecord} className={ButtonClassNameDashed}>
              <Plus className="w-4 h-4" /> POTA
            </button>
            <button type="button" onClick={addContestRecord} className={ButtonClassNameDashed}>
              <Plus className="w-4 h-4" /> Contest
            </button>
          </div>

          <button type="submit" className={`${ButtonClassNameBlue} w-full`}>
            Add QSO
          </button>
        </form>
      </div>

    </div>
    <CallsignInfo callSignToSearchFor={currentCallsign} isOpen={showCallsignInfo} />
    <QSOsForParkNumber parkNumberToSearchFor={currentParkNumber} isOpen={showQSOsForParkNumber} />
  </>
  );
};

export default InsertContacts;
