import React, { useEffect, useRef, useState } from 'react';
import InsertContacts from './InsertContacts';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import QSOsForParkNumber from './QSOsForParkNumber';
import CallsignInfo from './CallsignInfo';
import { getQsos, deleteQso, exportAdif, importAdif } from '../api/hamlog-api';
import type { Contact } from '../types/qso';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
const {
  AppTitle,
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

const Contacts = () => {
  const { user, logout } = useAuth();
  const [conditions, setConditions] = useState<Contact[]>([]);
  const [expandedRows, setExpandedRows] = useState<boolean[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showInsertContacts, setShowInsertContacts] = useState(false);
  const [currentCallsign, setCurrentCallsign] = useState('');
  const [currentQSOId, setCurrentQSOId] = useState<number | null>(null);
  const [showQSOsForParkNumber, setShowQSOsForParkNumber] = useState(false);
  const [currentParkNumber, setCurrentParkNumber] = useState('');
  const [showCallsignInfo, setShowCallsignInfo] = useState(false);


  const fetchData = async () => {
    try {
      const data = await getQsos();
      setConditions(data);
    } catch (err) {
      console.log(err);
    }
  };

  const toggleRow = (index: number) => {
    setExpandedRows((prevRows) => {
      const newRows = [...prevRows];
      newRows[index] = !newRows[index];
      return newRows;
    });
  };

  const HandleDelete = (qsoId: number) => {
    setShowModal(true);
    setCurrentQSOId(qsoId);
  };

  const HandleInsert = () => {
    setShowInsertContacts(true);
  };

  const handleUserChoice = async (choice: string) => {
    if (choice === 'Yes' && currentQSOId !== null) {
      try {
        await deleteQso(currentQSOId);
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

  const handleInsertContactsClosed = () => {
    fetchData();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportAdif();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Check console for details.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importAdif(file);
      alert(`Imported ${result.imported} QSOs`);
      fetchData();
    } catch (err) {
      console.error('Import failed:', err);
      alert('Import failed. Check console for details.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-3xl font-bold'>{AppTitle}</h1>
        <div className='flex items-center space-x-3'>
          <span className='text-sm text-gray-600 dark:text-gray-300 font-mono'>{user?.callsign}</span>
          <button onClick={logout} className={ButtonClassNameRed}>Logout</button>
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        <button onClick={() => HandleInsert()} className={ButtonClassNameGreen}>+ QSO</button>
        <button onClick={handleExport} className={ButtonClassNameBlue}>Export ADIF</button>
        <button onClick={() => fileInputRef.current?.click()} className={ButtonClassNameBlue}>Import ADIF</button>
        <input type='file' ref={fileInputRef} accept='.adi,.adif' onChange={handleImport} className='hidden' />
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
                          <th scope='col' className={TableHeading1}>Mode</th>
                          <th scope='col' className={TableHeading1}>Band</th>
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
                            <td className={TableCell1}>{condition.mode || ''}</td>
                            <td className={TableCell1}>{condition.band || ''}</td>
                            <td className={TableCell1}>
                              <button onClick={() => HandleDelete(condition.QSO_ID)} className={ButtonClassNameRed}>X</button>
                            </td>
                          </tr>
                          <tr>
                          {expandedRows[index] && condition.POTA_QSOs.length > 0 && (
                            <td colSpan={3}>
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
                            <td colSpan={3}>
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
      <div id='ControlsDiv' className='flex flex-col items-center space-x-2'>
        <DeleteConfirmationModal isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={handleUserChoice} />
        <InsertContacts isOpen={showInsertContacts} onClose={() => setShowInsertContacts(false)} onClosed={handleInsertContactsClosed} />
        <CallsignInfo callSignToSearchFor={currentCallsign} isOpen={showCallsignInfo} />
        <QSOsForParkNumber parkNumberToSearchFor={currentParkNumber} isOpen={showQSOsForParkNumber} displayTime={false} />
      </div>
    </>
  );  
};

export default Contacts;
