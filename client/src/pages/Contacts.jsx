import React, { useEffect, useState } from "react";
import axios from "axios";

const dataEndpointLocation = "http://localhost:7800/getContactsAndPOTAQSOs";
const pageTitle = "Manage Contacts";

const Contacts = () => {
  const [conditions, setConditions] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentQSOId, setCurrentQSOId] = useState(null);

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

  const handleUserChoice = async (choice) => {
    if (choice === "Yes") {
      // Delete the record
      try {        
        // Constructing the request URL with query parameters for creating contact records.
        const requestURL = `http://localhost:7800/Delete_Contacts?QSO_ID=${currentQSOId}`;
        // Logging the request URL to the console.
        console.log('requestURL is ' + requestURL);
        // Making an HTTP GET request to the constructed URL.
        await axios.get(requestURL);
        // Logging a success message to the console.
        console.log('Contact record deleted successfully');        
        fetchData();
      } catch (error) {
        // Logging any errors that occur during the form submission.
        console.error('Error deleting record:', error);
      }
    } else if (choice === "No") {
      // Do Nothing
    } else {
      // Do nothing
    }    
    setShowModal(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">{pageTitle}</h1>
      <div className="mx-auto">
            <div className="mx-auto">
              <div className="flex flex-col">
                <div className="overflow-x-auto shadow-md sm:rounded-lg">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden ">
                      <table className="min-w-full divide-y divide-gray-200 table-fixed dark:divide-gray-700">
                        <thead className="bg-blue-600 dark:bg-blue-900">
                          <tr>
                              <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">EXPAND</th>
                              <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Date</th>
                              <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Mountain Time</th>
                              <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Callsign</th>
                              <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Frequency</th>
                              <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">DELETE</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                          {conditions.map((condition, index) => (
                            <React.Fragment key={index}>
                              <tr className={`hover:bg-green-100 dark:hover:bg-green-700 ${index % 2 === 0 ? "bg-gray-100 dark:bg-gray-400" : "" } ${index % 2 === 1 ? "bg-gray-300 dark:bg-gray-600" : "" }`} >
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">                                  
                                  <button onClick={() => toggleRow(index)} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">+</button>
                                </td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{new Date(condition.QSO_Date).toLocaleDateString("en-US")}</td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{condition.QSO_MTZTime}</td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{condition.QSO_Callsign}</td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{condition.QSO_Frequency + ' MHz'}</td>
                                <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                  <button onClick={() => HandleDelete(condition.QSO_ID)} class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">X</button>
                                </td>
                              </tr>
                              {expandedRows[index] && (
                                <tr key={condition.QSO_ID}>
                                  <td colSpan="12" className="p-4">
                                    <table className="min-w-full divide-y divide-gray-200 table-fixed dark:divide-gray-700">
                                      <thead className="bg-green-600 dark:bg-green-900">
                                        <tr>
                                          <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Received</th>
                                          <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Sent</th>
                                          <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Notes</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                        <tr>
                                          <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{condition.QSO_Received}</td>
                                          <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{condition.QSO_Sent}</td>
                                          <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white" style={{ whiteSpace: 'pre-wrap' }}>{condition.QSO_Notes}</td>
                                        </tr>
                                          {condition.POTA_QSOs.length > 0 && (
                                            <>
                                              <table>
                                                <thead className="bg-blue-500 dark:bg-blue-800">
                                                  <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-900 uppercase dark:text-gray-100">Park Number</th>
                                                  <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-900 uppercase dark:text-gray-100">QSO Type</th>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                                  {condition.POTA_QSOs.map((potaQSO, index2) => (
                                                    <tr className={`hover:bg-blue-100 dark:hover:bg-blue-700 ${index2 % 2 === 0 ? "bg-gray-200 dark:bg-gray-500" : "" }`}>
                                                      <td key={potaQSO.POTA_QSO_ID} className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{potaQSO.POTAPark_ID}</td>
                                                      <td key={potaQSO.POTA_QSO_ID} className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{potaQSO.QSO_Type === "1" ? "Hunter" : potaQSO.QSO_Type === "2" ? "Activator" : ""}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </>
                                          )}           
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
          

        {/* Conditional rendering for Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Deletion</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">Are you sure you want to delete this item?</p>
                </div>
                <div className="items-center px-4 py-3">
                  <button id="delete-btn" className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50" onClick={() => handleUserChoice("Yes")}>
                    Yes
                  </button>
                  <button id="cancel-btn" className="px-4 py-2 ml-3 bg-gray-500 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50" onClick={() => handleUserChoice("No")}>
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Contacts;
