import React, { useState, useEffect, useRef } from 'react';
import { getQsosByCallsign } from '../api/hamlog-api';
import config from '../config';
const {
  TableHeading1,
  TableCell1,
  TableStyle1,
  TableBodyStyle1,
  TableHeadStyle2,
} = config;

function formatFrequency(inputFreq: string): string {
  const dotCount = (inputFreq.match(/\./g) || []).length;
  if (dotCount === 1) return inputFreq;
  if (dotCount === 2) return inputFreq.substring(0, inputFreq.lastIndexOf('.'));
  return '';
}

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
      } catch (err) {
        console.log(err);
        setConditions([]);
      }
    };

    fetchData();
  }, [callSignToSearchFor, isOpen]);

  if (!isOpen || conditions.length === 0) return null;

  return (
    <div className='overflow-hidden'>
      <table className={TableStyle1}>
        <thead className={TableHeadStyle2}>
          <tr>
            <th scope='col' className={TableHeading1}>Date</th>
            {displayTime && (<th scope='col' className={TableHeading1}>Time</th>)}
            <th scope='col' className={TableHeading1}>Freq</th>
          </tr>
        </thead>
        <tbody className={TableBodyStyle1}>
          {conditions.map((condition, index) => (
            <React.Fragment key={index}>
              <tr className={`${index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-400' : '' } ${index % 2 === 1 ? 'bg-gray-300 dark:bg-gray-600' : '' }`} >
                <td className={TableCell1}>{new Date(condition.QSO_Date).toLocaleDateString('en-US')}</td>
                {displayTime && (<td className={TableCell1}>{condition.QSO_MTZTime.slice(0, 5)}</td>)}
                <td className={TableCell1}>{formatFrequency(condition.QSO_Frequency)}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QSOsForCallsign;
