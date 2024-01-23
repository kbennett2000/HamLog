// Importing necessary modules and hooks from React, axios for HTTP requests, and Redux for state management.
import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';

// Defining a React functional component named InsertContacts.
const InsertContacts = () => {

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

  // useState hook is used to create 'formData' state variable and its updater function 'setFormData'.
  const [formData, setFormData] = useState(initialFormData);

  // useState hook to create 'qsoRecords' state variable and its updater function 'setQSORecords'.
  const [qsoRecords, setQSORecords] = useState(initialPOTAQSOFormData);

  // Function to handle changes in the form input fields, updating 'formData' state.
  const handleChange = (e) => {
    // Merging previous formData with the new value from the changed input field.
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Function to handle changes in QSO records, updating 'qsoRecords' state.
  const handleQSOChange = (index, e) => {
    // Creating a new array from the existing QSO records.
    const newQSORecords = [...qsoRecords];
    // Updating the specific QSO record at the given index.
    newQSORecords[index][e.target.name] = e.target.value;
    // Logging the changed value to the console.
    console.log("e.target.value is " + e.target.value);
    // Updating the 'qsoRecords' state with the modified records.
    setQSORecords(newQSORecords);
  };

  // Function to add a new QSO record to the 'qsoRecords' state.
  const addQSORecord = () => {
    // Adding a new QSO record to the existing records with default values.
    setQSORecords([...qsoRecords, { QSO_ID: '', POTAPark_ID: '', QSO_Type: '1' }]);
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
  
  // Function to handle the form submission.
  const handleSubmit = async (e) => {
    // Preventing the default form submission behavior.
    e.preventDefault();

    // Variable to store the ID of the last inserted record.
    let lastInsertID = "";

    try {
      // Constructing the request URL with query parameters for creating contact records.
      const requestURL = `http://localhost:7800/Create_Contacts?QSO_Date=${formatDateToMMDDYYYY(new Date())}&QSO_MTZTime=${getCurrentTime()}&QSO_Callsign=${formData.QSO_Callsign}&QSO_Frequency=${formData.QSO_Frequency}&QSO_Notes=${formData.QSO_Notes}&QSO_Received=${formData.QSO_Received}&QSO_Sent=${formData.QSO_Sent}`;
      // Logging the request URL to the console.
      console.log('requestURL is ' + requestURL);
      // Making an HTTP GET request to the constructed URL.
      await axios.get(requestURL);
      // Logging a success message to the console.
      console.log('Contact record inserted successfully');

      try {
        // Making an HTTP GET request to get the ID of the last inserted record.
        const res = await axios.get("http://localhost:7800/Last_Insert_ID");
        // Extracting the last insert ID from the response.
        lastInsertID = res.data.LastInsertID[0]['LAST_INSERT_ID()'];
        // Logging the last insert ID to the console.
        console.log("LAST INSERT ID IS " + lastInsertID);

        // Dispatching an action to Redux to update the state with the last insert ID.
        dispatch({ type: 'SET_LAST_INSERT_ID', payload: lastInsertID });

      } catch (err) {
        // Logging any errors that occur during the request.
        console.log(err);
      }
      
      // Looping through each QSO record in the state.
      for (const qsoRecord of qsoRecords) {
        try {
          // Logging the QSO record details to the console.
          console.log('qsoRecord.POTAPark_ID is ' + qsoRecord.POTAPark_ID);
          console.log('qsoRecord.QSO_Type is ' + qsoRecord.QSO_Type);
          // Checking if the QSO record has necessary data before making a request.
          if (qsoRecord.POTAPark_ID !== '' && qsoRecord.QSO_Type !== '') {
            // Constructing the request URL for creating POTA QSOs.
            const requestURL2 = `http://localhost:7800/Create_POTA_QSOs?QSO_ID=${lastInsertID}&POTAPark_ID=${qsoRecord.POTAPark_ID}&QSO_Type=${qsoRecord.QSO_Type}`;
            // Logging the request URL to the console.
            console.log('requestURL is ' + requestURL2);
            // Making an HTTP GET request to the constructed URL.
            await axios.get(requestURL2);
            // Logging a success message to the console.
            console.log('POTA_QSOs record inserted successfully');
          }
        } catch (err) {
          // Logging any errors that occur during the request.
          console.log(err);
        }
      }

      // Clearing the form data after successful submission by resetting to initial state.
      setFormData(initialFormData);
      setQSORecords(initialPOTAQSOFormData);
    } catch (error) {
      // Logging any errors that occur during the form submission.
      console.error('Error inserting record:', error);
    }
  };

  return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8 shadow-md p-6 bg-white rounded-md">
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="QSO_Callsign">Callsign:</label>
                <input type="text" name="QSO_Callsign" value={formData.QSO_Callsign} onChange={handleChange} className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500" autoFocus />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="QSO_Frequency">Frequency:</label>
                <input type="text" name="QSO_Frequency" value={formData.QSO_Frequency} onChange={handleChange} className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"/>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="QSO_Notes">Notes:</label>
                <input type="text" name="QSO_Notes" value={formData.QSO_Notes} onChange={handleChange} className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"/>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="QSO_Received">Received:</label>
                <input type="text" name="QSO_Received" value={formData.QSO_Received} onChange={handleChange} className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"/>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="QSO_Sent">Sent:</label>
                <input type="text" name="QSO_Sent" value={formData.QSO_Sent} onChange={handleChange} className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"/>
            </div>

            <button type="button" onClick={addQSORecord} className="bg-green-500 text-white p-3 rounded-md focus:outline-none hover:bg-green-700">Add POTA Park(s)</button>

            {qsoRecords.map((qso, index) => (
              <div key={index} className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`POTAPark_ID_${index}`}>POTA Park ID:</label>
                  <input type="text" name="POTAPark_ID" id={`POTAPark_ID_${index}`} value={qso.POTAPark_ID} onChange={(e) => handleQSOChange(index, e)} className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={`QSO_Type_${index}`}>QSO Type:</label>
                  <select name="QSO_Type" id={`QSO_Type_${index}`} value={qso.QSO_Type} onChange={(e) => handleQSOChange(index, e)} className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500">
                    <option value="1">Hunter</option>
                    <option value="2">Activator</option>
                  </select>
                </div>
              </div>
              ))}

            <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded-md focus:outline-none hover:bg-blue-700">Insert Contact</button>
        </form>
    );
};

export default InsertContacts;