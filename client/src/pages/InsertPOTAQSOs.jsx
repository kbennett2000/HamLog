// InsertPOTAQSOs.jsx
import React from 'react';
import { useSelector } from 'react-redux';

const InsertPOTAQSOs = () => {
    const redux_LastInsertID = useSelector(state => state.lastInsertID);
    return <div>Shared Value: {redux_LastInsertID}</div>;
};

export default InsertPOTAQSOs;
