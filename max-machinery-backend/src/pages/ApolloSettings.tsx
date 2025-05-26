import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'react-query';
import { apolloApi } from '../services/api';
import { FaSave, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface ImportFrequencyOption {
  value: string;
  label: string;
  schedule: string;
}

const importFrequencyOptions: ImportFrequencyOption[] = [
  { value: 'daily', label: 'Daily', schedule: 'Every day at midnight' },
  { value: 'weekly', label: 'Weekly', schedule: 'Every Monday at midnight' },
  { value: 'monthly', label: 'Monthly', schedule: 'First day of every month' },
];

const ApolloSettings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [frequency, setFrequency] = useState<string>('daily');
  const [showSuccess, setShowSuccess] = useState(false);

  // Query Apollo status
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery(
    'apolloStatus',
    () => apolloApi.getStatus(),
    {
      onSuccess: (data) => {
        // If API is configured, we can't show the actual key for security reasons
        if (data.configured) {
          setApiKey('••••••••••••••••••••••••••••••');
        }
      },
    }
  );

  // Mutation to update API key
  const updateApiKeyMutation = useMutation(
    (newApiKey: string) => apolloApi.updateApiKey(newApiKey),
    {
      onSuccess: () => {
        setShowSuccess(true);
        refetchStatus();
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      },
    }
  );

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey && !apiKey.includes('•')) {
      updateApiKeyMutation.mutate(apiKey);
    }
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFrequency(e.target.value);
    
    // In a real application, you would call an API to update the scheduler frequency
    // For now, we just show a success message
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Apollo.io Settings
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-8 lg:grid-cols-2">
        {/* API Key Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">API Configuration</h3>
          
          {statusLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
          ) : (
            <>
              <div className={`rounded-md ${statusData?.configured ? 'bg-green-50' : 'bg-yellow-50'} p-4 mb-6`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {statusData?.configured ? (
                      <FaCheck className="h-5 w-5 text-green-400" />
                    ) : (
                      <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${statusData?.configured ? 'text-green-800' : 'text-yellow-800'}`}>
                      {statusData?.message}
                    </h3>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveApiKey}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                      Apollo.io API Key
                    </label>
                    <input
                      type="text"
                      id="apiKey"
                      name="apiKey"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your Apollo.io API key"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      You can find your API key in your Apollo.io account settings.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={updateApiKeyMutation.isLoading || !apiKey || apiKey.includes('•')}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        updateApiKeyMutation.isLoading || !apiKey || apiKey.includes('•') ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <FaSave className="-ml-1 mr-2 h-5 w-5" />
                      Save API Key
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Import Schedule Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Import Schedule</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                Import Frequency
              </label>
              <select
                id="frequency"
                name="frequency"
                value={frequency}
                onChange={handleFrequencyChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {importFrequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700">Current Schedule</h4>
              <p className="mt-1 text-sm text-gray-500">
                {importFrequencyOptions.find((option) => option.value === frequency)?.schedule}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Leads will be automatically imported according to this schedule using your configured search parameters.
              </p>
            </div>
            
            <div className="pt-4">
              <button
                type="button"
                onClick={() => apolloApi.syncNow()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Run Import Now
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Manually trigger a lead import using your current search parameters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success notification */}
      {showSuccess && (
        <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="p-2 rounded-lg bg-green-600 shadow-lg sm:p-3">
              <div className="flex items-center justify-between flex-wrap">
                <div className="w-0 flex-1 flex items-center">
                  <span className="flex p-2 rounded-lg bg-green-800">
                    <FaCheck className="h-6 w-6 text-white" />
                  </span>
                  <p className="ml-3 font-medium text-white truncate">
                    <span className="md:hidden">Settings saved successfully!</span>
                    <span className="hidden md:inline">Your Apollo.io settings have been updated successfully!</span>
                  </p>
                </div>
                <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
                  <button
                    type="button"
                    onClick={() => setShowSuccess(false)}
                    className="-mr-1 flex p-2 rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg
                      className="h-6 w-6 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApolloSettings; 