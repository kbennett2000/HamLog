import React from 'react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full' id='my-modal'>
      <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
        <div className='mt-3 text-center'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>Confirm Deletion</h3>
          <div className='mt-2 px-7 py-3'>
            <p className='text-sm text-gray-500'>Are you sure you want to delete this item?</p>
          </div>
          <div className='items-center px-4 py-3'>
            <button
              id='delete-btn'
              className='px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50'
              onClick={() => onConfirm('Yes')}
            >
              Yes
            </button>
            <button
              id='cancel-btn'
              className='px-4 py-2 ml-3 bg-gray-500 text-white text-base font-medium rounded-md w-24 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50'
              onClick={() => onClose()}
            >
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
