import React, { useState, useEffect } from 'react';
import { 
  FaPhone, FaClock, FaUser, FaBuilding, FaChartBar, 
  FaDollarSign, FaCheckCircle, FaTimesCircle, FaSpinner,
  FaSearch, FaFilter, FaChevronLeft, FaChevronRight 
} from 'react-icons/fa';
import { api } from '../services/api';
import { CallDashboardData, CallDashboardLead, CallDashboardFilters } from '../types/call-dashboard';
import CallDetailPanel from './CallDetailPanel';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Pagination from './common/Pagination';

const CallDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<CallDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<CallDashboardLead | null>(null);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [isLoadingCallDetails, setIsLoadingCallDetails] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<CallDashboardFilters>({
    status: 'all',
    dateRange: {
      start: '',
      end: '',
    },
    searchTerm: '',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getCallDashboard(filters);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (!ms) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string | number): string => {
    try {
      const date = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      return new Date(date).toLocaleString();
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return 'Invalid Date';
    }
  };

  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(2)}`;
  };

  const handleCallClick = async (call: { callId: string }) => {
    try {
      setIsLoadingCallDetails(true);
      const callDetails = await api.getCallById(call.callId);
      setSelectedCall(callDetails);
    } catch (error) {
      console.error('Error fetching call details:', error);
      toast.error('Failed to load call details');
    } finally {
      setIsLoadingCallDetails(false);
    }
  };

  const handleFilterChange = (filterType: keyof CallDashboardFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
      page: filterType === 'page' ? value : 1 // Reset to first page when filters change, except when changing page
    }));
  };

  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setFilters(prev => ({
      ...prev,
      dateRange: {
        start: start ? start.toISOString() : '',
        end: end ? end.toISOString() : ''
      },
      page: 1
    }));
  };

  // Handle page size change
  const handlePageSizeChange = (newLimit: number) => {
    handleFilterChange('limit', newLimit);
    handleFilterChange('page', 1); // Reset to first page when changing page size
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        No dashboard data available
      </div>
    );
  }

  const { statistics, leads, pagination } = dashboardData;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-2">
            <FaUser className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Leads</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {statistics.contactedLeads} / {statistics.totalLeads}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Contact Rate: {statistics.contactRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-2">
            <FaPhone className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Calls</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {statistics.successfulCalls} / {statistics.totalCalls}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Success Rate: {statistics.callSuccessRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-2">
            <FaClock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Avg Duration</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatDuration(statistics.averageCallDuration)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Per Call</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-2">
            <FaDollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Avg Cost</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCost(statistics.averageCallCost)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Per Call</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800"
              >
                <option value="all">All Statuses</option>
                <option value="contacted">Contacted</option>
                <option value="not_contacted">Not Contacted</option>
                <option value="successful">Successful</option>
                <option value="failed">Failed</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Range
              </label>
              <DatePicker
                selectsRange={true}
                startDate={filters.dateRange.start ? new Date(filters.dateRange.start) : null}
                endDate={filters.dateRange.end ? new Date(filters.dateRange.end) : null}
                onChange={(dates) => handleDateRangeChange(dates as [Date | null, Date | null])}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800"
                placeholderText="Select date range"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  placeholder="Search leads..."
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 pl-10"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Items per page
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Call</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {leads.map(lead => (
                <tr 
                  key={lead.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {lead.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{lead.company}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{lead.jobTitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lead.contacted
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {lead.lastCallRecord ? (
                      <div>
                        <div>{formatTimestamp(lead.lastCallRecord.timestamp)}</div>
                        <div className="text-xs">{lead.lastCallRecord.status}</div>
                      </div>
                    ) : (
                      'No calls'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (lead.lastCallRecord) {
                          handleCallClick({ callId: lead.lastCallRecord.callId });
                        }
                      }}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      disabled={!lead.lastCallRecord}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        
      </div>

      {/* Call History Table */}
      <div className="">
        {/* ... existing table code ... */}

        {/* Pagination */}
        {pagination && (
          <Pagination
            total={pagination.total}
            page={filters.page || 1}
            limit={filters.limit || 10}
            onPageChange={(page) => handleFilterChange('page', page)}
            onLimitChange={handlePageSizeChange}
            showPageSize={true}
          />
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" style={{ zIndex: 40 }}>
          <div className="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedLead.firstName} {selectedLead.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{selectedLead.company}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Contact Info</h3>
                <p className="text-gray-600 dark:text-gray-400">Phone: {selectedLead.phone || 'N/A'}</p>
                <p className="text-gray-600 dark:text-gray-400">Email: {selectedLead.email || 'N/A'}</p>
                <p className="text-gray-600 dark:text-gray-400">Location: {selectedLead.location || 'N/A'}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Company Info</h3>
                <p className="text-gray-600 dark:text-gray-400">Job Title: {selectedLead.jobTitle}</p>
                <p className="text-gray-600 dark:text-gray-400">Industry: {selectedLead.industry || 'N/A'}</p>
                <p className="text-gray-600 dark:text-gray-400">
                  <a href={selectedLead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                    LinkedIn Profile
                  </a>
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Call Status</h3>
                <p className="text-gray-600 dark:text-gray-400">Status: {selectedLead.status}</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Contacted: {selectedLead.contacted ? 'Yes' : 'No'}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Last Updated: {new Date(selectedLead.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Call History */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Call History</h3>
              <div className="space-y-4">
                {selectedLead.callHistoryRecords.map(call => (
                  <div
                    key={call.id}
                    className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatTimestamp(call.startTimestamp)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Duration: {call.duration_ms ? formatDuration(call.duration_ms) : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          From: {call.fromNumber} → To: {call.toNumber}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {call.status === 'ended' ? (
                          <FaCheckCircle className="text-green-500" />
                        ) : call.status === 'error' ? (
                          <FaTimesCircle className="text-red-500" />
                        ) : (
                          <FaSpinner className="text-yellow-500 animate-spin" />
                        )}
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          {call.status}
                        </span>
                      </div>
                    </div>
                    {call.callCost && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Cost: {formatCost(call.callCost.combined_cost)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" style={{ zIndex: 50 }}>
          <div className="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white dark:bg-gray-800">
            {isLoadingCallDetails ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <CallDetailPanel call={selectedCall} onClose={() => setSelectedCall(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallDashboard; 