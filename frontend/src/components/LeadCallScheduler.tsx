import React, { useState } from 'react';
import { FaPhone, FaSpinner, FaClock } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { api, CallResponse } from '../services/api';
import toast from 'react-hot-toast';
import { cronService } from '@/services/cron-service';

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
  const [callResults, setCallResults] = useState<CallResponse | null>(null);
  const [showScheduleOptions, setShowScheduleOptions] = useState(true);
  const [scheduledTime, setScheduledTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timeError, setTimeError] = useState<string | null>(null);
  const { theme } = useTheme();

  const validateTimes = () => {
    setTimeError(null);
    
    if (!scheduledTime) {
      setTimeError("Start time is required");
      return false;
    }
    
    // If end time is provided, validate it
    if (endTime) {
      // Ensure end time is after start time
      if (endTime <= scheduledTime) {
        setTimeError("End time must be after start time");
        return false;
      }
    }
    
    return true;
  };

  const handleScheduleCalls = async () => {
    // Prevent multiple calls if already loading
    if (loading) {
      console.log('Call scheduling already in progress, preventing duplicate call');
      return;
    }

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

      // Add scheduled time if set (time only for daily scheduling)
      if (showScheduleOptions && scheduledTime) {
        payload.startTime = scheduledTime;
        if (endTime) {
          payload.endTime = endTime;
        }
      }

      console.log('Scheduling calls with payload:', payload);

      // Make API call
      const response = await cronService.updateCronSetting("ScheduledCalls", payload);
     
      setCallResults(response);

      // Show success toast with details
      const message = scheduledTime 
        ? `Successfully scheduled ${response.scheduled} calls for daily execution at ${scheduledTime}`
        : `Successfully scheduled ${response.scheduled} calls for immediate execution`;
      
      toast.success(message, {
        duration: 5000,
        position: 'top-right'
      });

      console.log('Call scheduling successful:', response);

    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Failed to schedule calls");
        toast.error(error.message || "Failed to schedule calls");
      } else {
        setError("Failed to schedule calls");
        toast.error("Failed to schedule calls");
      }
      console.error("Error scheduling calls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleCall = async (id: string) => {
    if (!id) return;
    
    // Prevent multiple calls if already loading
    if (loading) {
      console.log('Single call already in progress, preventing duplicate call');
      return;
    }
    
    try {
      // Validate times if scheduling is enabled
      if (showScheduleOptions && !validateTimes()) {
        return;
      }
      
      setLoading(true);
      setError(null);
      setCallResults(null);

      const payload: any = { 
        toNumber: "+18055726774", // Default fallback number - will be overridden with fresh lead data when cron runs
        override_agent_id: "agent_b6a6e23b739cde06fbe109a217" // Default agent
      };
      
      // Add scheduled time if set (time only for daily scheduling)
      if (showScheduleOptions && scheduledTime) {
        payload.startTime = scheduledTime;
        if (endTime) {
          payload.endTime = endTime;
        }
      }

      console.log('Scheduling single call with payload:', payload);

      const response = await api.callSingleLead(id, payload);
      setCallResults(response);

      // Show success toast with details
      let message = '';
      if (scheduledTime) {
        message = `Successfully scheduled call for daily execution at ${scheduledTime}`;
      } else {
        message = 'Successfully initiated call';
      }
      
      toast.success(message, {
        duration: 5000,
        position: 'top-right'
      });

      console.log('Single call scheduling successful:', response);

      if (onCallComplete) {
        onCallComplete(response);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Failed to make call");
        toast.error(error.message || "Failed to make call");
      } else {
        setError("Failed to make call");
        toast.error("Failed to make call");
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
              Schedule Call (Daily)
            </h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Time* (Will run daily at this time)
                </label>
                <input
                  type="time"
                  id="scheduleTime"
                  value={scheduledTime || ''}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Time (Optional)
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime || ''}
                  onChange={(e) => setEndTime(e.target.value)}
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
              Schedule for Daily Execution
            </h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="scheduleTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Time* (Will run daily at this time)
                </label>
                <input
                  type="time"
                  id="scheduleTime"
                  value={scheduledTime || ''}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Time (Optional)
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime || ''}
                  onChange={(e) => setEndTime(e.target.value)}
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
                <span className="font-medium">Daily Start Time:</span> {scheduledTime}
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