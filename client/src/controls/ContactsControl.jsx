import React, { useState } from "react";
import Contacts from "../pages/Contacts";
import "../App.css";

const ContactsControl = () => {
  const [activeTab, setActiveTab] = useState(1);

  const handleTabClick = (tabNumber) => {
    setActiveTab(tabNumber);
  };

  return (
    <>
      <Contacts />
    </>
  );
};

export default ContactsControl;

/*
    <div className="container mx-auto mt-8">
      <div className="flex bg-gray-200" style={{ borderRadius: '8px' }}>
        <button className={`flex-1 py-2 px-4 border-b-2 ${activeTab === 1 ? "border-blue-500 text-blue-500 bg-blue-100" : "border-gray-300 text-gray-500"} focus:outline-none`} onClick={() => handleTabClick(1)}>Manage Contacts</button>
      </div>

      <div className="tab-content mt-4">
        {activeTab === 1 && <Contacts />}
      </div>
    </div>
*/