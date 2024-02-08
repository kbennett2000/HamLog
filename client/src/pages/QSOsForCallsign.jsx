import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';
const { 
  ServerURL,
  ServerPort,
  TableHeading1, 
  TableCell1, 
  TableStyle1, 
  TableBodyStyle1, 
  TableHeadStyle2, 
} = config;

let dataEndpointLocation = '';
let runCount = 0;
let cachedCallsign = '';

const QSOsForCallsign = ({ callSignToSearchFor, isOpen, displayTime }) => {
  const [conditions, setConditions] = useState([]);
  dataEndpointLocation=`${ServerURL}:${ServerPort}/Get_Contacts_for_Callsign?QSO_Callsign=${callSignToSearchFor}`;

  const fetchData = async () => {
    try {
      const res = await axios.get(dataEndpointLocation);
      // Check if the response is an array, otherwise set to an empty array
      setConditions(Array.isArray(res.data.Contacts) ? res.data.Contacts : []);    
      cachedCallsign = callSignToSearchFor;  
    } catch (err) {
      console.log(err);
      setConditions([]); // Set to an empty array in case of an error
    }
  };

  // Truncate the hz component of the frequency, if it's there
  function formatFrequency(inputFreq) {
    const dotCount = (inputFreq.match(/\./g) || []).length;
    
    if (dotCount === 1) {
        // The frequency has one '.' inside it
        // Return the entire string
        return inputFreq;
    } else if (dotCount === 2) {
        // The frequency has two '.' inside it
        // Return everything up to the second '.'
        return inputFreq.substring(0, inputFreq.lastIndexOf('.'));
    } else {
        return '';
    }
}

  if (isOpen) {
    // Handles data fetch when control initially loads
    if (runCount === 0) {
      runCount++;
      fetchData();
    }
    // Handles data fetch when callsign changes
    if (cachedCallsign !== callSignToSearchFor) {
      cachedCallsign = callSignToSearchFor;
      fetchData();
    }    
  } else {
    // Control is not open, do not display 
    return null;
  }

  // If there are no QSOs for the current callsign, don't display the control
  if (conditions.length === 0) {
    return null;
  }

  return (
    <>
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
    </>
  );
};

export default QSOsForCallsign;
