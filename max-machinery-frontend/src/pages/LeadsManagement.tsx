import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Lead, SearchParams, leadsApi, apolloApi } from '../services/api';
import LeadsList from '../components/LeadsList';
import LeadDetailModal from '../components/LeadDetailModal';
import ApolloSearchForm from '../components/ApolloSearchForm';
import { 
  FaFilter, 
  FaUserTie, 
  FaIndustry, 
  FaSyncAlt, 
  FaSearch,
  FaTools,
  FaSort,
  FaChevronLeft, 
  FaChevronRight
} from 'react-icons/fa';
import Pagination from '../components/common/Pagination';

// Add the props interface
interface LeadsManagementProps {
  currentTab?: string;
}

const TABS = {
  ALL: 'all',
  PRIORITY: 'priority',
  SURPLUS: 'surplus',
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'companyAZ', label: 'Company (A-Z)' },
  { value: 'companyZA', label: 'Company (Z-A)' },
];

const FILTER_OPTIONS = {
  STATUS: [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'ended', label: 'Ended' },
    // { value: 'qualified', label: 'Qualified' },
    { value: 'error', label: 'Error' },
  ],
  INDUSTRY: [
    { value: 'all', label: 'All Industries' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Industrial Equipment', label: 'Industrial Equipment' },
    { value: 'Machinery', label: 'Machinery' },
    { value: 'Construction', label: 'Construction' },
    { value: 'Automotive', label: 'Automotive' },
    { value: 'Heavy Equipment', label: 'Heavy Equipment' },
  ],
};

const LeadsManagement: React.FC<LeadsManagementProps> = ({ currentTab = TABS.ALL }) => {
  const [activeTab, setCurrentTab] = useState(currentTab);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [filters, setFilters] = useState({
    status: 'all',
    industry: 'all',
  });
  const queryClient = useQueryClient();

  // Query for leads based on current tab
  const {
    data: leadsData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['leads', activeTab, page, pageSize, sortOption, filters, searchTerm],
    () => {
      // Pass filters to the API
      const apiFilters = {
        status: filters.status !== 'all' ? filters.status : undefined,
        industry: filters.industry !== 'all' ? filters.industry : undefined
      };

      switch (activeTab) {
        case TABS.PRIORITY:
          return leadsApi.getPriority(page, pageSize);
        case TABS.SURPLUS:
          return leadsApi.getSurplusMachinery(page, pageSize);
        default:
          return leadsApi.getAll(page, pageSize, apiFilters);
      }
    },
    {
      keepPreviousData: true,
    }
  );

  // Remove client-side filtering since it's now handled by the backend
  const filteredLeads = React.useMemo(() => {
    if (!leadsData?.data) return [];
    
    return leadsData.data.filter(lead => {
      // Only apply search term filter on the client side
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (lead.firstName && lead.firstName.toLowerCase().includes(searchLower)) ||
          (lead.lastName && lead.lastName.toLowerCase().includes(searchLower)) ||
          (lead.company && lead.company.toLowerCase().includes(searchLower)) ||
          (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
          (lead.location && lead.location.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [leadsData?.data, searchTerm]);

  // Apply sorting to filtered leads
  const sortedAndFilteredLeads = React.useMemo(() => {
    if (!filteredLeads) return [];
    
    return [...filteredLeads].sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'companyAZ':
          return (a.company || '').localeCompare(b.company || '');
        case 'companyZA':
          return (b.company || '').localeCompare(a.company || '');
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [filteredLeads, sortOption]);

  // Pagination for filtered and sorted leads
  const paginatedLeads = React.useMemo(() => {
    if (!sortedAndFilteredLeads) return [];
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedAndFilteredLeads.slice(start, end);
  }, [sortedAndFilteredLeads, page, pageSize]);

  // Mutation for searching and importing leads
  const searchMutation = useMutation(
    (searchParams: SearchParams) => leadsApi.fetchFromApollo(searchParams),
    {
      onSuccess: () => {
        // Invalidate and refetch leads
        queryClient.invalidateQueries(['leads']);
        // Hide search form after successful search
        setSearchVisible(false);
      },
    }
  );

  // Mutation for manually triggering sync
  const syncNowMutation = useMutation(
    () => apolloApi.syncNow(),
    {
      onSuccess: () => {
        // Invalidate and refetch leads
        queryClient.invalidateQueries(['leads']);
      },
    }
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentTab(currentTab);
    setPage(1);
  }, [currentTab]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setPage(1);
  };

  // Handle lead selection for detail view
  const handleViewLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Handle lead update
  const handleLeadUpdated = (updatedLead: Lead) => {
    queryClient.invalidateQueries(['leads']);
    setSelectedLead(updatedLead);
  };

  // Handle search submission
  const handleSearch = async (searchParams: SearchParams) => {
    searchMutation.mutate(searchParams);
  };

  // Handle manual sync trigger
  const handleSyncNow = () => {
    syncNowMutation.mutate();
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Handle search term change
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter change
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType.toLowerCase()]: value,
    }));
    // Reset to first page when filters change
    setPage(1);
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl">
                Lead Management
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage and track all your leads from Apollo.io
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
              <button
                type="button"
                onClick={() => setSearchVisible(!searchVisible)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaFilter className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                {searchVisible ? 'Hide Search' : 'Search Apollo'}
              </button>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncNowMutation.isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-800"
              >
                <FaSyncAlt className={`-ml-1 mr-2 h-5 w-5 ${syncNowMutation.isLoading ? 'animate-spin' : ''}`} />
                {syncNowMutation.isLoading ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        </div>

        {searchVisible && (
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <ApolloSearchForm onSearch={handleSearch} isLoading={searchMutation.isLoading} />
          </div>
        )}

        <div className="bg-white dark:bg-gray-800">
          <div className="sm:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <label htmlFor="tabs" className="sr-only">
              Select a tab
            </label>
            <select
              id="tabs"
              name="tabs"
              className="block w-full focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
            >
              <option value={TABS.ALL}>All Leads</option>
              <option value={TABS.PRIORITY}>Priority Leads</option>
              <option value={TABS.SURPLUS}>Surplus Machinery</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8 px-6 pt-3" aria-label="Tabs">
                <button
                  onClick={() => handleTabChange(TABS.ALL)}
                  className={`${
                    activeTab === TABS.ALL
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FaUserTie className="mr-2 h-5 w-5" />
                  All Leads
                  {leadsData?.pagination?.total && (
                    <span
                      className={`${
                        activeTab === TABS.ALL ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900'
                      } ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium`}
                    >
                      {leadsData.pagination.total}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange(TABS.PRIORITY)}
                  className={`${
                    activeTab === TABS.PRIORITY
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FaIndustry className="mr-2 h-5 w-5" />
                  Priority Leads
                </button>
                <button
                  onClick={() => handleTabChange(TABS.SURPLUS)}
                  className={`${
                    activeTab === TABS.SURPLUS
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FaTools className="mr-2 h-5 w-5" />
                  Surplus Machinery
                  {activeTab === TABS.SURPLUS && leadsData?.pagination?.total ? (
                    <span className="bg-indigo-100 text-indigo-600 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {leadsData.pagination.total}
                    </span>
                  ) : null}
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-gray-800 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={handleSearchTermChange}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setFilterVisible(!filterVisible)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaFilter className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                Filters {(filters.status !== 'all' || filters.industry !== 'all') && '(Active)'}
              </button>
              
              <div className="relative flex-shrink-0">
                <div className="flex items-center">
                  <label htmlFor="sort" className="sr-only">Sort by</label>
                  <FaSort className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <select
                    id="sort"
                    name="sort"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={sortOption}
                    onChange={handleSortChange}
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaSyncAlt className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Expanded Filters */}
          {filterVisible && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  id="status-filter"
                  name="status-filter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {FILTER_OPTIONS.STATUS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="industry-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Industry</label>
                <select
                  id="industry-filter"
                  name="industry-filter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.industry}
                  onChange={(e) => handleFilterChange('industry', e.target.value)}
                >
                  {FILTER_OPTIONS.INDUSTRY.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Lead List Section */}
        <div className="bg-white dark:bg-gray-800">
          {error ? (
            <div className="p-6">
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400 dark:text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error loading leads</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>Failed to load leads. Please try again later.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-1 sm:p-0">
              <LeadsList
                leads={paginatedLeads || []}
                isLoading={isLoading || isRefreshing}
                onViewDetails={handleViewLeadDetails}
              />

              {/* Pagination */}
              {leadsData && (
                <Pagination
                  total={leadsData.pagination.total}
                  page={page}
                  limit={pageSize}
                  onPageChange={setPage}
                  onLimitChange={handlePageSizeChange}
                  showPageSize={true}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <LeadDetailModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
};

// Add default props if needed
LeadsManagement.defaultProps = {
  currentTab: TABS.ALL
};

export default LeadsManagement; 