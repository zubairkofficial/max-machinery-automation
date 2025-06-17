import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  X,
  FileText,
  Code
} from 'lucide-react';
import { 
  FaPhone, FaSpinner, FaClock, FaUserTie, FaBuilding, FaInfoCircle,
  FaCheckCircle, FaTimesCircle 
} from 'react-icons/fa';
interface MessageTemplate {
  id: number;
  name: string;
  type: 'sms' | 'email';
  category: 'verification' | 'welcome' | 'reminder' | 'notification';
  subject: string;
  content: string;
  htmlContent?: string;
  isActive: boolean;
  isDefault: boolean;
  placeholders: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateTemplateData {
  name: string;
  type: 'sms' | 'email';
  category: 'verification' | 'welcome' | 'reminder' | 'notification';
  subject: string;
  content: string;
  htmlContent?: string;
  isActive: boolean;
  isDefault: boolean;
  placeholders: string[];
}

const MessageTemplatesManager: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [showVariables, setShowVariables] = useState(false);
  const [showHtmlVariables, setShowHtmlVariables] = useState(false);

  const [formData, setFormData] = useState<CreateTemplateData>({
    name: '',
    type: 'sms',
    category: 'verification',
    subject: '',
    content: '',
    htmlContent: '',
    isActive: true,
    isDefault: true,
    placeholders: [],
  });

  const API_BASE_URL = 'http://localhost:4000/api/v1';

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.variables-dropdown')) {
        setShowVariables(false);
        setShowHtmlVariables(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/message-templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTemplate 
        ? `${API_BASE_URL}/message-templates/${editingTemplate.id}`
        : `${API_BASE_URL}/message-templates`;
      
      const method = editingTemplate ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTemplates();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/message-templates/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await fetchTemplates();
        }
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      category: template.category,
      subject: template.subject,
      content: template.content,
      htmlContent: template.htmlContent || '',
      isActive: template.isActive,
      isDefault: template.isDefault,
      placeholders: template.placeholders,
    });
    setIsModalOpen(true);
  };

  const handlePreview = (template: MessageTemplate) => {
    setPreviewTemplate(template);
    // Initialize preview data with placeholders
    const initialData: Record<string, string> = {};
    template.placeholders.forEach(placeholder => {
      initialData[placeholder] = `{{${placeholder}}}`;
    });
    setPreviewData(initialData);
    setIsPreviewOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setShowVariables(false);
    setShowHtmlVariables(false);
    setFormData({
      name: '',
      type: 'sms',
      category: 'verification',
      subject: '',
      content: '',
      htmlContent: '',
      isActive: true,
      isDefault: false,
      placeholders: [],
    });
  };

  const extractPlaceholders = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    return matches ? [...new Set(matches.map(match => match.replace(/[{}]/g, '')))] : [];
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
      placeholders: extractPlaceholders(content),
    }));
  };

  const renderPreview = () => {
    if (!previewTemplate) return '';
    
    let preview = previewTemplate.content;
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    
    return preview;
  };

  const initializeDefaults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/message-templates/initialize-defaults`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to initialize defaults:', error);
    }
  };

  // Common variables that can be used in templates
  const commonVariables = [
    'firstName',
     
    'verificationUrl',
    
  ];

  const insertVariable = (variable: string) => {
    const placeholder = `{{${variable}}}`;
    const textarea = document.querySelector('textarea[placeholder="Use {{placeholder}} for dynamic content"]') as HTMLTextAreaElement;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content;
      
      const newContent = currentContent.substring(0, start) + placeholder + currentContent.substring(end);
      handleContentChange(newContent);
      
      // Set cursor position after the inserted placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
    setShowVariables(false);
  };

  const insertHtmlVariable = (variable: string) => {
    const placeholder = `{{${variable}}}`;
    const textarea = document.querySelector('textarea[placeholder="HTML version of the email content"]') as HTMLTextAreaElement;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.htmlContent || '';
      
      const newContent = currentContent.substring(0, start) + placeholder + currentContent.substring(end);
      setFormData(prev => ({ ...prev, htmlContent: newContent }));
      
      // Set cursor position after the inserted placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
    setShowHtmlVariables(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <FaSpinner className="animate-spin h-8 w-8 text-indigo-600 mb-4" />
        <p className="text-gray-700 dark:text-gray-300">Loading leads data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Message Templates</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={initializeDefaults}
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Initialize Defaults</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Template</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No message templates yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
              Get started by creating your first message template or initialize with default templates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={initializeDefaults}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Initialize Defaults</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </button>
            </div>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:transform hover:scale-[1.02] overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{template.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        template.type === 'email' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {template.type.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 capitalize">
                        {template.category}
                      </span>
                      {template.isDefault && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Default
                        </span>
                      )}
                      <span className={`flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                        template.isActive 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {template.isActive ? (
                          <>
                            <FaCheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <FaTimesCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed h-12 overflow-hidden">{template.content}</p>
                </div>
                
                {template.placeholders.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Placeholders:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.placeholders.map(placeholder => (
                        <span key={placeholder} className="px-2 py-1 text-xs bg-white text-gray-600 dark:bg-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-500 font-mono">
                          {placeholder}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handlePreview(template)}
                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:text-gray-400 dark:hover:text-yellow-400 dark:hover:bg-yellow-900/20 transition-all duration-200 rounded-lg"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'sms' | 'email' }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="verification">Verification</option>
                    <option value="welcome">Welcome</option>
                    <option value="reminder">Reminder</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>
              </div>

              {formData.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowVariables(!showVariables)}
                      className="flex items-center px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                    >
                      <Code className="h-3 w-3 mr-1" />
                      Show Variables
                    </button>
                    
                    {showVariables && (
                      <div className="variables-dropdown absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 min-w-[200px]">
                        <div className="p-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Click to insert:</p>
                          <div className="grid grid-cols-1 gap-1">
                            {commonVariables.map(variable => (
                              <button
                                key={variable}
                                type="button"
                                onClick={() => insertVariable(variable)}
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
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Use {{placeholder}} for dynamic content"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use {'{{'} placeholder {'}'} syntax for dynamic content. Available: {formData.placeholders.join(', ')}
                </p>
              </div>

              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full shadow-inner transition-colors duration-200 ${
                      formData.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        formData.isActive ? 'transform translate-x-4' : ''
                      }`}></div>
                    </div>
                  </div>
                  <span className={`ml-3 text-sm font-medium ${
                    formData.isActive 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {formData.isActive ? (
                      <span className="flex items-center">
                        <FaCheckCircle className="w-4 h-4 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaTimesCircle className="w-4 h-4 mr-1" />
                        Inactive
                      </span>
                    )}
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Preview Template</h2>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Template Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  {previewTemplate.placeholders.map(placeholder => (
                    <div key={placeholder}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {placeholder}
                      </label>
                      <input
                        type="text"
                        value={previewData[placeholder] || ''}
                        onChange={(e) => setPreviewData(prev => ({ ...prev, [placeholder]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder={`Enter ${placeholder}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Preview</h3>
                <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-gray-700">
                  {previewTemplate.type === 'email' && previewTemplate.subject && (
                    <div className="mb-2">
                      <strong className="text-gray-900 dark:text-gray-100">Subject:</strong> 
                      <span className="text-gray-800 dark:text-gray-200 ml-1">
                        {previewTemplate.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => previewData[key] || match)}
                      </span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{renderPreview()}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageTemplatesManager;

