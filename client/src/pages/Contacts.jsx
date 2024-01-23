// Importing React, useEffect, and useState hooks from 'react' and axios for making HTTP requests.
import React, { useEffect, useState } from "react";
import axios from "axios";

// Constant string holding the API endpoint URL for data fetching.
const dataEndpointLocation = "http://localhost:7800/getContactsAndPOTAQSOs";

// Constant string defining the page title.
const pageTitle = "Manage Contacts";

// Contacts component definition using arrow function syntax.
const Contacts = () => {
  // Using useState hook to create 'conditions' state variable with initial empty array.
  const [conditions, setConditions] = useState([]);

  // Using useState to create 'expandedRows' state variable to track which rows are expanded, initially an empty array.
  const [expandedRows, setExpandedRows] = useState([]);

  // fetchData is an asynchronous function to fetch data from the server.
  const fetchData = async () => {
    try {
      // Using axios to make a GET request to the data endpoint.
      const res = await axios.get(dataEndpointLocation);
      
      // Updating the 'conditions' state with the fetched data.
      setConditions(res.data);
    } catch (err) {
      // Logging errors to the console if the request fails.
      console.log(err);
    }
  };

  // useEffect hook to perform side effects in the component.
  useEffect(() => {
    fetchData(); // Calling fetchData when the component mounts.

    // Setting up an interval to refresh data every minute (60000 milliseconds).
    const interval = setInterval(fetchData, 1 * 60 * 1000);

    // Cleanup function to clear the interval when the component unmounts.
    return () => clearInterval(interval);
  }, []); // Empty dependency array ensures this effect runs only once after the initial render.

  // toggleRow function updates the 'expandedRows' state to show or hide additional row details.
  const toggleRow = (index) => {
    setExpandedRows((prevRows) => {
      const newRows = [...prevRows];
      newRows[index] = !newRows[index];
      return newRows;
    });
  };

  // Render function returning JSX for the Contacts component.
  return (
    <>
      <h1 className="text-3xl font-bold mb-4">{pageTitle}</h1>
      <div className="mx-auto">
        <div className="flex flex-col">
          <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden ">
                <table className="min-w-full divide-y divide-gray-200 table-fixed dark:divide-gray-700">
                  <thead className="bg-blue-600 dark:bg-blue-900">
                    <tr>
                        <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Date</th>
                        <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Mountain Time</th>
                        <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Callsign</th>
                        <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Frequency</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {conditions.map((condition, index) => (
                      <React.Fragment key={index}>
                        <tr className={`hover:bg-green-100 dark:hover:bg-green-700 ${index % 2 === 0 ? "bg-gray-100 dark:bg-gray-400" : "" } ${index % 2 === 1 ? "bg-gray-300 dark:bg-gray-600" : "" }`} onClick={() => toggleRow(index)}>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{new Date(condition.QSO_Date).toLocaleDateString("en-US")}</td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{condition.QSO_MTZTime}</td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{condition.QSO_Callsign}</td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{condition.QSO_Frequency + ' MHz'}</td>
                        </tr>
                        {expandedRows[index] && (
                          <tr key={condition.QSO_ID}>
                            <td colspan="12" className="p-4">
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
    </>
  );  
};

export default Contacts;