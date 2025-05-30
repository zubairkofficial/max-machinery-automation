import React, { useState } from 'react';
import { FaPhone, FaSpinner, FaClock } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';

interface LeadCallSchedulerProps {
  leadId?: string;
  onCallComplete?: (result: any) => void;
}

const LeadCallScheduler: React.FC<LeadCallSchedulerProps> = ({ 
  leadId,
  onCallComplete 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>(leadId ? [leadId] : []);
  const [callAllLeads, setCallAllLeads] = useState(false);
  const [callPriorityLeads, setCallPriorityLeads] = useState(false);
  const [fromNumber, setFromNumber] = useState("+1415843-6193");
  const [callResults, setCallResults] = useState<any | null>(null);
  const [showScheduleOptions, setShowScheduleOptions] = useState(true); // Default to true as per requirements
  const [scheduledTime, setScheduledTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timeError, setTimeError] = useState<string | null>(null);
  const { theme } = useTheme();

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Add 5 minutes to current time
    return now.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
  };

  const validateTimes = () => {
    setTimeError(null);
    
    if (!scheduledTime) {
      setTimeError("Start time is required");
      return false;
    }
    
    const startDate = new Date(scheduledTime);
    const now = new Date();
    
    // Ensure start time is in the future
    if (startDate <= now) {
      setTimeError("Start time must be in the future");
      return false;
    }
    
    // If end time is provided, validate it
    if (endTime) {
      const endDate = new Date(endTime);
      
      // Ensure end time is after start time
      if (endDate <= startDate) {
        setTimeError("End time must be after start time");
        return false;
      }
    }
    
    return true;
  };

  const handleScheduleCalls = async () => {
    try {
      // Validate times if scheduling is enabled
      if (showScheduleOptions && !validateTimes()) {
        return;
      }
      
      setLoading(true);
      setError(null);
      setCallResults(null);

      // Construct request payload
      const payload: any = {
        leadIds: selectedLeads.length > 0 ? selectedLeads : undefined,
        allLeads: true,
        fromNumber
      };

      // Add scheduled time if set
      if (showScheduleOptions && scheduledTime) {
        payload.startTime = new Date(scheduledTime).toISOString();
        if (endTime) {
          payload.endTime = new Date(endTime).toISOString();
        }
      }

      // Make API call
      const response = await api.scheduleLeadCalls(payload);
      setCallResults(response);

      // if (onCallComplete) {
      //   onCallComplete(response);
      // }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Failed to schedule calls");
      } else {
        setError("Failed to schedule calls");
      }
      console.error("Error scheduling calls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleCall = async (id: string) => {
    if (!id) return;
    
    try {
      // Validate times if scheduling is enabled
      if (showScheduleOptions && !validateTimes()) {
        return;
      }
      
      setLoading(true);
      setError(null);
      setCallResults(null);

      const payload: any = { fromNumber, leadId: id };
      
      // Add scheduled time if set
      if (showScheduleOptions && scheduledTime) {
        payload.startTime = new Date(scheduledTime).toISOString();
        if (endTime) {
          payload.endTime = new Date(endTime).toISOString();
        }
      }

      const response = await api.callSingleLead(id, payload);
      setCallResults(response);

      if (onCallComplete) {
        onCallComplete(response);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Failed to make call");
      } else {
        setError("Failed to make call");
      }
      console.error("Error making call:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {leadId ? "Call This Lead" : "Schedule Calls to Leads"}
      </h3>
      
      {leadId ? (
        // Single lead call UI
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Call this lead using RetellAI integration
          </p>
          
          <div>
            <label htmlFor="fromNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              From Number
            </label>
            <input
              type="text"
              id="fromNumber"
              value={fromNumber}
              disabled={true}
              onChange={(e) => setFromNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule Call
            </h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Time*
                </label>
                <input
                  type="datetime-local"
                  id="scheduleTime"
                  value={scheduledTime || ''}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={getCurrentDateTime()}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={endTime || ''}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={scheduledTime || getCurrentDateTime()}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
          
          {timeError && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {timeError}
            </div>
          )}
          
          <button
            type="button"
            onClick={() => handleSingleCall(leadId)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Scheduling...
              </>
            ) : (
              <>
                <FaClock className="-ml-1 mr-2 h-4 w-4" />
                Schedule Call
              </>
            )}
          </button>
        </div>
      ) : (
        // Batch calling UI
        <div className="space-y-4">
          <div>
            <label htmlFor="fromNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              From Number
            </label>
            <input
              type="text"
              id="fromNumber"
              disabled={true}
              value={fromNumber}
              onChange={(e) => setFromNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule for Later
            </h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Time*
                </label>
                <input
                  type="datetime-local"
                  id="scheduleTime"
                  value={scheduledTime || ''}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={getCurrentDateTime()}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={endTime || ''}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={scheduledTime || getCurrentDateTime()}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
          
          {timeError && (
            <div className="text-sm text-red-600 dark:text-red-400 mb-4">
              {timeError}
            </div>
          )}
          
          <button
            type="button"
            onClick={handleScheduleCalls}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                {'Scheduling...'}
              </>
            ) : (
              <>
                <FaClock className="-ml-1 mr-2 h-4 w-4" />
                Schedule Calls
              </>
            )}
          </button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-2 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {callResults && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Call Results</h4>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium">Scheduled:</span> {callResults.scheduled}
            </p>
            <p>
              <span className="font-medium">Skipped:</span> {callResults.skipped}
            </p>
            {scheduledTime && (
              <p>
                <span className="font-medium">Start Time:</span> {new Date(scheduledTime).toLocaleString()}
              </p>
            )}
            {callResults.errors && callResults.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-red-600 dark:text-red-400">Errors:</p>
                <ul className="list-disc pl-5 mt-1 text-red-600 dark:text-red-400">
                  {callResults.errors.map((error: { message: string }, index: number) => (
                    <li key={index}>{error.message || JSON.stringify(error)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCallScheduler; 