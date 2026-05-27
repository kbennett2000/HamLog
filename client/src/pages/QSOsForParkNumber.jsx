import React, { useState, useEffect, useRef } from 'react';
import { getQsosByPark } from '../api/hamlog-api';
import config from '../config';
const { TableHeading1, TableCell1, TableStyle1, TableHeadStyle3, TableBodyStyle1 } = config;

function formatFrequency(inputFreq) {
  const dotCount = (inputFreq.match(/\./g) || []).length;
  if (dotCount === 1) return inputFreq;
  if (dotCount === 2) return inputFreq.substring(0, inputFreq.lastIndexOf('.'));
  return '';
}

const QSOsForParkNumber = ({ parkNumberToSearchFor, isOpen, displayTime }) => {
  const [conditions, setConditions] = useState([]);
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
      } catch (err) {
        console.log(err);
        setConditions([]);
      }
    };

    fetchData();
  }, [parkNumberToSearchFor, isOpen]);

  if (!isOpen || conditions.length === 0) return null;

  return (
    <div className='fixed top-0 right-0 mt-4 mr-4 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full md:w-auto' id='my-modal'>
      <div className='relative p-5 border w-auto shadow-lg rounded-md bg-white'>
        <h1 className='text-3xl font-bold mb-4'>{parkNumberToSearchFor}</h1>
        <div className='mx-auto'>
          <div className='mx-auto'>
            <div className='flex flex-col'>
              <div className='overflow-x-auto shadow-md sm:rounded-lg'>
                <div className='inline-block min-w-full align-middle'>
                  <div className='overflow-hidden '>
                    <table className={TableStyle1}>
                      <thead className={TableHeadStyle3}>
                        <tr>
                          <th scope='col' className={TableHeading1}>Date</th>
                          {displayTime && (<th scope='col' className={TableHeading1}>Time</th>)}
                          <th scope='col' className={TableHeading1}>Call</th>
                          <th scope='col' className={TableHeading1}>Freq</th>
                        </tr>
                      </thead>
                      <tbody className={TableBodyStyle1}>
                        {conditions.map((condition, index) => (
                          <React.Fragment key={index}>
                            <tr className={`hover:bg-green-100 dark:hover:bg-green-700 ${index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-400' : '' } ${index % 2 === 1 ? 'bg-gray-300 dark:bg-gray-600' : '' }`} >
                              <td className={TableCell1}>{new Date(condition.QSO_Date).toLocaleDateString('en-US')}</td>
                              {displayTime && (<td className={TableCell1}>{condition.QSO_MTZTime.slice(0, 5)}</td>)}
                              <td className={TableCell1}>{condition.QSO_Callsign}</td>
                              <td className={TableCell1}>{formatFrequency(condition.QSO_Frequency)}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QSOsForParkNumber;
