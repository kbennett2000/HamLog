import React, { useState, useEffect, useRef } from 'react';
import QSOsForCallsign from './QSOsForCallsign';
import { AddCallsignInfo } from '../services/CallsignLookup';
import { getContactInfo } from '../api/hamlog-api';
import { MapPin, User } from 'lucide-react';

interface CallsignInfoProps {
  callSignToSearchFor: string;
  isOpen: boolean;
  displayTime?: boolean;
}

const CallsignInfo: React.FC<CallsignInfoProps> = ({ callSignToSearchFor, isOpen }) => {
  const [conditions, setConditions] = useState<any[]>([]);
  const prevCallsignRef = useRef('');

  useEffect(() => {
    if (!isOpen || !callSignToSearchFor) {
      setConditions([]);
      return;
    }

    if (callSignToSearchFor === prevCallsignRef.current) return;
    prevCallsignRef.current = callSignToSearchFor;

    const fetchData = async () => {
      try {
        const rows = await getContactInfo(callSignToSearchFor);
        if (Array.isArray(rows) && rows.length > 0) {
          setConditions(rows);
        } else {
          setConditions([]);
          AddCallsignInfo([callSignToSearchFor]);
        }
      } catch {
        setConditions([]);
      }
    };

    fetchData();
  }, [callSignToSearchFor, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      prevCallsignRef.current = '';
    }
  }, [isOpen]);

  if (!isOpen || conditions.length === 0) return null;

  const info = conditions[0];

  return (
    <div className="fixed top-16 right-4 w-[calc(100vw-2rem)] sm:w-80 max-h-[calc(100vh-5rem)] overflow-y-auto z-50 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl shadow-panel animate-slide-in-right">
      <div className="p-4 border-b border-[var(--color-card-border)]">
        <h2 className="text-lg font-bold font-mono text-[var(--color-text-primary)]">
          {callSignToSearchFor}
        </h2>
      </div>

      <div className="p-4 space-y-3">
        {info.ContactInfo_Name && (
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {info.ContactInfo_Name}
            </span>
          </div>
        )}

        {(info.ContactInfo_City || info.ContactInfo_usState) && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
            <div className="text-sm text-[var(--color-text-secondary)]">
              <div>
                {info.ContactInfo_City}
                {info.ContactInfo_usState?.length > 0 && `, ${info.ContactInfo_usState}`}
              </div>
              {info.ContactInfo_AddressCountry && (
                <div className="text-[var(--color-text-muted)]">{info.ContactInfo_AddressCountry}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-card-border)]">
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            QSO History
          </h3>
        </div>
        <QSOsForCallsign callSignToSearchFor={callSignToSearchFor} isOpen={isOpen} displayTime={false} />
      </div>
    </div>
  );
};

export default CallsignInfo;
