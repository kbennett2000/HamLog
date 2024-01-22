import React, { useState } from 'react';
import axios from 'axios';

const InsertContacts = () => {
  const initialFormData = {
    QSO_Callsign: '',
    QSO_Frequency: '',
    QSO_Notes: '',
    QSO_Received: '',
    QSO_Sent: '',
  };
  
  //const initialPOTAQSOFormData = [{ QSO_ID: '', POTAPark_ID: '', QSO_Type: '' }];
  const initialPOTAQSOFormData = [];

  const [formData, setFormData] = useState(initialFormData);
  const [qsoRecords, setQSORecords] = useState(initialPOTAQSOFormData); // Initial QSO record

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQSOChange = (index, e) => {
    const newQSORecords = [...qsoRecords];
    newQSORecords[index][e.target.name] = e.target.value;
    console.log("e.target.value is " + e.target.value);
    setQSORecords(newQSORecords);
  };

  const addQSORecord = () => {
    setQSORecords([...qsoRecords, { QSO_ID: '', POTAPark_ID: '', QSO_Type: '1' }]);
  };

  function formatDateToMMDDYYYY(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-based
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString();
  
    return `${month}/${day}/${year}`;
  }
  
  function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0'); // Get hours and format with leading zero if needed
    const minutes = now.getMinutes().toString().padStart(2, '0'); // Get minutes and format with leading zero if needed
  
    const currentTime = `${hours}:${minutes}`;
    return currentTime;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    let lastInsertID = "";

    try {
      const requestURL = `http://localhost:7800/Create_Contacts?QSO_Date=${formatDateToMMDDYYYY(new Date())}&QSO_MTZTime=${getCurrentTime()}&QSO_Callsign=${formData.QSO_Callsign}&QSO_Frequency=${formData.QSO_Frequency}&QSO_Notes=${formData.QSO_Notes}&QSO_Received=${formData.QSO_Received}&QSO_Sent=${formData.QSO_Sent}`;
      console.log('requestURL is ' + requestURL);
      await axios.get(requestURL);
      console.log('Contact record inserted successfully');

      try {
        const res = await axios.get("http://localhost:7800/Last_Insert_ID");
        lastInsertID = res.data.LastInsertID[0]['LAST_INSERT_ID()'];
        console.log("LAST INSERT ID IS " + lastInsertID);
      } catch (err) {
        console.log(err);
      }
      
      for (const qsoRecord of qsoRecords) {
        try {
          console.log('qsoRecord.POTAPark_ID is ' + qsoRecord.POTAPark_ID);
          console.log('qsoRecord.QSO_Type is ' + qsoRecord.QSO_Type);
          if (qsoRecord.POTAPark_ID !== '' && qsoRecord.QSO_Type !== '') {
            const requestURL2 = `http://localhost:7800/Create_POTA_QSOs?QSO_ID=${lastInsertID}&POTAPark_ID=${qsoRecord.POTAPark_ID}&QSO_Type=${qsoRecord.QSO_Type}`;
            console.log('requestURL is ' + requestURL2);
            await axios.get(requestURL2);          
            console.log('POTA_QSOs record inserted successfully');
          }
        } catch (err) {
          console.log(err);
        }
      }

      // Clear the form data after successful submission
      setFormData(initialFormData);
      setQSORecords(initialPOTAQSOFormData);
    } catch (error) {
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