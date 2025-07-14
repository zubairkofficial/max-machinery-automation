import React, { useState } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const PhoneNumberDeletion: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationPhone, setConfirmationPhone] = useState('');

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters except + for international numbers
    const cleaned = e.target.value.replace(/[^\d+]/g, '');
    setPhoneNumber(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    setConfirmationPhone(phoneNumber);
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    try {
      const result = await api.deleteByPhoneNumber(confirmationPhone);
      
      if (result.deletedCount > 0) {
        toast.success(`Successfully deleted ${result.deletedCount} leads from Zoho CRM with phone number: ${confirmationPhone}`);
        setPhoneNumber('');
        setShowConfirmation(false);
        setConfirmationPhone('');
      } else {
        toast.info(result.message);
        setShowConfirmation(false);
        setConfirmationPhone('');
      }
    } catch (error: any) {
      console.error('Error deleting leads:', error);
      toast.error(error.response?.data?.message || 'Failed to delete leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setConfirmationPhone('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Delete Leads by Phone Number
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a phone number to delete all leads from Zoho CRM associated with that number.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="Enter phone number (e.g., +1234567890)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Format: +1234567890 or 1234567890
            </p>
          </div>

          <button
            type="submit"
            disabled={!phoneNumber.trim() || isLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {isLoading ? 'Processing...' : 'Delete Leads'}
          </button>
        </form>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Confirm Deletion
                  </h3>
                </div>
              </div>
              
              <div className="mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete all leads from Zoho CRM with phone number:
          </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {confirmationPhone}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneNumberDeletion; 