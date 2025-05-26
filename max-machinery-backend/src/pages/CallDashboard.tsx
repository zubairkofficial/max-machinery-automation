import React, { useState, useEffect } from 'react';
import { 
  FaPhone, FaClock, FaFileAlt, FaVolumeUp, FaCheckCircle, 
  FaTimesCircle, FaFilter, FaCalendar, FaSearch, FaDownload 
} from 'react-icons/fa';
import { api } from '../services/api';
import { retellService, RetellCall } from '../services/retell-service';
import toast from 'react-hot-toast';
import CallDetailPanel from '@/components/CallDetailPanel';
import { CallHistory } from '../types/call-history';

interface CallRecord extends RetellCall {
  leadId?: string;
  leadName?: string;
  leadCompany?: string;
  phoneNumber?: string;
}

const CallDashboard: React.FC = () => {
  const [calls, setCalls] = useState<CallHistory[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    searchTerm: '',
  });
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const calculateDuration = (start: number, end: number): string => {
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchCalls();
  }, [filters]);

  const fetchCalls = async () => {
    try {
      setIsLoading(true);
      
      // Get all calls from RetellAI
      const retellCalls = await retellService.getCalls();
      
      // Get all leads to match with calls
      const allLeads = await api.getAll(1, 1000);
      const leadsMap = new Map(allLeads.data.map(lead => [lead.id, lead]));

      // Combine RetellAI call data with lead information
      const detailedCalls: CallHistory[] = retellCalls.map(retellCall => {
        const leadId = retellCall.metadata?.lead_id || retellCall.id.split('_')[0];
        const lead = leadsMap.get(leadId);
        
        // Map sentiment to the correct type
        let sentiment: CallHistory['sentiment'] | undefined;
        if (retellCall.call_analysis?.user_sentiment) {
          const userSentiment = retellCall.call_analysis.user_sentiment.toLowerCase();
          sentiment = {
            overall: userSentiment === 'positive' ? 'positive' :
                    userSentiment === 'negative' ? 'negative' : 'neutral'
          };
        }
        
        return {
          ...retellCall,
          leadId,
          leadName: lead ? `${lead.firstName} ${lead.lastName}` : 'Unknown Lead',
          leadCompany: lead?.company || 'Unknown Company',
          leadPhone: lead?.phone || 'Unknown Number',
          leadEmail: lead?.email,
          leadJobTitle: lead?.jobTitle,
          callId: retellCall.call_id,
          fromNumber: retellCall.from_number || '+14158436193',
          toNumber: retellCall.to_number || lead?.phone,
          status: retellCall.call_status,
          startTimestamp: retellCall.start_timestamp,
          endTimestamp: retellCall.end_timestamp,
          duration_ms: retellCall.duration_ms,
          disconnection_reason: retellCall.disconnection_reason,
          recording_url: retellCall.recording_url,
          transcript: retellCall.transcript,
          transcript_object: retellCall.transcript_object,
          transcript_with_tool_calls: retellCall.transcript_with_tool_calls,
          public_log_url: retellCall.public_log_url,
          callCost: retellCall.call_cost,
          analytics: retellCall.call_analysis?.custom_analysis_data,
          sentiment,
          opt_out_sensitive_data_storage: retellCall.opt_out_sensitive_data_storage,
          opt_in_signed_url: retellCall.opt_in_signed_url
        };
      });

      // Apply filters
      let filteredCalls = detailedCalls;
      
      if (filters.status !== 'all') {
        filteredCalls = filteredCalls.filter(call => call.status === filters.status);
      }

      if (filters.dateRange !== 'all') {
        const now = new Date();
        const startDate = new Date(dateRange.start || now.setDate(now.getDate() - 30));
        const endDate = new Date(dateRange.end || now);
        
        filteredCalls = filteredCalls.filter(call => {
          const callDate = new Date(call.startTimestamp);
          return callDate >= startDate && callDate <= endDate;
        });
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredCalls = filteredCalls.filter(call => 
          (call.leadName?.toLowerCase().includes(searchLower) || false) ||
          (call.leadCompany?.toLowerCase().includes(searchLower) || false) ||
          (call.leadPhone?.includes(searchLower) || false)
        );
      }

      // Sort by date, most recent first
      filteredCalls.sort((a, b) => b.startTimestamp - a.startTimestamp);

      setCalls(filteredCalls);
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast.error('Failed to load call data');
    } finally {
      setIsLoading(false);
    }
  };

  const exportCallData = () => {
    const csvData = calls.map(call => ({
      'Date': formatTimestamp(call.startTimestamp),
      'Lead': call.leadName || 'Unknown',
      'Company': call.leadCompany || 'Unknown',
      'Phone': call.leadPhone || 'Unknown',
      'Status': call.status,
      'Duration': call.endTimestamp ? calculateDuration(call.startTimestamp, call.endTimestamp) : 'N/A',
      'Agent ID': call.agentId,
      'Talk Time (%)': call.analytics?.leadTalkPercentage || 'N/A',
      'Sentiment': call.sentiment?.overall || 'N/A',
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ended':
        return 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Call Dashboard</h1>
            <button
              onClick={exportCallData}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FaDownload className="mr-2 h-4 w-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800"
              >
                <option value="all">All Statuses</option>
                <option value="ended">Completed</option>
                <option value="error">Failed</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  placeholder="Search by lead name, company, or phone..."
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 pl-10"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Call List and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700">
          {/* Call List */}
          <div className="p-4 overflow-auto max-h-[calc(100vh-300px)]">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No calls found matching your filters
              </div>
            ) : (
              <div className="space-y-4">
                {calls.map(call => (
                  <div
                    key={call.callId || call.call_id}
                    onClick={() => setSelectedCall(call)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCall?.callId === call.callId
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{call.leadName || 'Unknown Lead'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{call.leadCompany || 'Unknown Company'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimestamp(call.startTimestamp)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {call.status}
                        </span>
                        {call.endTimestamp && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {calculateDuration(call.startTimestamp, call.endTimestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4">
                      {call.recording_url && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <FaVolumeUp className="mr-1 h-4 w-4" />
                          Recording
                        </div>
                      )}
                      {call.transcript && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <FaFileAlt className="mr-1 h-4 w-4" />
                          Transcript
                        </div>
                      )}
                      {call.sentiment && (
                        <div className="flex items-center">
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            call.sentiment.overall === 'positive'
                              ? 'bg-green-500'
                              : call.sentiment.overall === 'negative'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                          }`}></span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {call.sentiment.overall}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Call Details */}
          <div className="p-4">
            {selectedCall ? (
              <CallDetailPanel call={selectedCall} onClose={() => setSelectedCall(null)} />
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Select a call to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallDashboard; 