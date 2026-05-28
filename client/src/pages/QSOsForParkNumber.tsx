import React, { useState, useEffect, useRef } from 'react';
import { getQsosByPark } from '../api/hamlog-api';
import { formatFrequency } from '../utils/format';
import config from '../config';
const { TableHeading2, TableCell1, TableStyle1, TableHeadStyle3, TableBodyStyle1 } = config;

interface QSOsForParkNumberProps {
  parkNumberToSearchFor: string;
  isOpen: boolean;
  displayTime?: boolean;
}

const QSOsForParkNumber: React.FC<QSOsForParkNumberProps> = ({ parkNumberToSearchFor, isOpen, displayTime }) => {
  const [conditions, setConditions] = useState<any[]>([]);
  const prevParkRef = useRef('');

  useEffect(() => {
    if (!isOpen || !parkNumberToSearchFor) {
      setConditions([]);
      prevParkRef.current = '';
      return;
    }

    if (parkNumberToSearchFor === prevParkRef.current) return;
    prevParkRef.current = parkNumberToSearchFor;

    const fetchData = async () => {
      try {
        const rows = await getQsosByPark(parkNumberToSearchFor);
        setConditions(Array.isArray(rows) ? rows : []);
      } catch {
        setConditions([]);
      }
    };

    fetchData();
  }, [parkNumberToSearchFor, isOpen]);

  if (!isOpen || conditions.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 w-[calc(100vw-2rem)] sm:w-80 max-h-[calc(100vh-5rem)] overflow-y-auto z-50 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl shadow-panel animate-slide-in-right">
      <div className="p-4 border-b border-[var(--color-card-border)]">
        <h2 className="text-lg font-bold font-mono text-[var(--color-text-primary)]">
          {parkNumberToSearchFor}
        </h2>
      </div>

      <div className="overflow-hidden">
        <table className={TableStyle1}>
          <thead className={TableHeadStyle3}>
            <tr>
              <th scope="col" className={TableHeading2}>Date</th>
              {displayTime && (<th scope="col" className={TableHeading2}>Time</th>)}
              <th scope="col" className={TableHeading2}>Call</th>
              <th scope="col" className={TableHeading2}>Freq</th>
            </tr>
          </thead>
          <tbody className={TableBodyStyle1}>
            {conditions.map((condition, index) => (
              <tr
                key={index}
                className={`hover:bg-[var(--color-surface-100)] ${index % 2 === 0 ? 'bg-[var(--color-surface-50)]' : 'bg-[var(--color-card-bg)]'}`}
              >
                <td className={TableCell1}>{new Date(condition.QSO_Date).toLocaleDateString('en-US')}</td>
                {displayTime && (<td className={TableCell1}>{condition.QSO_MTZTime.slice(0, 5)}</td>)}
                <td className={`${TableCell1} font-mono font-medium`}>{condition.QSO_Callsign}</td>
                <td className={`${TableCell1} font-mono`}>{formatFrequency(condition.QSO_Frequency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QSOsForParkNumber;
