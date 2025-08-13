import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Lead, SearchParams, leadsApi, apolloApi } from '../services/api';
import LeadsList from '../components/LeadsList';
import LeadDetailModal from '../components/LeadDetailModal';
import ApolloSearchForm from '../components/ApolloSearchForm';
import { categoryService, Category } from '../services/category-service';
import { 
  FaFilter, 
  FaUserTie, 
  FaSyncAlt, 
  FaSearch,
  FaTrash,
  FaTimes, // Add this for clear icon
  FaCheckCircle, // Added for Interested tab
  FaTimesCircle, // Added for Not Interested tab
  FaClock, // Added for Reschedule tab
  FaBell, // Added for Reminder tab
  FaCheckDouble, // Added for Completed tab
} from 'react-icons/fa';
import Pagination from '../components/common/Pagination';
import AddLeadModal from '@/components/leads/LeadModel';
import { toast } from 'react-hot-toast';

// Add the props interface
interface LeadsManagementProps {
  currentTab?: string;
}

const TABS = {
  ALL: 'all',
  INTERESTED: 'interested',
  NOT_INTERESTED: 'not-interested',
  RESCHEDULE: 'reschedule',
  REMINDER: 'reminder',
  COMPLETED: 'completed',
  PRIORITY: 'priority',
  SURPLUS: 'surplus',
};

// Add type for sort fields
type SortableField = keyof Pick<Lead, 'createdAt' | 'company' | 'firstName'>;

// Update SORT_OPTIONS with proper typing
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', field: 'createdAt' as SortableField, direction: 'DESC' as const },
  { value: 'oldest', label: 'Oldest First', field: 'createdAt' as SortableField, direction: 'ASC' as const },
  { value: 'companyAZ', label: 'Company (A-Z)', field: 'company' as SortableField, direction: 'ASC' as const },
  { value: 'companyZA', label: 'Company (Z-A)', field: 'company' as SortableField, direction: 'DESC' as const },
  { value: 'nameAZ', label: 'Name (A-Z)', field: 'firstName' as SortableField, direction: 'ASC' as const },
  { value: 'nameZA', label: 'Name (Z-A)', field: 'firstName' as SortableField, direction: 'DESC' as const },
];



const LeadsManagement: React.FC<LeadsManagementProps> = ({ currentTab = TABS.ALL }) => {
  const [activeTab, setCurrentTab] = useState(currentTab);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
    const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all',
    industry: 'all',
    reschedule: 'all',
    linkClicked: 'all',
    formSubmitted: 'all',
    categoryId: 'all',
    createdFrom: '',
    createdTo: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const queryClient = useQueryClient();

  // Query for tab statistics
  const { data: tabStats } = useQuery(
    ['tab-stats'],
    () => leadsApi.getTabStats(),
    {
      staleTime: 30000, // Cache for 30 seconds
      refetchOnWindowFocus: false,
    }
  );

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await categoryService.getActive();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

 
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
        industry: filters.industry !== 'all' ? filters.industry : undefined,
        reschedule: filters.reschedule !== 'all' ? filters.reschedule : undefined,
        linkClicked: filters.linkClicked !== 'all' ? filters.linkClicked : undefined,
        formSubmitted: filters.formSubmitted !== 'all' ? filters.formSubmitted : undefined,
        categoryId: filters.categoryId !== 'all' ? filters.categoryId : undefined,
        createdFrom: filters.createdFrom ? filters.createdFrom : undefined,
        createdTo: filters.createdTo ? filters.createdTo : undefined,
        search: searchTerm && searchTerm.trim() !== '' ? searchTerm.trim() : undefined,
        tab: activeTab,
      };
console.log("leadsData",leadsData)
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

  useEffect(()=>{
    refetch()
  },[activeTab])

  // Update sorting logic with proper typing
  const processedLeads = React.useMemo(() => {
    if (!leadsData?.data) return [];
    
    let leads = [...leadsData.data];
    
    // Find the selected sort option
    const selectedSort = SORT_OPTIONS.find(option => option.value === sortOption);
    if (selectedSort) {
      leads.sort((a, b) => {
        const aValue = String(a[selectedSort.field] || '');
        const bValue = String(b[selectedSort.field] || '');
        
        if (selectedSort.field === 'createdAt') {
          // Handle date comparison
          return selectedSort.direction === 'ASC' 
            ? new Date(aValue).getTime() - new Date(bValue).getTime()
            : new Date(bValue).getTime() - new Date(aValue).getTime();
        }
        
        // Handle string comparison
        return selectedSort.direction === 'ASC'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }
    
    return leads;
  }, [leadsData?.data, sortOption]);

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
        // Reset pagination to page 1 to show newest leads
        setPage(1);
        // Clear search term to show all leads
        setSearchTerm('');
        // Reset filters to show all leads
        setFilters({
          status: 'all',
          industry: 'all',
          reschedule: 'all',
          linkClicked: 'all',
          formSubmitted: 'all',
          categoryId: 'all',
          createdFrom: '',
          createdTo: '',
        });
        // Set sort to newest first to show latest synced leads
        setSortOption('newest');
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

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

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
    queryClient.invalidateQueries(['tab-stats']); // Refresh stats
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
    // Reset to first page when search term changes
    setPage(1);
  };



  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

    const handleLeadAdded = () => {
    // Optionally refetch or update your leads list here
    queryClient.invalidateQueries(['leads']);
    queryClient.invalidateQueries(['tab-stats']); // Refresh stats
  };

  // Add delete lead function
  const handleDeleteLead = async (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    
    setIsDeleting(true);
    try {
      await leadsApi.delete(leadToDelete.id);
      // Refetch leads after deletion
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['tab-stats']); // Refresh stats
      // Show success message
      toast.success('Lead deleted successfully');
      // Close modal
      setDeleteConfirmOpen(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast.error('Failed to delete lead. Please try again.');
    } finally {
      setIsDeleting(false);
    }
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
              {/* ...existing buttons... */}
              <button
                type="button"
                onClick={() => setIsAddLeadModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                + Create Lead
              </button>
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

        <div className="bg-white dark:bg-gray-800 overflow-auto">
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
              <option value={TABS.ALL}>New Leads</option>
              <option value={TABS.INTERESTED}>Interested</option>
              <option value={TABS.NOT_INTERESTED}>Not Interested</option>
              <option value={TABS.RESCHEDULE}>Reschedule</option>
              <option value={TABS.REMINDER}>Reminder</option>
              <option value={TABS.COMPLETED}>Completed</option>
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
                  New Leads
                  {tabStats?.all !== undefined && (
                    <span className="bg-indigo-100 text-indigo-600 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {tabStats.all}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => handleTabChange(TABS.INTERESTED)}
                  className={`${
                    activeTab === TABS.INTERESTED
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FaCheckCircle className="mr-2 h-5 w-5" />
                  Interested
                  {tabStats?.interested !== undefined && (
                    <span className="bg-green-100 text-green-600 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {tabStats.interested}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange(TABS.NOT_INTERESTED)}
                  className={`${
                    activeTab === TABS.NOT_INTERESTED
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FaTimesCircle className="mr-2 h-5 w-5" />
                  Not Interested
                  {tabStats?.notInterested !== undefined && (
                    <span className="bg-red-100 text-red-600 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {tabStats.notInterested}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange(TABS.RESCHEDULE)}
                  className={`${
                    activeTab === TABS.RESCHEDULE
                      ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FaClock className="mr-2 h-5 w-5" />
                  Reschedule
                  {tabStats?.reschedule !== undefined && (
                    <span className="bg-yellow-100 text-yellow-600 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {tabStats.reschedule}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange(TABS.REMINDER)}
                  className={`${
                    activeTab === TABS.REMINDER
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FaBell className="mr-2 h-5 w-5" />
                  Reminder
                  {tabStats?.reminder !== undefined && (
                    <span className="bg-purple-100 text-purple-600 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {tabStats.reminder}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleTabChange(TABS.COMPLETED)}
                  className={`${
                    activeTab === TABS.COMPLETED
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <FaCheckDouble className="mr-2 h-5 w-5" />
                  Completed
                  {tabStats?.completed !== undefined && (
                    <span className="bg-emerald-100 text-emerald-600 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {tabStats.completed}
                    </span>
                  )}
                </button>
                <button
                  className={`${
                    activeTab === TABS.COMPLETED
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  
                    <span className="bg-emerald-100 text-emerald-600 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    total  {tabStats?.total}
                    </span>
                
                </button>
                  
                  {/* <span className="bg-indigo-100 text-indigo-600 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium">
                      {leadsData?.pagination?.total}
                    </span> */}
                 
                
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
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-500" />
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {/* Category Filter */}
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="min-w-32 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Lists</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Date Created From Filter */}
              <input
                type="date"
                value={filters.createdFrom}
                onChange={(e) => setFilters({ ...filters, createdFrom: e.target.value })}
                placeholder="Created From"
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Date Created To Filter */}
              <input
                type="date"
                value={filters.createdTo}
                onChange={(e) => setFilters({ ...filters, createdTo: e.target.value })}
                placeholder="Created To"
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaSyncAlt className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
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
                leads={processedLeads || []}
                isLoading={isLoading || isRefreshing}
                onViewDetails={handleViewLeadDetails}
                onDeleteLead={handleDeleteLead}
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
 <AddLeadModal 
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onLeadAdded={handleLeadAdded}
      />
      <LeadDetailModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLeadUpdated={handleLeadUpdated}
      />
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && leadToDelete && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <FaTrash className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                      Delete Lead
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete {leadToDelete.firstName} {leadToDelete.lastName}'s lead? This action cannot be undone and will also delete all related call history.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setLeadToDelete(null);
                  }}
                  disabled={isDeleting}
                  className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add default props if needed
LeadsManagement.defaultProps = {
  currentTab: TABS.ALL
};

export default LeadsManagement; 