// InsertPOTAQSOs.jsx
import React from 'react';
import { useSelector } from 'react-redux';

const InsertPOTAQSOs = () => {
    const sharedValue = useSelector(state => state.lastInsertID);

    return <div>Shared Value: {sharedValue}</div>;
};

export default InsertPOTAQSOs;
