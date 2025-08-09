import React, { useState, useEffect } from 'react';
import { cronService, CronSetting, UpdateCronSettingDto, LeadCallData } from '../services/cron-service';
import { FaSpinner } from 'react-icons/fa';
import { Save, RefreshCw, AlertCircle, CheckCircle2, Clock, Calendar, Info, Phone } from 'lucide-react';
import { JobName } from '../types/job-name.enum';
import toast from 'react-hot-toast';

const CronSettings: React.FC = () => {
  const [settings, setSettings] = useState<CronSetting[]>([]);
  const [leadCallData, setLeadCallData] = useState<LeadCallData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<JobName, UpdateCronSettingDto>>({} as Record<JobName, UpdateCronSettingDto>);
  const [timeErrors, setTimeErrors] = useState<Record<JobName, string>>({} as Record<JobName, string>);
  const [selectedDays, setSelectedDays] = useState<Record<JobName, number>>({} as Record<JobName, number>);


  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await cronService.getCronSettingsWithLeadData();
      setSettings(response.cronSettings);
      setLeadCallData(response.leadCallData);
      const initialEditingValues: Record<JobName, UpdateCronSettingDto> = {} as Record<JobName, UpdateCronSettingDto>;
      const initialSelectedDays: Record<JobName, number> = {} as Record<JobName, number>;
      
      response.cronSettings.forEach(s => {
        initialEditingValues[s.jobName] = {
          isEnabled: s.isEnabled,
          startTime: s.startTime ? subtractFourHours(s.startTime) : '',
          endTime: s.endTime ? subtractFourHours(s.endTime) : '',
          callLimit: s.callLimit || 100,
        };
        initialSelectedDays[s.jobName] = s.selectedDays || 1; // Use selectedDays from API or default to 1
      });
      setEditingValues(initialEditingValues);
      setSelectedDays(initialSelectedDays);
    } catch (err) {
      setError('Failed to fetch cron job settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Function to subtract 4 hours for display (convert from UTC to local time)
  const subtractFourHours = (time: string | undefined): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    let newHours = hours-4;
    
    // Handle negative hours (wrap around to previous day)
    if (newHours < 0) {
      newHours += 24;
    }
    
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Function to add 4 hours before sending to API (convert from local time to UTC)
  const addFourHours = (time: string | undefined): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    let newHours = hours+4;
    
    // Handle hours >= 24 (wrap around to next day)
    if (newHours >= 24) {
      newHours -= 24;
    }
    
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Function to check if job runs on weekends
  const getWeekendInfo = (jobName: JobName) => {
    // Define which jobs don't run on weekends
    const weekendExcludedJobs = [
      'LEAD_SYNC_FROM_APOLLO',
      'LEAD_SYNC_TO_ZOHO',
      'CALL_HISTORY_SYNC',
      'FOLLOW_UP_REMINDERS'
    ];
    
    const isWeekendExcluded = weekendExcludedJobs.includes(jobName);
    
    if (isWeekendExcluded) {
      return {
        runsOnWeekends: false,
        message: "This job does not run on weekends (Saturday & Sunday)"
      };
    }
    
    return {
      runsOnWeekends: true,
      message: "This job does not run on weekends (Saturday and Sunday)"
    };
  };







  const validateTimes = (jobName: JobName, startTime: string | undefined, endTime: string | undefined): boolean => {
    // Clear previous errors for this job
    setTimeErrors(prev => ({ ...prev, [jobName]: '' }));

    if (!startTime) {
      setTimeErrors(prev => ({ ...prev, [jobName]: 'Start time is required' }));
      return false;
    }

    if (endTime) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      if (end <= start) {
        setTimeErrors(prev => ({ ...prev, [jobName]: 'End time must be after start time' }));
        return false;
      }
    }

    return true;
  };

  const handleUpdate = async (jobName: JobName) => {
    const updateData = editingValues[jobName];
    if (!updateData) return;

    // Validate times before updating
    if (!validateTimes(jobName, updateData.startTime, updateData.endTime)) {
      setError(`Invalid time settings for ${jobName}`);
      return;
    }

    const selectedDaysCount = selectedDays[jobName] || 1;

    // Add 4 hours to the startTime and endTime before updating in API
    const updatedData = {
      ...updateData,
      startTime: addFourHours(updateData.startTime),
      endTime: updateData.endTime ? addFourHours(updateData.endTime) : undefined,
      selectedDays: selectedDaysCount, // Add selected days to API
      callLimit: updateData.callLimit, // Add call limit to API
    };

    try {
      setLoading(true);
      await cronService.updateCronSetting(jobName, updatedData);
      toast.success(`${jobName} updated successfully`, {
          duration: 5000,
          position: 'top-right'
        });
      setSuccess(`Successfully updated ${jobName}.`);
      setTimeout(() => setSuccess(null), 3000);
      fetchSettings(); 
    } catch (err) {
      setError(`Failed to update ${jobName}.`);
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (jobName: JobName, field: keyof UpdateCronSettingDto, value: string | boolean | number) => {
    setEditingValues(prev => ({
      ...prev,
      [jobName]: {
        ...prev[jobName],
        [field]: value,
      },
    }));

    // Clear any previous errors when input changes
    if (field === 'startTime' || field === 'endTime') {
      setTimeErrors(prev => ({ ...prev, [jobName]: '' }));
      setError(null);
    }
  };

  const handleDaysChange = (jobName: JobName, days: number) => {
    setSelectedDays(prev => ({
      ...prev,
      [jobName]: days
    }));
  };

  const formatJobName = (jobName: JobName): string => {
    return jobName.replace(/([A-Z])/g, ' $1').trim();
  };

  if (loading && settings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Job Scheduler</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Times are displayed in your local timezone. Database stores times in UTC (4 hours ahead).
            </p>
          </div>
          <button onClick={fetchSettings} disabled={loading} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center"><AlertCircle className="w-5 h-5 mr-2"/>{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center"><CheckCircle2 className="w-5 h-5 mr-2"/>{success}</div>}

        {/* Lead Call Statistics */}
        {leadCallData && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Lead Call Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Scheduled Calls</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{leadCallData.scheduledCallCount}</p>
                  </div>
                </div>
              </div>
               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
               <div className="flex items-center">
               <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
               <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Rescheduled Calls</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{leadCallData.rescheduledCallCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Reminder Calls</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{leadCallData.reminderCallCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {settings.map((setting) => {
            const weekendInfo = getWeekendInfo(setting.jobName);
            return (
              <div key={setting.jobName} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{formatJobName(setting.jobName)}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
                    
                    {/* Weekend Information */}
                    <div className="flex items-center mt-2">
                      <Info className="w-4 h-4 text-blue-500 mr-2" />
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        weekendInfo.runsOnWeekends 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {weekendInfo.message}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded"
                        checked={editingValues[setting.jobName]?.isEnabled ?? false}
                        onChange={(e) => handleInputChange(setting.jobName, 'isEnabled', e.target.checked)}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enabled</span>
                    </label>
                    <button onClick={() => handleUpdate(setting.jobName)} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Start Time (Daily)
                      </div>
                    </label>
                    <input
                      type="time"
                      value={editingValues[setting.jobName]?.startTime ?? ''}
                      onChange={(e) => handleInputChange(setting.jobName, 'startTime', e.target.value)}
                      className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border ${timeErrors[setting.jobName] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 font-mono`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        End Time (Optional)
                      </div>
                    </label>
                    <input
                      type="time"
                      value={editingValues[setting.jobName]?.endTime ?? ''}
                      onChange={(e) => handleInputChange(setting.jobName, 'endTime', e.target.value)}
                      className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border ${timeErrors[setting.jobName] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Select Next Run Date
                      </div>
                    </label>
                    <select
                      value={selectedDays[setting.jobName] || 1}
                      onChange={(e) => handleDaysChange(setting.jobName, parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border ${timeErrors[setting.jobName] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 font-mono"
                    >
                      <option value={1}>1 day</option>
                      <option value={2}>2 days</option>
                      <option value={3}>3 days</option>
                      <option value={4}>4 days</option>
                      <option value={5}>5 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                       Per Day Call Limit
                      </div>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={editingValues[setting.jobName]?.callLimit ?? 100}
                      onChange={(e) => handleInputChange(setting.jobName, 'callLimit', parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 font-mono"
                      placeholder="100"
                    />
                  </div>
                 
                </div>
                
                {timeErrors[setting.jobName] && (
                  <div className="mt-4">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {timeErrors[setting.jobName]}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CronSettings;
