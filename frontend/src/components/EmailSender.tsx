import React, { useState } from 'react';
import { api } from '../services/api'; // Assuming your API service handles the request for email
import toast from 'react-hot-toast';

const EmailSender: React.FC = () => {
  const [leadId, setLeadId] = useState(''); // Capture the Lead ID
  const [isLoading, setIsLoading] = useState(false);

  const handleLeadIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeadId(e.target.value); // Update the lead ID state
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId.trim()) {
      toast.error('Please enter a Lead ID');
      return;
    }

    setIsLoading(true);

    try {
      // Send email with the Lead ID
      await api.sendEmail( leadId);

      toast.success(`Successfully sent email for Lead ID: ${leadId}`);
      setLeadId(''); // Clear Lead ID after sending the email
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Send Email Based on Lead ID
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a Lead ID to send an email associated with that lead.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="leadId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lead ID
            </label>
            <input
              type="text"
              id="leadId"
              value={leadId}
              onChange={handleLeadIdChange}
              placeholder="Enter Lead ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!leadId.trim() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? 'Sending...' : 'Send Email'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailSender;
