import React, { useState, useEffect } from 'react';
import { api, Lead } from '../services/api'; // Assuming your API service handles the request for email
import toast from 'react-hot-toast';

const EmailSender: React.FC = () => {
  const [leadId, setLeadId] = useState(''); // Capture the Lead ID
  const [leads, setLeads] = useState<Lead[]>([]); // Store the list of leads
    const [isSending, setIsSending] = useState(false); // Track if email is sending

  // Fetch all leads when the component is mounted
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await api.getAll(1, 10); // Adjust the parameters as needed
        setLeads(response.data);
      } catch (error) {
        console.error('Error fetching leads:', error);
        toast.error('Failed to fetch leads');
      }
    };

    fetchLeads();
  }, []);

  const handleLeadIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLeadId(e.target.value); // Update the lead ID state when the user selects a lead
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId.trim()) {
      toast.error('Please select a Lead ID');
      return;
    }

    setIsSending(true);

    try {
      // Send email with the selected Lead ID
      await api.sendEmail(leadId);

      toast.success(`Successfully sent email for Lead ID: ${leadId}`);
      setLeadId(''); // Clear Lead ID after sending the email
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsSending(false);
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
            Select a Lead ID to send an email associated with that lead.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="leadId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lead ID
            </label>
            <select
              id="leadId"
              value={leadId}
              onChange={handleLeadIdChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isSending}
            >
              <option value="">Select Lead</option>
              {leads.map((lead: { id: string; firstName: string }) => (
                <option key={lead.id} value={lead.id}>
                  {lead.firstName} 
                  {/* (ID: {lead.id}) */}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!leadId.trim() || isSending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailSender;
