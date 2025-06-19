import React, { useState, useEffect } from 'react';
import { retellService } from '../services/retellService';
import { RetellLLMResponse } from '../types/retell';
import { Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FaSpinner } from 'react-icons/fa';

interface RetellLLMEditorProps {
  llmId: string;
}

const RetellLLMEditor: React.FC<RetellLLMEditorProps> = ({ llmId }) => {
  const [llmConfig, setLlmConfig] = useState<RetellLLMResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const variables = [
    { name: 'lead_name', description: 'Lead Name' },
    { name: 'contact_info', description: 'Contact Information' },
    { name: 'follow_up_weeks', description: 'Follow-up Weeks' },
  ];

  useEffect(() => {
    fetchLLMData();
  }, [llmId]);

  const fetchLLMData = async () => {
    try {
      setLoading(true);
      const data = await retellService.getRetellLLM(llmId);
      setLlmConfig(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch LLM data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!llmConfig) return;
    
    try {
      setLoading(true);
      await retellService.updateRetellLLM(llmId, llmConfig.general_prompt);
      setSuccess('Prompt updated successfully');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update prompt');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variableName: string) => {
    if (!llmConfig) return;
    
    const textarea = document.getElementById('prompt-textarea') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newPrompt = llmConfig.general_prompt.substring(0, start) + 
      `{{${variableName}}}` + 
      llmConfig.general_prompt.substring(end);
    
    setLlmConfig({
      ...llmConfig,
      general_prompt: newPrompt
    });
  };


   if (loading && !llmConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <FaSpinner className="animate-spin h-8 w-8 text-indigo-600 mb-4" />
        <p className="text-gray-700 dark:text-gray-300">Loading leads data...</p>
      </div>
    );
  }
  // if (loading && !llmConfig) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
  //     </div>
  //   );
  // }

  if (!llmConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load LLM configuration</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Retell AI Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Model Settings</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Model</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{llmConfig.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{llmConfig.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Temperature</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{llmConfig.model_temperature}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">High Priority</span>
                  <span className={`text-sm font-medium ${llmConfig.model_high_priority ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {llmConfig.model_high_priority ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Strict Mode</span>
                  <span className={`text-sm font-medium ${llmConfig.tool_call_strict_mode ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {llmConfig.tool_call_strict_mode ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Published</span>
                  <span className={`text-sm font-medium ${llmConfig.is_published ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {llmConfig.is_published ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Available Variables</h3>
          <div className="flex flex-wrap gap-2">
            {variables.map((variable) => (
              <button
                key={variable.name}
                onClick={() => insertVariable(variable.name)}
                className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors text-sm font-medium"
              >
                {variable.description}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="prompt-textarea" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Prompt Configuration
            </label>
            <button
              onClick={fetchLLMData}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          <textarea
            id="prompt-textarea"
            value={llmConfig.general_prompt}
            onChange={(e) => setLlmConfig({ ...llmConfig, general_prompt: e.target.value })}
            className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            placeholder="Enter your prompt here..."
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Update Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetellLLMEditor; 