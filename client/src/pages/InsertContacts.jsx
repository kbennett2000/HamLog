// Importing necessary modules and hooks from React, axios for HTTP requests, and Redux for state management.
import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import QSOsForCallsign from './QSOsForCallsign';
import QSOsForParkNumber from './QSOsForParkNumber';
import config from '../config';
const { InputBoxClassName, ButtonClassNameBlue, ButtonClassNameGreen, InputLabel1 } = config;
// The number of Contest QSOs recorded for this Contact record 
let contestQSOCounter = 0;
// The maximum number of Contest QSOs that can be recorded for this Contact record
let contestQSOLimit = 1;

// Defining a React functional component named InsertContacts.
const InsertContacts = ({ isOpen, onClose, onClosed }) => {
  const [showQSOsForCallsign, setShowQSOsForCallsign] = useState(false);
  const [currentCallsign, setCurrentCallsign] = useState([]);
  const [showQSOsForParkNumber, setShowQSOsForParkNumber] = useState(false);
  const [currentParkNumber, setCurrentParkNumber] = useState([]);

  // useDispatch hook from Redux is used to dispatch actions, mainly used here for updating the global state.
  const dispatch = useDispatch();

  // Defining the initial state for the form data with all fields initialized as empty strings.
  const initialFormData = {
    QSO_Callsign: '',
    QSO_Frequency: '',
    QSO_Notes: '',
    QSO_Received: '',
    QSO_Sent: '',
  };
  
  // Initializing an array to hold POTA QSO form data, initially empty.
  const initialPOTAQSOFormData = [];

  // Initializing an array to hold Contest QSO form data, initially empty.
  const initialContestQSOFormData = [];

  // useState hook is used to create 'formData' state variable and its updater function 'setFormData'.
  const [formData, setFormData] = useState(initialFormData);

  // useState hook to create 'qsoRecords' state variable and its updater function 'setQSORecords'.
  const [qsoRecords, setQSORecords] = useState(initialPOTAQSOFormData);

  // useState hook to create 'contestRecords' state variable and its updater function 'setContestRecords'.
  const [contestRecords, setContestRecords] = useState(initialContestQSOFormData);

  // Function to handle changes in the form input fields, updating 'formData' state.
  const handleChange = (e) => {
    // Merging previous formData with the new value from the changed input field.
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Function to handle changes in the form Callsign input field, updating 'formData' state and setting the currentCallsign value.
  const handleCallsignChange = (e) => {
    // Merging previous formData with the new value from the changed input field.
    setFormData({ ...formData, [e.target.name]: e.target.value.toUpperCase() });
  };
  
  // Function to handle changes in QSO records, updating 'qsoRecords' state.
  const handleQSOChange = (index, e) => {
    // Creating a new array from the existing QSO records.
    const newQSORecords = [...qsoRecords];
    // Updating the specific QSO record at the given index.
    newQSORecords[index][e.target.name] = e.target.value;
    // Updating the 'qsoRecords' state with the modified records.
    setQSORecords(newQSORecords);
  };

  // Function to handle changes in QSO records, updating 'qsoRecords' state.
  const handleQSOPOTAIDChange = (index, e) => {
    // Creating a new array from the existing QSO records.
    const newQSORecords = [...qsoRecords];
    // Updating the specific QSO record at the given index.
    newQSORecords[index][e.target.name] = e.target.value.toUpperCase();
    // Updating the 'qsoRecords' state with the modified records.
    setQSORecords(newQSORecords);
  };
    
  // Function to handle changes in Contest records, updating 'contestRecords' state.
  const handleContestChange = (index, e) => {
    // Creating a new array from the existing Contest records.
    const newContestRecords = [...contestRecords];
    // Updating the specific Contest record at the given index.
    newContestRecords[index][e.target.name] = e.target.value;
    // Updating the 'contestRecords' state with the modified records.
    setQSORecords(newContestRecords);
  };

  // Function to add a new QSO record to the 'qsoRecords' state.
  const addQSORecord = () => {
    // Adding a new QSO record to the existing records with default values.
    setQSORecords([...qsoRecords, { QSO_ID: '', POTAPark_ID: '', QSO_Type: '1' }]);
  };

  // Function to add a new Contest record to the 'contestRecords' state.
  const addContestRecord = () => {
    // Ensure only the maximum number (contestQSOLimit) of Content QSO records can be entered
    if (contestQSOCounter < contestQSOLimit) {
      contestQSOCounter++;
      // Adding a new Contest record to the existing records with default values.
      setContestRecords([...contestRecords, { QSO_ID: '', Contest_ID: '', Contest_QSO_Number: '', Contest_QSO_Exchange_Data: '', }]);
    }
  };
  
  // Function to format a JavaScript Date object into a string in MM/DD/YYYY format.
  function formatDateToMMDDYYYY(date) {
    // Getting the month, adding 1 as JavaScript Date months are 0-based, and formatting with a leading zero if needed.
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // Getting the day and formatting with a leading zero if needed.
    const day = date.getDate().toString().padStart(2, '0');
    // Getting the full year as a string.
    const year = date.getFullYear().toString();
  
    // Returning the formatted date string.
    return `${month}/${day}/${year}`;
  }
  
  // Function to get the current time in HH:MM format.
  function getCurrentTime() {
    // Creating a new Date object to get the current time.
    const now = new Date();
    // Getting the hours, converting to string, and formatting with a leading zero if needed.
    const hours = now.getHours().toString().padStart(2, '0');
    // Getting the minutes, converting to string, and formatting with a leading zero if needed.
    const minutes = now.getMinutes().toString().padStart(2, '0');
  
    // Returning the current time string.
    const currentTime = `${hours}:${minutes}`;
    return currentTime;
  }

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

  const handleClose = () => {
    setFormData(initialFormData);
    setQSORecords(initialPOTAQSOFormData);
    setContestRecords(initialContestQSOFormData);
    onClose();
  }

  // Function to handle the form submission.
  const handleSubmit = async (e) => {
    // Preventing the default form submission behavior.
    e.preventDefault();

    // Check if Callsign and Frequency fields are blank
    if (!formData.QSO_Callsign.trim() || !formData.QSO_Frequency.trim()) {
      // Alerting the user that Callsign and Frequency fields cannot be blank
      alert("Callsign and Frequency fields cannot be blank.");
      // Returning early from the function to prevent form submission
      return;    
    }
    
    // Split the callsigns by commas
    const callsignsToAdd = formData.QSO_Callsign.split(",");
    // Array for Contacts Insert queries to run
    const insertQueries = [];
    // Array holding Last Insert IDs to be used for POTA and Contest records
    const qsosToAdd = [];

    // For each callsign
    callsignsToAdd.map(callsign => {
      // Populate query array for new Contacts records
      insertQueries.push(`http://localhost:7800/Create_Contacts?QSO_Date=${formatDateToMMDDYYYY(new Date())}&QSO_MTZTime=${getCurrentTime()}&QSO_Callsign=${callsign.trim()}&QSO_Frequency=${formData.QSO_Frequency}&QSO_Notes=${formData.QSO_Notes}&QSO_Received=${formData.QSO_Received}&QSO_Sent=${formData.QSO_Sent}`);
      return callsign; // The map function expects a return value for each element.
    });

    // For each Contacts record to insert
    for(const insertQuery of insertQueries) {
      // Execute Contacts Insert query
      // Making an HTTP GET request to the constructed URL.
      await axios.get(insertQuery);  
      // Get Last Insert ID
      try {
        // Making an HTTP GET request to get the ID of the last inserted record.
        const res = await axios.get("http://localhost:7800/Last_Insert_ID");
        // Add Last Insert ID to ID array
        // Extracting the last insert ID from the response.        
        qsosToAdd.push(res.data.LastInsertID[0]['LAST_INSERT_ID()']);
      } catch (err) {
        // Logging any errors that occur during the request.
        console.log(err);
      }
    }

    // Add POTA QSOs
    for(const qsoID of qsosToAdd) {
      // Looping through each QSO record in the state.
      for (const qsoRecord of qsoRecords) {
        try {
          // Checking if the QSO record has necessary data before making a request.
          if (qsoRecord.POTAPark_ID && qsoRecord.QSO_Type) {
            // Constructing the request URL for creating POTA QSOs.
            const requestURL2 = `http://localhost:7800/Create_POTA_QSOs?QSO_ID=${qsoID}&POTAPark_ID=${qsoRecord.POTAPark_ID}&QSO_Type=${qsoRecord.QSO_Type}`;
            // Making an HTTP GET request to the constructed URL.
            await axios.get(requestURL2);
          }
        } catch (err) {
          // Logging any errors that occur during the request.
          console.log(err);
        }
      }  
    }

    // Add Contest QSOs
    for(const qsoID of qsosToAdd) {
      // Looping through each QSO record in the state.
      for (const contestRecord of contestRecords) {

        try {
          // Checking if the Contest record has necessary data before making a request.
          if (contestRecord.Contest_ID) {
            // Constructing the request URL for creating Contest QSOs.
            const requestURL3 = `http://localhost:7800/Create_Contest_QSOs?QSO_ID=${qsoID}&Contest_ID=${contestRecord.Contest_ID}&Contest_QSO_Number=${contestRecord.Contest_QSO_Number}&Contest_QSO_Exchange_Data=${contestRecord.Contest_QSO_Exchange_Data}`;
            // Making an HTTP GET request to the constructed URL.              
            await axios.get(requestURL3);
          }
        } catch (err) {
          // Logging any errors that occur during the request.
          console.log(err);
        }        
        
      }  
    }

    // Clearing the form data after successful submission by resetting to initial state.
    setFormData(initialFormData);
    setQSORecords(initialPOTAQSOFormData);
    setContestRecords(initialContestQSOFormData);
    onClose();
    onClosed();
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          {/* Close button positioned in the top right corner */}
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold">Add QSO</h2>
            <button onClick={handleClose} className="text-xl rounded-full p-2 hover:bg-gray-200">
              &times; {/* This is a simple way to create a close (×) button */}
            </button>
          </div>
          <div className="mt-1 text-center">
            <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-2 shadow-md p-2 bg-white rounded-md">
            <div className="flex space-x-2 mb-4">
              <div>
                <label className={InputLabel1} htmlFor="QSO_Callsign">Callsign:</label>
                <input type="text" name="QSO_Callsign" value={formData.QSO_Callsign} onChange={handleCallsignChange} className={InputBoxClassName} autoFocus onMouseLeave={() => handleCallsignMouseLeave()} onMouseOver={(e) => handleCallsignMouseOver(e.target.value)}/>
              </div>
              <div>
                <label className={InputLabel1} htmlFor="QSO_Frequency">Frequency:</label>
                <input type="text" name="QSO_Frequency" value={formData.QSO_Frequency} onChange={handleChange} className={InputBoxClassName}/>
              </div>
            </div>
                <div className="flex space-x-2 mb-4">
                  <div>
                    <label className={InputLabel1} htmlFor="QSO_Received">Received:</label>
                    <input type="text" name="QSO_Received" value={formData.QSO_Received} onChange={handleChange} className={InputBoxClassName}/>
                  </div>
                  <div>
                    <label className={InputLabel1} htmlFor="QSO_Sent">Sent:</label>
                    <input type="text" name="QSO_Sent" value={formData.QSO_Sent} onChange={handleChange} className={InputBoxClassName}/>
                  </div>
                </div>
                <div className="mb-4">
                    <label className={InputLabel1} htmlFor="QSO_Notes">Notes:</label>
                    <input type="text" name="QSO_Notes" value={formData.QSO_Notes} onChange={handleChange} className={InputBoxClassName}/>
                </div>                
                {qsoRecords.map((qso, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex-1">
                      <label className={InputLabel1} htmlFor={`POTAPark_ID_${index}`}>POTA Park ID:</label>
                      <input type="text" name="POTAPark_ID" id={`POTAPark_ID_${index}`} value={qso.POTAPark_ID} onChange={(e) => handleQSOPOTAIDChange(index, e)} className={InputBoxClassName} onMouseLeave={() => handleParkNumberMouseLeave()} onMouseOver={(e) => handleParkNumberMouseOver(e.target.value)}/>
                    </div>
                    <div className="flex-1">
                      <label className={InputLabel1} htmlFor={`QSO_Type_${index}`}>QSO Type:</label>
                      <select name="QSO_Type" id={`QSO_Type_${index}`} value={qso.QSO_Type} onChange={(e) => handleQSOChange(index, e)} className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500">
                        <option value="1">Hunter</option>
                        <option value="2">Activator</option>
                      </select>
                    </div>
                  </div>
                  ))}
                {contestRecords.map((contest, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex-1">
                      <label className={InputLabel1} htmlFor={`Contest_ID_${index}`}>Contest ID:</label>
                      <input type="text" name="Contest_ID" id={`Contest_ID_${index}`} value={contest.Contest_ID} onChange={(e) => handleContestChange(index, e)} className={InputBoxClassName} />
                    </div>
                    <div className="flex-1">
                      <label className={InputLabel1} htmlFor={`Contest_QSO_Number_${index}`}>QSO No:</label>
                      <input type="text" name="Contest_QSO_Number" id={`Contest_QSO_Number_${index}`} value={contest.Contest_QSO_Number} onChange={(e) => handleContestChange(index, e)} className={InputBoxClassName} />
                    </div>
                    <div className="flex-1">
                      <label className={InputLabel1} htmlFor={`Contest_QSO_Exchange_Data_${index}`}>Exchange:</label>
                      <input type="text" name="Contest_QSO_Exchange_Data" id={`Contest_QSO_Exchange_Data_${index}`} value={contest.Contest_QSO_Exchange_Data} onChange={(e) => handleContestChange(index, e)} className={InputBoxClassName} />
                    </div>
                  </div>
                  ))}
              {/* Flex container for buttons */}
              <div className="flex justify-center space-x-4 mb-4">
                <button type="button" onClick={addQSORecord} className={ButtonClassNameGreen}>+ POTA</button>
                <button type="button" onClick={addContestRecord} className={ButtonClassNameGreen}>+ Contest</button>
              </div>
              <button type="submit" className={ButtonClassNameBlue}>Add QSO</button>
            </form>
          </div>
        </div>
        <QSOsForCallsign callSignToSearchFor={currentCallsign} isOpen={showQSOsForCallsign} />
        <QSOsForParkNumber parkNumberToSearchFor={currentParkNumber} isOpen={showQSOsForParkNumber} />
      </div>
    );
};

export default InsertContacts;