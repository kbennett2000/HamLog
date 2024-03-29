import React, { useState } from 'react';
import axios from 'axios';
import QSOsForCallsign from './QSOsForCallsign';
import { AddCallsignInfo } from '../services/CallsignLookup';
import config from '../config';
const { 
  ServerURL,
  ServerPort,
  TableHeading1, 
  TableCell1, 
  TableStyle1, 
  TableBodyStyle1, 
  TableHeadStyle1, 
} = config;

let dataEndpointLocation = '';
let runCount = 0;
let cachedCallsign = '';

const CallsignInfo = ({ callSignToSearchFor, isOpen, displayTime }) => {    
  const [conditions, setConditions] = useState([]);
  dataEndpointLocation=`${ServerURL}:${ServerPort}/Get_Callsign_Info?Callsign=${callSignToSearchFor}`;

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

  // If there is no record for the current callsign, don't display the control
  if (conditions.length === 0) {
    // Add the callsign to the database    
    AddCallsignInfo([callSignToSearchFor]);    
    fetchData();
    return null;
  }

  return (
    <>      
      <div className='fixed top-0 right-0 mt-4 mr-4 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full md:w-auto' id='my-modal'>
          <div className='relative p-5 border w-auto shadow-lg rounded-md bg-white'>
              <h1 className='text-3xl font-bold mb-4'>{callSignToSearchFor}</h1>
              <div className='mx-auto'>
                  <div className='mx-auto'>
                  <div className='flex flex-col'>
                      <div className='overflow-x-auto shadow-md sm:rounded-lg'>
                        <div className='inline-block min-w-full align-middle'>
                            <div className='overflow-hidden '>
                                <table className={TableStyle1}>
                                    <thead className={TableHeadStyle1}>
                                        <tr>
                                            <th scope='col' className={TableHeading1}>{conditions[0].ContactInfo_Name}</th>
                                        </tr>
                                    </thead>
                                    <tbody className={TableBodyStyle1}>
                                        {conditions.map((condition, index) => (
                                            <React.Fragment key={index}>
                                                <tr className={`${index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-400' : '' } ${index % 2 === 1 ? 'bg-gray-300 dark:bg-gray-600' : '' }`} >
                                                    <td className={TableCell1}>
                                                        {condition.ContactInfo_City}
                                                        {condition.ContactInfo_usState.length > 0 && ", " + condition.ContactInfo_usState}
                                                    </td>                            
                                                </tr>
                                                <tr className={`${index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-400' : '' } ${index % 2 === 1 ? 'bg-gray-300 dark:bg-gray-600' : '' }`} >
                                                    <td className={TableCell1}>{condition.ContactInfo_AddressCountry}</td>
                                                </tr>
                                                <tr className={`${index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-400' : '' } ${index % 2 === 1 ? 'bg-gray-300 dark:bg-gray-600' : '' }`} >
                                                    <td className={TableCell1}>
                                                        <div className='overflow-x-auto shadow-md sm:rounded-lg'>
                                                            <div className='inline-block min-w-full align-middle'>
                                                                <div className='overflow-hidden'>
                                                                    <QSOsForCallsign callSignToSearchFor={callSignToSearchFor} isOpen={isOpen} displayTime={false} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
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
    </>
  );
};

export default CallsignInfo;
