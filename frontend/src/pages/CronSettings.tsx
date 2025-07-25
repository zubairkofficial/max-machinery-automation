import React, { useState, useEffect } from 'react';
import { cronService, CronSetting, UpdateCronSettingDto } from '../services/cron-service';
import { FaSpinner } from 'react-icons/fa';
import { Save, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { JobName } from '../types/job-name.enum';

const CronSettings: React.FC = () => {
  const [settings, setSettings] = useState<CronSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<JobName, UpdateCronSettingDto>>({} as Record<JobName, UpdateCronSettingDto>);
  const [timeErrors, setTimeErrors] = useState<Record<JobName, string>>({} as Record<JobName, string>);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await cronService.getCronSettings();
      setSettings(data);
      const initialEditingValues: Record<JobName, UpdateCronSettingDto> = {} as Record<JobName, UpdateCronSettingDto>;
      data.forEach(s => {
        initialEditingValues[s.jobName] = {
          isEnabled: s.isEnabled,
          startTime: s.startTime ? subtractFourHours(s.startTime) : '',
          endTime: s.endTime ? subtractFourHours(s.endTime) : ''
        };
      });
      setEditingValues(initialEditingValues);
    } catch (err) {
      setError('Failed to fetch cron job settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Function to subtract 4 hours for display
const subtractFourHours = (time: string | undefined): string => {
  if (!time) return ''; // Return an empty string if time is undefined
  const [hours, minutes] = time.split(':').map(Number); // Split and map
  const date = new Date();
  date.setHours(hours - 4, minutes);  // Subtract 4 hours for display
  const newHours = date.getHours().toString().padStart(2, '0');
  const newMinutes = date.getMinutes().toString().padStart(2, '0');
  return `${newHours}:${newMinutes}`;
};

  // Function to add 4 hours before sending the time to the API
 const addFourHours = (time: string | undefined): string => {
  if (!time) return ''; // Return an empty string if time is undefined
  const [hours, minutes] = time.split(':').map(Number); // Split and map
  const date = new Date();
  date.setHours(hours + 4, minutes);  // Add 4 hours before updating API
  const newHours = date.getHours().toString().padStart(2, '0');
  const newMinutes = date.getMinutes().toString().padStart(2, '0');
  return `${newHours}:${newMinutes}`;
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

    // Add 4 hours to the startTime and endTime before updating in API
    const updatedData = {
      ...updateData,
      startTime: addFourHours(updateData.startTime),
      endTime: updateData.endTime ? addFourHours(updateData.endTime) : undefined,
    };

    try {
      setLoading(true);
      await cronService.updateCronSetting(jobName, updatedData);
      setSuccess(`Successfully updated ${jobName}.`);
      setTimeout(() => setSuccess(null), 3000);
      fetchSettings(); 
    } catch (err) {
      setError(`Failed to update ${jobName}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (jobName: JobName) => {
    const createData = editingValues[jobName];
    if (!createData) return;

    // Validate times before creating
    if (!validateTimes(jobName, createData.startTime, createData.endTime)) {
      setError(`Invalid time settings for ${jobName}`);
      return;
    }

    // Add 4 hours to the startTime and endTime before sending to API
    const newData = {
      ...createData,
      startTime: addFourHours(createData.startTime),
      endTime: createData.endTime ? addFourHours(createData.endTime) : undefined,
    };
    
    try {
      setLoading(true);
      await cronService.createCronSetting({ jobName, ...newData });
      setSuccess(`Successfully created ${jobName}.`);
      setTimeout(() => setSuccess(null), 3000);
      fetchSettings(); 
    } catch (err) {
      setError(`Failed to create ${jobName}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (jobName: JobName, field: keyof UpdateCronSettingDto, value: string | boolean) => {
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Job Scheduler</h1>
          <button onClick={fetchSettings} disabled={loading} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center"><AlertCircle className="w-5 h-5 mr-2"/>{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center"><CheckCircle2 className="w-5 h-5 mr-2"/>{success}</div>}

        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.jobName} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{formatJobName(setting.jobName)}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{setting.description}</p>
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
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {timeErrors[setting.jobName] && (
                  <div className="col-span-full">
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {timeErrors[setting.jobName]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CronSettings;
