import React, { useEffect, useState } from 'react';
import axios from 'axios';
import InsertContacts from './InsertContacts';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import QSOsForCallsign from './QSOsForCallsign';
import QSOsForParkNumber from './QSOsForParkNumber';
import config from '../config';
const { 
  ServerURL,
  ServerPort,  
  ButtonClassNameBlue, 
  ButtonClassNameGreen, 
  ButtonClassNameRed, 
  TableHeading1, 
  TableHeading2, 
  TableCell1, 
  TableStyle1, 
  TableBodyStyle1, 
  TableHeadStyle1, 
  TableHeadStyle2, 
  TableHeadStyle3, 
} = config;
const dataEndpointLocation = `${ServerURL}:${ServerPort}/getContactsAndPOTAQSOs`; 
const pageTitle = 'My Ham Log';

const Contacts = () => {
  const [conditions, setConditions] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showInsertContacts, setShowInsertContacts] = useState(false);
  const [showQSOsForCallsign, setShowQSOsForCallsign] = useState(false);
  const [currentCallsign, setCurrentCallsign] = useState([]);
  const [currentQSOId, setCurrentQSOId] = useState(null);
  const [showQSOsForParkNumber, setShowQSOsForParkNumber] = useState(false);
  const [currentParkNumber, setCurrentParkNumber] = useState([]);


  const fetchData = async () => {
    try {
      const res = await axios.get(dataEndpointLocation);
      setConditions(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const toggleRow = (index) => {
    setExpandedRows((prevRows) => {
      const newRows = [...prevRows];
      newRows[index] = !newRows[index];
      return newRows;
    });
  };

  const HandleDelete = (qsoId) => {
    setShowModal(true);
    setCurrentQSOId(qsoId);
  };

  const HandleInsert = () => {
    setShowInsertContacts(true);
  };

  const handleUserChoice = async (choice) => {
    if (choice === 'Yes') {
      // Delete the record
      try {        
        // Constructing the request URL with query parameters for creating contact records.
        const requestURL = `http://localhost:7800/Delete_Contacts?QSO_ID=${currentQSOId}`;
        // Making an HTTP GET request to the constructed URL.
        await axios.get(requestURL);
        fetchData();
      } catch (error) {
        // Logging any errors that occur during the form submission.
        console.error('Error deleting record:', error);
      }
    } else if (choice === 'No') {
      // Do Nothing
    } else {
      // Do nothing
    }    
    setShowModal(false);
  };

  const handleCallsignMouseOver = (qsoCallsign) => {
    setCurrentCallsign(qsoCallsign);
    setShowQSOsForCallsign(true);
  }

  const handleCallsignMouseLeave = () => {
    setShowQSOsForCallsign(false);
  }

  const handleParkNumberMouseOver = (parkNumber) => {
    setCurrentParkNumber(parkNumber);
    setShowQSOsForParkNumber(true);
  }

  const handleParkNumberMouseLeave = () => {
    setShowQSOsForParkNumber(false);
  }

  const handleInsertContactsClosed = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h1 className='text-3xl font-bold mb-4'>{pageTitle}</h1>
      <div className='flex items-center space-x-2'>
        <button onClick={() => HandleInsert()} className={ButtonClassNameGreen}>+ QSO</button>
      </div>
      <div className='mx-auto'>
        <div className='mx-auto'>
          <div className='flex flex-col'>
            <div className='overflow-x-auto shadow-md sm:rounded-lg'>
              <div className='inline-block min-w-full align-middle'>
                <div className='overflow-hidden '>
                  <table id='MainDataTable' className={TableStyle1}>
                    <thead className={TableHeadStyle1}>
                      <tr>
                          <th scope='col' className={TableHeading1}>Details</th>
                          <th scope='col' className={TableHeading1}>Date</th>
                          <th scope='col' className={TableHeading1}>Time</th>
                          <th scope='col' className={TableHeading1}>Callsign</th>
                          <th scope='col' className={TableHeading1}>Frequency</th>
                          <th scope='col' className={TableHeading1}>Delete</th>
                      </tr>
                    </thead>
                    <tbody className={TableBodyStyle1}>
                      {conditions.map((condition, index) => (
                        <React.Fragment key={index}>
                          <tr className={`hover:bg-green-100 dark:hover:bg-green-700 ${index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-400' : '' } ${index % 2 === 1 ? 'bg-gray-300 dark:bg-gray-600' : '' }`} >
                            <td className={TableCell1}>                                  
                              <button onClick={() => toggleRow(index)} className={ButtonClassNameBlue}>{expandedRows[index] ? '-' : '+'}</button>
                            </td>
                            <td className={TableCell1}>{new Date(condition.QSO_Date).toLocaleDateString('en-US')}</td>
                            <td className={TableCell1}>{condition.QSO_MTZTime.slice(0, 5)}</td>
                            <td className={TableCell1} onMouseLeave={() => handleCallsignMouseLeave()} onMouseOver={() => handleCallsignMouseOver(condition.QSO_Callsign)}>{condition.QSO_Callsign}</td>                            
                            <td className={TableCell1}>{condition.QSO_Frequency}</td>                            
                            <td className={TableCell1}>
                              <button onClick={() => HandleDelete(condition.QSO_ID)} className={ButtonClassNameRed}>X</button>
                            </td>
                          </tr>
                          <tr>
                          {expandedRows[index] && condition.POTA_QSOs.length > 0 && (
                            <td colspan='3'>
                              <table>
                                <thead className={TableHeadStyle3}>
                                  <th scope='col' className={TableHeading2}>Park Number</th>
                                  <th scope='col' className={TableHeading2}>QSO Type</th>
                                </thead>
                                <tbody className={TableBodyStyle1}>
                                  {condition.POTA_QSOs.map((potaQSO, index2) => (
                                    <tr className={`hover:bg-blue-100 dark:hover:bg-blue-700 ${index2 % 2 === 0 ? 'bg-gray-200 dark:bg-gray-500' : '' }`}>
                                      <td key={potaQSO.POTA_QSO_ID} className={TableCell1} onMouseLeave={() => handleParkNumberMouseLeave()} onMouseOver={() => handleParkNumberMouseOver(potaQSO.POTAPark_ID)}>{potaQSO.POTAPark_ID}</td>
                                      <td key={potaQSO.POTA_QSO_ID} className={TableCell1}>{potaQSO.QSO_Type === '1' ? 'Hunter' : potaQSO.QSO_Type === '2' ? 'Activator' : ''}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          )}                            
                          {expandedRows[index] && (condition.QSO_Received || condition.QSO_Sent || condition.QSO_Notes) && (          
                            <td colspan='3'>
                              <table id='ExpandedRowsTable' className={TableStyle1}>
                                <thead className={TableHeadStyle2}>
                                  <tr>
                                    <th scope='col' className={TableHeading1}>Received</th>
                                    <th scope='col' className={TableHeading1}>Sent</th>
                                    <th scope='col' className={TableHeading1}>Notes</th>
                                  </tr>
                                </thead>
                                <tbody className={TableBodyStyle1}>
                                  <tr>
                                    <td className={TableCell1}>{condition.QSO_Received}</td>
                                    <td className={TableCell1}>{condition.QSO_Sent}</td>
                                    <td className={TableCell1} style={{ whiteSpace: 'pre-wrap' }}>{condition.QSO_Notes}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          )}
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
      <div id='ControlsDiv' className='flex items-center space-x-2'>
        <DeleteConfirmationModal isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={handleUserChoice} />
        <InsertContacts isOpen={showInsertContacts} onClose={() => setShowInsertContacts(false)} onClosed={handleInsertContactsClosed} />
        <QSOsForCallsign callSignToSearchFor={currentCallsign} isOpen={showQSOsForCallsign} displayTime={false} />
        <QSOsForParkNumber parkNumberToSearchFor={currentParkNumber} isOpen={showQSOsForParkNumber} displayTime={false} />
      </div>
    </>
  );  
};

export default Contacts;
