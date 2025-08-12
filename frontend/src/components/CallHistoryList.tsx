import React, { useState } from 'react';
import { FaPhone, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { CallHistory } from '../types/call-history';
import CallDetailPanel from './CallDetailPanel';
import { convertToEasternTime } from '@/utils/timeUtils';

interface CallHistoryListProps {
  callHistoryRecords?: CallHistory[];
  additionalInfoCallHistory?: any[];
  leadName?: string;
  leadCompany?: string;
}

export const CallHistoryList: React.FC<CallHistoryListProps> = ({
  callHistoryRecords = [],
  additionalInfoCallHistory = [],
  leadName,
  leadCompany,
}) => {
  const [selectedCall, setSelectedCall] = useState<CallHistory | null>(null);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ended':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'registered':
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ended':
        return <FaCheckCircle className={`h-5 w-5 ${getStatusColor(status)}`} />;
      case 'error':
        return <FaTimesCircle className={`h-5 w-5 ${getStatusColor(status)}`} />;
      case 'registered':
      case 'in_progress':
        return <FaPhone className={`h-5 w-5 ${getStatusColor(status)}`} />;
      default:
        return <FaClock className={`h-5 w-5 ${getStatusColor(status)}`} />;
    }
  };

  const formatTimestamp = (timestamp: string | number) => {
    try {
      const timeNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      return convertToEasternTime(timeNum, 'MMM dd, yyyy hh:mm:ss a');
    } catch {
      return 'Invalid Date';
    }
  };

  // Combine and sort both old and new call records
  const allCalls = [
    ...callHistoryRecords.map(record => ({
      ...record,
      isNewFormat: true,
    })),
    ...additionalInfoCallHistory.map(record => ({
      ...record,
      isNewFormat: false,
    })),
  ].sort((a, b) => b.startTimestamp - a.startTimestamp);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Call History</h3>
      
      <div className="space-y-2">
        {allCalls.map((call, index) => (
          <div
            key={call.id || index}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setSelectedCall(call)}
          >
            <div className="flex items-center space-x-4">
              {getStatusIcon(call.status)}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatTimestamp(call.startTimestamp)}
                </p>
                <p className={`text-sm ${getStatusColor(call.status)}`}>
                  {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {call.isNewFormat ? 'New Format' : 'Legacy Format'}
            </div>
          </div>
        ))}
      </div>

      {selectedCall && (
        <div className="mt-6">
          <CallDetailPanel
            call={{
              ...selectedCall,
              leadName,
              leadCompany,
            }}
            onClose={() => setSelectedCall(null)}
          />
        </div>
      )}
    </div>
  );
}; 