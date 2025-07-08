import React, { useState, useEffect } from 'react';
import { FaPhone, FaSpinner, FaClock, FaFileAlt, FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { api } from '../services/api';
import { CallHistory as CallHistoryType } from '../types/call-history';
import toast from 'react-hot-toast';

interface CallHistoryPageProps {}

interface CallDetail {
  call_id: string;
  call_type: string;
  agent_id: string;
  agent_version: number;
  agent_name: string;
  retell_llm_dynamic_variables: {
    lead_name: string;
    contact_info: string;
    follow_up_weeks: string;
    consultation_link: string;
  };
  call_status: string;
  start_timestamp: number;
  end_timestamp: number;
  duration_ms: number;
  public_log_url: string;
  disconnection_reason: string;
  transcript?: string;
  call_cost: {
    total_duration_unit_price: number;
    product_costs: any[];
    combined_cost: number;
    total_duration_seconds: number;
  };
  call_analysis: {
    in_voicemail: boolean;
    call_summary: string;
    user_sentiment: string;
    custom_analysis_data: any;
    call_successful: boolean;
  };
  from_number: string;
  to_number: string;
  direction: string;
  telephony_identifier: {
    twilio_call_sid: string;
  };
  lead?: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string;
    email: string | null;
    status: string;
    contacted: boolean;
    zohoEmail: string;
    zohoPhoneNumber: string;
    scheduledCallbackDate: string;
    company: string | null;
    industry: string | null;
    linkClicked: boolean;
    formSubmitted: boolean;
  };
  recording_url?: string;
  transcript_object?: {
    role: 'agent' | 'user';
    content: string;
    words: {
      start: number;
      end: number;
      text: string;
    }[];
  }[];
}

interface CallHistoryResponse {
  success: boolean;
  data: CallHistoryType[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const CallHistory: React.FC<CallHistoryPageProps> = () => {
  const [callHistory, setCallHistory] = useState<CallHistoryType[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });
  console.log("selectedCall", selectedCall);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    name: '',
    reschedule: 'all',
    linkClicked: 'all',
    formSubmitted: 'all'
  });

  useEffect(() => {
    fetchCallHistory();
  }, [pagination.page, pagination.limit, filters]);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.name && { name: filters.name }),
        ...(filters.reschedule !== 'all' && { reschedule: filters.reschedule }),
        ...(filters.linkClicked !== 'all' && { linkClicked: filters.linkClicked }),
        ...(filters.formSubmitted !== 'all' && { formSubmitted: filters.formSubmitted })
      };

      const response: CallHistoryResponse = await api.getAllCallHistory(params);
      
      if (response.success) {
        setCallHistory(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error('Failed to fetch call history');
      }
    } catch (error: any) {
      console.error('Error fetching call history:', error);
      toast.error(error.message || 'Failed to fetch call history');
      setCallHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallDetail = async (callId: string) => {
    try {
      setDetailLoading(true);
      const response = await api.getCallDetail(callId);
      setSelectedCall(response);
    } catch (error: any) {
      console.error('Error fetching call details:', error);
      toast.error('Failed to fetch call details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      startDate: '',
      endDate: '',
      name: '',
      reschedule: 'all',
      linkClicked: 'all',
      formSubmitted: 'all'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.name) count++;
    if (filters.reschedule !== 'all') count++;
    if (filters.linkClicked !== 'all') count++;
    if (filters.formSubmitted !== 'all') count++;
    return count;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ended':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'registered':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'link clicked':  
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'form submitted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms || ms <= 0) return 'Not connected';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string | number) => {
    try {
      const timeNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      return new Date(timeNum).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };
  

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    } catch {
      return '$0.00';
    }
  };

  if (loading && callHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FaSpinner className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading call history...</p>
        </div>
      </div>
    );
  }

  const renderCallDetail = (selectedCall: CallDetail) => {
    return (
      <div className="space-y-6">
        {/* Lead Status */}
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Lead Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Link Status:</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedCall.lead?.linkClicked 
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedCall.lead?.linkClicked ? 'Link Clicked' : 'Not Clicked'}
              </span>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Form Status:</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedCall.lead?.formSubmitted 
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedCall.lead?.formSubmitted ? 'Form Submitted' : 'Not Submitted'}
              </span>
            </div>
          </div>
        </div>

        {/* Call Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Duration</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDuration(selectedCall.duration_ms)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Cost</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(selectedCall.call_cost.combined_cost)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Status</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedCall.call_status}
            </p>
          </div>
        </div>

        {/* Transcript */}
        {selectedCall.transcript_object && (
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Detailed Transcript</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedCall.transcript_object.map((item, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg ${
                    item.role === 'agent' 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {item.role === 'agent' ? 'Agent' : 'User'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {item.content}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(item.words[0]?.start * 1000).toISOString().substr(11, 8)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call Analysis */}
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Call Analysis</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Summary:</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {selectedCall.call_analysis.call_summary}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Sentiment:</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {selectedCall.call_analysis.user_sentiment}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Success:</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedCall.call_analysis.call_successful
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedCall.call_analysis.call_successful ? 'Successful' : 'Not Successful'}
              </span>
            </div>
          </div>
        </div>

        {/* Recording */}
        {selectedCall.recording_url && (
          <div className="mt-4">
            <a
              href={selectedCall.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FaFileAlt className="mr-2 h-4 w-4" />
              Listen to Recording
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            All Call History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete call history sorted by newest first
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters{getActiveFiltersCount() > 0 && ` (${getActiveFiltersCount()} active)`}:
              </span>
            </div>
            
            {/* First Row - Search and Main Status */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Name:</label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm min-w-[150px]"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Call Status:</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="ended">Ended</option>
                  <option value="not_connected">Not Connected</option>
                  <option value="error">Error</option>
                  <option value="registered">Registered</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>
            </div>

            {/* Second Row - Lead Status Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">ReSchedule:</label>
                <select
                  value={filters.reschedule}
                  onChange={(e) => handleFilterChange('reschedule', e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="not_scheduled">Not Scheduled</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Link Status:</label>
                <select
                  value={filters.linkClicked}
                  onChange={(e) => handleFilterChange('linkClicked', e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="clicked">Clicked</option>
                  <option value="not_clicked">Not Clicked</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Form Status:</label>
                <select
                  value={filters.formSubmitted}
                  onChange={(e) => handleFilterChange('formSubmitted', e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">All</option>
                  <option value="submitted">Submitted</option>
                  <option value="not_submitted">Not Submitted</option>
                </select>
              </div>
            </div>

            {/* Third Row - Date Filters and Clear Button */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">From:</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">To:</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <FaPhone className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pagination.total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <FaClock className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Page</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pagination.page} of {pagination.totalPages}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <FaFileAlt className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Per Page</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.limit}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Call History List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Call History {loading && <FaSpinner className="inline animate-spin ml-2" />}
              </h2>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {callHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <FaPhone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No call history found</p>
                </div>
              ) : (
                callHistory.map((call) => (
                  <div
                    key={call.id}
                    onClick={() => call.callId && fetchCallDetail(call.callId)}
                    className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(call as any).lead?.firstName || 'Unknown'} {(call as any).lead?.lastName || ''}
                          </p>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {call.toNumber}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatTimestamp(call.startTimestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDuration(call.duration_ms)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {call.direction}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Next
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Call Detail Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Call Details</h2>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center">
                <FaSpinner className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading call details...</p>
              </div>
            ) : selectedCall ? (
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {/* Lead Information */}
                  {selectedCall.lead && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Lead Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Name:</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedCall.lead.firstName} {selectedCall.lead.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Status:</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedCall.lead.status)}`}>
                            {selectedCall.lead.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Link Status:</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedCall.lead.linkClicked ? "Link Clicked" : "Not Clicked")}`}>
                            {selectedCall.lead.linkClicked ? "Link Clicked" : "Not Clicked"}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Form Status:</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedCall.lead.formSubmitted ? "Form Submitted" : "Not Submitted")}`}>
                            {selectedCall.lead.formSubmitted ? "Form Submitted" : "Not Submitted"}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Phone:</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedCall.lead.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Email:</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedCall.lead.zohoEmail || "Not available"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Callback Date:</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedCall.lead.scheduledCallbackDate 
                              ? new Date(selectedCall.lead.scheduledCallbackDate).toLocaleString() 
                              : "Not scheduled"}
                          </p>
                        </div>
                        {selectedCall.lead.company && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Company:</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedCall.lead.company}</p>
                          </div>
                        )}
                        {selectedCall.lead.industry && (
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Industry:</p>
                            <p className="font-medium text-gray-900 dark:text-white">{selectedCall.lead.industry}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Call Information */}
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Call Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Agent Name:</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedCall.agent_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Direction:</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedCall.direction}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">From:</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedCall.from_number}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">To:</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedCall.to_number}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Start Time:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedCall.start_timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">End Time:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedCall.end_timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Duration:</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDuration(selectedCall.duration_ms)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Cost:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency((selectedCall.call_cost?.combined_cost || 0) / 100)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Status:</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedCall.call_status}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Disconnection:</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedCall.disconnection_reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Variables */}
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Dynamic Variables</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Lead Name:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedCall.retell_llm_dynamic_variables?.lead_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Contact Info:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedCall.retell_llm_dynamic_variables?.contact_info}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Follow Up:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedCall.retell_llm_dynamic_variables?.follow_up_weeks}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Consultation Link:</p>
                        <a 
                          href={selectedCall.retell_llm_dynamic_variables?.consultation_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                          Schedule Consultation
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Call Analysis */}
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Call Analysis</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Sentiment:</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedCall.call_analysis.user_sentiment}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Call Success:</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedCall.call_analysis.call_successful ? "Yes" : "No"}
                        </p>
                      </div>
                      {selectedCall.call_analysis.call_summary && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Summary:</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedCall.call_analysis.call_summary}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transcript */}
                  {selectedCall.transcript && (
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Transcript</h3>
                      <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {selectedCall.transcript}
                      </pre>
                    </div>
                  )}

                  {/* Public Log */}
                  {selectedCall.public_log_url && (
                    <div className="mt-4">
                      <a
                        href={selectedCall.public_log_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <FaFileAlt className="mr-2 h-4 w-4" />
                        View Call Log
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FaPhone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a call to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallHistory; 