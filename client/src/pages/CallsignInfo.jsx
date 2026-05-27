import React, { useState, useEffect, useRef } from 'react';
import QSOsForCallsign from './QSOsForCallsign';
import { AddCallsignInfo } from '../services/CallsignLookup';
import { getContactInfo } from '../api/hamlog-api';
import config from '../config';
const {
  TableHeading1,
  TableCell1,
  TableStyle1,
  TableBodyStyle1,
  TableHeadStyle1,
} = config;

const CallsignInfo = ({ callSignToSearchFor, isOpen, displayTime }) => {
  const [conditions, setConditions] = useState([]);
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
      } catch (err) {
        console.log(err);
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

  return (
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
  );
};

export default CallsignInfo;
