import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SearchParams, apolloApi } from '../services/api';
import { FaSyncAlt } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

interface ApolloSearchFormProps {
  onSearch: (params: SearchParams) => Promise<void>;
  isLoading: boolean;
}

// Common cron schedules
const CRON_SCHEDULES = [
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every day at 6 AM', value: '0 6 * * *' },
  { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every week', value: '0 0 * * 0' },
];

const defaultParams: SearchParams = {
  jobTitles: ['Owner', 'CEO', 'President', 'Operations Manager'],
  industries: ['Manufacturing', 'Industrial Equipment', 'Machinery'],
  keywords: 'industrial machinery equipment',
  limit: 25,
  cronSchedule: '0 0 * * *', // Daily at midnight
};

const ApolloSearchForm: React.FC<ApolloSearchFormProps> = ({ onSearch, isLoading: searchLoading }) => {
  const [defaultConfig, setDefaultConfig] = useState<SearchParams>(defaultParams);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [nextSyncAt, setNextSyncAt] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<SearchParams>({
    defaultValues: defaultConfig,
  });
  const { theme } = useTheme();

  const watchJobTitles = watch('jobTitles');
  const watchIndustries = watch('industries');
  const watchLocations = watch('locations');
  const watchCompanySize = watch('companySize');

  // Load the default configuration from the server
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        const { defaultParameters } = await apolloApi.getConfig();
        setDefaultConfig(defaultParameters);
        
        // Get status for next/last sync times
        const status = await apolloApi.getStatus();
        setNextSyncAt(status.nextSyncAt || null);
        setLastSyncAt(status.lastSyncAt || null);
        
        // Parse company sizes
        if (defaultParameters.companySize) {
          const sizes = defaultParameters.companySize.split(',').map(size => size.trim());
          setCompanySizes(sizes);
        }
        
        // Set form values
        if (defaultParameters.jobTitles) {
          setValue('jobTitles', defaultParameters.jobTitles);
        }
        if (defaultParameters.industries) {
          setValue('industries', defaultParameters.industries);
        }
        if (defaultParameters.locations) {
          setValue('locations', defaultParameters.locations);
        }
        if (defaultParameters.keywords) {
          setValue('keywords', defaultParameters.keywords);
        }
        if (defaultParameters.companySize) {
          setValue('companySize', defaultParameters.companySize);
        }
        if (defaultParameters.limit) {
          setValue('limit', Number(defaultParameters.limit));
        }
        if (defaultParameters.cronSchedule) {
          setValue('cronSchedule', defaultParameters.cronSchedule);
        }
      } catch (error) {
        console.error('Failed to fetch Apollo configuration:', error);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [setValue]);

  const onSubmit = (data: SearchParams) => {
    // Parse arrays from comma-separated strings
    const formattedData: SearchParams = {
      ...data,
      jobTitles: typeof data.jobTitles === 'string' 
        ? (data.jobTitles as string).split(',').map(item => item.trim()) 
        : data.jobTitles,
      industries: typeof data.industries === 'string'
        ? (data.industries as string).split(',').map(item => item.trim())
        : data.industries,
      locations: typeof data.locations === 'string'
        ? (data.locations as string).split(',').map(item => item.trim())
        : data.locations,
      // Ensure limit is a number
      limit: data.limit ? Number(data.limit) : undefined,
    };
    
    onSearch(formattedData);
  };

  // Function to handle the sync now button click
  const handleSyncNow = async () => {
    try {
      setSyncLoading(true);
      await apolloApi.syncNow();
      // Get updated status after sync
      const status = await apolloApi.getStatus();
      setNextSyncAt(status.nextSyncAt || null);
      setLastSyncAt(status.lastSyncAt || null);
      alert('Apollo sync started! Check leads table for new entries.');
    } catch (error) {
      console.error('Failed to start Apollo sync:', error);
      alert('Failed to start Apollo sync. Check console for details.');
    } finally {
      setSyncLoading(false);
    }
  };

  const toggleCompanySize = (size: string) => {
    const currentSizes = watchCompanySize ? watchCompanySize.split(',').map(s => s.trim()) : [];
    let newSizes: string[];
    
    if (currentSizes.includes(size)) {
      newSizes = currentSizes.filter(s => s !== size);
    } else {
      newSizes = [...currentSizes, size];
    }
    
    setValue('companySize', newSizes.join(','));
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (loadingConfig) {
    return (
      <div className="animate-pulse p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
    );
  }

  const selectedCompanySizes = watchCompanySize ? watchCompanySize.split(',').map(s => s.trim()) : [];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Apollo.io Search Parameters</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 sm:mt-0">
          <div>Last sync: {formatDate(lastSyncAt)}</div>
          <div>Next sync: {formatDate(nextSyncAt)}</div>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="col-span-2">
            <label htmlFor="jobTitles" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Job Titles (comma separated)
            </label>
            <input
              type="text"
              id="jobTitles"
              {...register('jobTitles')}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="CEO, Owner, Plant Manager"
              defaultValue={Array.isArray(defaultConfig.jobTitles) ? defaultConfig.jobTitles.join(', ') : defaultConfig.jobTitles}
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="industries" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Industries (comma separated)
            </label>
            <input
              type="text"
              id="industries"
              {...register('industries')}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Manufacturing, Industrial Equipment"
              defaultValue={Array.isArray(defaultConfig.industries) ? defaultConfig.industries.join(', ') : defaultConfig.industries}
            />
          </div>

          <div className="col-span-2">
            <label htmlFor="locations" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Locations (comma separated)
            </label>
            <input
              type="text"
              id="locations"
              {...register('locations')}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="United States, Canada"
              defaultValue={Array.isArray(defaultConfig.locations) ? defaultConfig.locations.join(', ') : ''}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Size (select multiple)
            </label>
            <input type="hidden" {...register('companySize')} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'].map((size) => (
                <div 
                  key={size}
                  onClick={() => toggleCompanySize(size)}
                  className={`cursor-pointer px-3 py-2 rounded text-sm ${
                    selectedCompanySizes.includes(size) 
                      ? 'bg-indigo-100 dark:bg-indigo-800 border-indigo-500 text-indigo-800 dark:text-indigo-200' 
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  } border`}
                >
                  {size} employees
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Limit
            </label>
            <input
              type="number"
              id="limit"
              {...register('limit', { 
                min: 1, 
                max: 100,
                valueAsNumber: true 
              })}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="25"
              defaultValue={defaultConfig.limit || 25}
            />
          </div>

          <div>
            <label htmlFor="cronSchedule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sync Schedule (cron)
            </label>
            <select
              id="cronSchedule"
              {...register('cronSchedule')}
              className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {CRON_SCHEDULES.map(schedule => (
                <option key={schedule.value} value={schedule.value}>
                  {schedule.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Keywords
            </label>
            <input
              type="text"
              id="keywords"
              {...register('keywords')}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="industrial machinery equipment"
              defaultValue={defaultConfig.keywords || ''}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {syncLoading ? (
              <>
                <FaSyncAlt className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Syncing...
              </>
            ) : (
              'Sync Now'
            )}
          </button>
          <button
            type="submit"
            disabled={searchLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {searchLoading ? (
              <>
                <FaSyncAlt className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Fetching Leads...
              </>
            ) : (
              'Search & Save Leads'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApolloSearchForm; 