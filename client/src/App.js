import React, { useState } from "react";
import ContactsControl from "./controls/ContactsControl";
import "./App.css";

const App = () => {
  const [activeTab, setActiveTab] = useState(1);

  const handleTabClick = (tabNumber) => {
    setActiveTab(tabNumber);
  };

  return (
    <ContactsControl />
  );
};

export default App;


/*
    <div className="container mx-auto mt-8">
      <div className="flex bg-gray-100" style={{ borderRadius: '8px' }}>
        <button className={`flex-1 py-2 px-4 border-b-2 ${activeTab === 1 ? "border-blue-500 text-blue-500 bg-blue-50" : "border-gray-300 text-gray-500"} focus:outline-none`} onClick={() => handleTabClick(1)}>Contacts</button>
      </div>

      <div className="tab-content mt-4">
        {activeTab === 1 && <ContactsControl />}
      </div>
    </div>
*/