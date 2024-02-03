import React, { useEffect, useState } from "react";
import axios from "axios";
import config from '../config';
const { InputBoxClassName, ButtonClassNameBlue, ButtonClassNameGreen, ButtonClassNameRed } = config;
let dataEndpointLocation = "";

const QSOsForCallsign = ({ callSignToSearchFor }) => {
  const [conditions, setConditions] = useState([]);

  dataEndpointLocation=`http://localhost:7800/Get_Contacts_for_Callsign?QSO_Callsign=${callSignToSearchFor}`;

  const fetchData = async () => {
    try {
      const res = await axios.get(dataEndpointLocation);
      // Check if the response is an array, otherwise set to an empty array
      setConditions(Array.isArray(res.data.Contacts) ? res.data.Contacts : []);
    } catch (err) {
      console.log(err);
      setConditions([]); // Set to an empty array in case of an error
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">QSOs with xxx</h1>
      <div className="mx-auto">
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
                          <th scope="col" className="py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-300 uppercase dark:text-gray-100">Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {conditions.map((condition, index) => (
                        <React.Fragment key={index}>
                          <tr className={`hover:bg-green-100 dark:hover:bg-green-700 ${index % 2 === 0 ? "bg-gray-100 dark:bg-gray-400" : "" } ${index % 2 === 1 ? "bg-gray-300 dark:bg-gray-600" : "" }`} >
                            <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{new Date(condition.QSO_Date).toLocaleDateString("en-US")}</td>
                            <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{condition.QSO_MTZTime}</td>                            
                            <td className="py-4 px-6 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{condition.QSO_Frequency + ' MHz'}</td>
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
    </>
  );
};

export default QSOsForCallsign;
