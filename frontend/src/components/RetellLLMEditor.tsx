import React, { useState, useEffect, useRef } from 'react';
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
  const [masterPrompt, setMasterPrompt] = useState('');
  const [reminderPrompt, setReminderPrompt] = useState('');
  const [busyPrompt, setBusyPrompt] = useState('');

  const masterRef = useRef<HTMLTextAreaElement>(null);
  const reminderRef = useRef<HTMLTextAreaElement>(null);
  const busyRef = useRef<HTMLTextAreaElement>(null);

  // Shared variables for dynamic placeholders
  const commonVariables = [
    'link_click',
    'form_not_submit',
    'lead_name', 
    'contact_info', // Add more if needed
  ];

  const [showMasterVars, setShowMasterVars] = useState(false);
  const [showReminderVars, setShowReminderVars] = useState(false);
  const [showBusyVars, setShowBusyVars] = useState(false);

  useEffect(() => {
    fetchLLMData();
  }, [llmId]);

  const fetchLLMData = async () => {
    try {
      setLoading(true);
      const data = await retellService.getRetellLLM(llmId);
      setLlmConfig(data);
      setError(null);
      // Parse and set each section
      if (data && data.general_prompt) {
        const sections = parsePromptSections(data.general_prompt);
        setMasterPrompt(sections.master);
        setReminderPrompt(sections.reminder);
        setBusyPrompt(sections.busy);
      }
    } catch (err) {
      setError('Failed to fetch LLM data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parsePromptSections = (prompt: string) => {
    const master = prompt.match(/1\. [^\n]*[\s\S]*?(?=---|2\.|$)/)?.[0] || '';
    const reminder = prompt.match(/2\. [^\n]*[\s\S]*?(?=---|3\.|$)/)?.[0] || '';
    const busy = prompt.match(/3\. Handling BUSY Responses[\s\S]*?(?=---|$)/)?.[0] || '';
    return { master, reminder, busy };
  };

  // Helper to insert variables at the cursor position in the textareas
  const insertVariable = (
    ref: React.RefObject<HTMLTextAreaElement>,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const textarea = ref.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = textarea.value;
      const placeholder = `{{${value}}}`;
      const newValue = current.substring(0, start) + placeholder + current.substring(end);
      setter(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const handleUpdate = async () => {
    if (!llmConfig) return;
    try {
      setLoading(true);
      const mergedPrompt = `${masterPrompt}\n\n${reminderPrompt}\n\n${busyPrompt}`;
      await retellService.updateRetellLLM(llmId, mergedPrompt);
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

  if (loading && !llmConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <FaSpinner className="animate-spin h-8 w-8 text-indigo-600 mb-4" />
        <p className="text-gray-700 dark:text-gray-300">Loading leads data...</p>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Retell AI Configuration</h2>

        {/* Master Prompt Section */}
        <div className="mb-6">
          <label htmlFor="master-prompt-textarea" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            1. Master Prompt
          </label>
          <div className="relative mb-2">
            <button
              type="button"
              onClick={() => setShowMasterVars((v) => !v)}
              className="flex items-center px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            >
              <span className="mr-1">Show Variables</span>
            </button>
            {showMasterVars && (
              <div className="variables-dropdown absolute left-0 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 min-w-[200px]">
                <div className="p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Click to insert:</p>
                  <div className="grid grid-cols-1 gap-1">
                    {commonVariables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => {
                          insertVariable(masterRef, variable, setMasterPrompt);
                          setShowMasterVars(false);
                        }}
                        className="text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <textarea
            id="master-prompt-textarea"
            ref={masterRef}
            value={masterPrompt}
            onChange={(e) => setMasterPrompt(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            placeholder="Enter master prompt..."
          />
        </div>

        {/* Reminder Prompt Section */}
        <div className="mb-6">
          <label htmlFor="reminder-prompt-textarea" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            2. Link Interaction Reminder
          </label>
          <div className="relative mb-2">
            <button
              type="button"
              onClick={() => setShowReminderVars((v) => !v)}
              className="flex items-center px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            >
              <span className="mr-1">Show Variables</span>
            </button>
            {showReminderVars && (
              <div className="variables-dropdown absolute left-0 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 min-w-[200px]">
                <div className="p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Click to insert:</p>
                  <div className="grid grid-cols-1 gap-1">
                    {commonVariables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => {
                          insertVariable(reminderRef, variable, setReminderPrompt);
                          setShowReminderVars(false);
                        }}
                        className="text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <textarea
            id="reminder-prompt-textarea"
            ref={reminderRef}
            value={reminderPrompt}
            onChange={(e) => setReminderPrompt(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            placeholder="Enter link reminder prompt..."
          />
        </div>

        {/* Busy Prompt Section */}
        <div className="mb-6">
          <label htmlFor="busy-prompt-textarea" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            3. Handling BUSY Responses
          </label>
          <div className="relative mb-2">
            <button
              type="button"
              onClick={() => setShowBusyVars((v) => !v)}
              className="flex items-center px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
            >
              <span className="mr-1">Show Variables</span>
            </button>
            {showBusyVars && (
              <div className="variables-dropdown absolute left-0 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 min-w-[200px]">
                <div className="p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Click to insert:</p>
                  <div className="grid grid-cols-1 gap-1">
                    {commonVariables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => {
                          insertVariable(busyRef, variable, setBusyPrompt);
                          setShowBusyVars(false);
                        }}
                        className="text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <textarea
            id="busy-prompt-textarea"
            ref={busyRef}
            value={busyPrompt}
            onChange={(e) => setBusyPrompt(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            placeholder="Enter busy/interrupt handling prompt..."
          />
        </div>

        {/* Save Button */}
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
