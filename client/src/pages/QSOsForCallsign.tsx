import React, { useState, useEffect, useRef } from 'react';
import { getQsosByCallsign } from '../api/hamlog-api';
import { formatFrequency } from '../utils/format';
import config from '../config';
const { TableHeading2, TableCell1, TableStyle1, TableBodyStyle1, TableHeadStyle2 } = config;

interface QSOsForCallsignProps {
  callSignToSearchFor: string;
  isOpen: boolean;
  displayTime?: boolean;
}

const QSOsForCallsign: React.FC<QSOsForCallsignProps> = ({ callSignToSearchFor, isOpen, displayTime }) => {
  const [conditions, setConditions] = useState<any[]>([]);
  const prevCallsignRef = useRef('');

  useEffect(() => {
    if (!isOpen || !callSignToSearchFor) {
      setConditions([]);
      prevCallsignRef.current = '';
      return;
    }

    if (callSignToSearchFor === prevCallsignRef.current) return;
    prevCallsignRef.current = callSignToSearchFor;

    const fetchData = async () => {
      try {
        const rows = await getQsosByCallsign(callSignToSearchFor);
        setConditions(Array.isArray(rows) ? rows : []);
      } catch {
        setConditions([]);
      }
    };

    fetchData();
  }, [callSignToSearchFor, isOpen]);

  if (!isOpen || conditions.length === 0) return null;

  return (
    <div className="overflow-hidden">
      <table className={TableStyle1}>
        <thead className={TableHeadStyle2}>
          <tr>
            <th scope="col" className={TableHeading2}>Date</th>
            {displayTime && (<th scope="col" className={TableHeading2}>Time</th>)}
            <th scope="col" className={TableHeading2}>Freq</th>
          </tr>
        </thead>
        <tbody className={TableBodyStyle1}>
          {conditions.map((condition, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-[var(--color-surface-50)]' : 'bg-[var(--color-card-bg)]'}>
              <td className={TableCell1}>{new Date(condition.QSO_Date).toLocaleDateString('en-US')}</td>
              {displayTime && (<td className={TableCell1}>{condition.QSO_MTZTime.slice(0, 5)}</td>)}
              <td className={`${TableCell1} font-mono`}>{formatFrequency(condition.QSO_Frequency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QSOsForCallsign;
