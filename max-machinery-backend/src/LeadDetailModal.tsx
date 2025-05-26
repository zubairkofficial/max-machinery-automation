import React, { useState, useEffect } from 'react';
import { Lead, leadsApi } from './services/api';
import { 
  FaPhone, 
  FaEnvelope, 
  FaLinkedin, 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaCheck, 
  FaTimes,
  FaEdit,
  FaSave,
  FaUserTie,
  FaCog
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useTheme } from './contexts/ThemeContext';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (lead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, isOpen, onClose, onLeadUpdated }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const { theme } = useTheme();

  useEffect(() => {
    if (lead) {
      setFormData({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        jobTitle: lead.jobTitle,
        industry: lead.industry,
        location: lead.location,
        status: lead.status,
        contacted: lead.contacted,
        hasSurplusMachinery: lead.hasSurplusMachinery,
        machineryInterest: lead.machineryInterest || '',
        machineryNotes: lead.machineryNotes || ''
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleEdit = () => {
    setFormData({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      jobTitle: lead.jobTitle,
      industry: lead.industry,
      location: lead.location,
      status: lead.status,
      contacted: lead.contacted,
      hasSurplusMachinery: lead.hasSurplusMachinery,
      machineryInterest: lead.machineryInterest || '',
      machineryNotes: lead.machineryNotes || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!lead) return;
    
    setIsSaving(true);
    try {
      let updatedLead;
      
      if (activeTab === 'machinery') {
        updatedLead = await leadsApi.updateMachineryInfo(lead.id, {
          hasSurplusMachinery: formData.hasSurplusMachinery,
          machineryInterest: formData.machineryInterest,
          machineryNotes: formData.machineryNotes,
          machineryDetails: formData.machineryDetails || lead.machineryDetails
        });
      } else {
        updatedLead = await leadsApi.update(lead.id, formData);
      }
      
      onLeadUpdated(updatedLead);
      setIsEditing(false);
      toast.success('Lead updated successfully');
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast.error('Failed to update lead');
    } finally {
      setIsSaving(false);
    }
  };

  const renderContactInfo = () => {
    if (isEditing) {
      return (
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              value={formData.firstName || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              value={formData.lastName || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
            <input
              type="text"
              name="phone"
              id="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
            <input
              type="text"
              name="company"
              id="company"
              value={formData.company || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              id="jobTitle"
              value={formData.jobTitle || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Industry</label>
            <input
              type="text"
              name="industry"
              id="industry"
              value={formData.industry || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
            <input
              type="text"
              name="location"
              id="location"
              value={formData.location || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              name="status"
              id="status"
              value={formData.status || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="not-interested">Not Interested</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              name="contacted"
              id="contacted"
              checked={!!formData.contacted}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="contacted" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Has Been Contacted
            </label>
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Information</h4>
          <div className="mt-2 space-y-3">
            <div className="flex items-center">
              <FaEnvelope className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="text-sm text-gray-900 dark:text-gray-100">{lead.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center">
              <FaPhone className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="text-sm text-gray-900 dark:text-gray-100">{lead.phone || 'No phone provided'}</span>
            </div>
            {lead.linkedinUrl && (
              <div className="flex items-center">
                <FaLinkedin className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                <a 
                  href={lead.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Information</h4>
          <div className="mt-2 space-y-3">
            <div className="flex items-center">
              <FaBuilding className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="text-sm text-gray-900 dark:text-gray-100">{lead.company || 'Unknown'}</span>
            </div>
            <div className="flex items-center">
              <FaUserTie className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="text-sm text-gray-900 dark:text-gray-100">{lead.jobTitle || 'Unknown'}</span>
            </div>
            <div className="flex items-center">
              <FaMapMarkerAlt className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="text-sm text-gray-900 dark:text-gray-100">{lead.location || 'Unknown location'}</span>
            </div>
          </div>
        </div>
        
        <div className="sm:col-span-2">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Information</h4>
          <div className="mt-2 flex flex-wrap items-center space-x-4">
            <div className="flex items-center mb-2">
              <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${lead.status === 'qualified' ? 'bg-green-400' : lead.status === 'contacted' ? 'bg-yellow-400' : lead.status === 'not-interested' ? 'bg-red-400' : 'bg-blue-400'} mr-2`}></div>
              <span className="text-sm text-gray-900 dark:text-gray-100 font-medium capitalize">{lead.status || 'New'}</span>
            </div>
            <div className="flex items-center mb-2">
              {lead.contacted ? (
                <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                  <FaCheck className="h-4 w-4 mr-1" />
                  Contacted
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <FaTimes className="h-4 w-4 mr-1" />
                  Not Contacted
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMachineryInfo = () => {
    if (isEditing) {
      return (
        <div className="space-y-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="hasSurplusMachinery"
              id="hasSurplusMachinery"
              checked={!!formData.hasSurplusMachinery}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="hasSurplusMachinery" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Has Surplus Machinery
            </label>
          </div>
          
          <div>
            <label htmlFor="machineryInterest" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Machinery Interest</label>
            <input
              type="text"
              name="machineryInterest"
              id="machineryInterest"
              value={formData.machineryInterest || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g. CNC Machines, Industrial Presses"
            />
          </div>
          
          <div>
            <label htmlFor="machineryNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Machinery Notes</label>
            <textarea
              name="machineryNotes"
              id="machineryNotes"
              rows={4}
              value={formData.machineryNotes || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Notes about machinery condition, availability, etc."
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Surplus Machinery:</h4>
          {lead.hasSurplusMachinery ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              <FaCheck className="mr-1" /> Yes
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              <FaTimes className="mr-1" /> No
            </span>
          )}
        </div>
        
        {lead.machineryInterest && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Machinery Interest</h4>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{lead.machineryInterest}</p>
          </div>
        )}
        
        {lead.machineryNotes && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Machinery Notes</h4>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{lead.machineryNotes}</p>
          </div>
        )}
        
        {lead.machineryDetails && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Machinery Details</h4>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lead.machineryDetails.types && lead.machineryDetails.types.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Types</h5>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {lead.machineryDetails.types.map((type, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {lead.machineryDetails.brands && lead.machineryDetails.brands.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Brands</h5>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {lead.machineryDetails.brands.map((brand, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {lead.machineryDetails.condition && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Condition</h5>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{lead.machineryDetails.condition}</p>
                </div>
              )}
              
              {lead.machineryDetails.age && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Age</h5>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{lead.machineryDetails.age}</p>
                </div>
              )}
              
              {lead.machineryDetails.estimatedValue && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Estimated Value</h5>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">${lead.machineryDetails.estimatedValue.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {!lead.hasSurplusMachinery && 
         !lead.machineryInterest && 
         !lead.machineryNotes && 
         (!lead.machineryDetails || Object.keys(lead.machineryDetails).length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No machinery information available</p>
        )}
      </div>
    );
  };

  const renderAdditionalInfo = () => {
    return (
      <div>
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Additional Information</h4>
        {lead.additionalInfo && Object.keys(lead.additionalInfo).length > 0 ? (
          <div className="mt-4 border rounded-md overflow-hidden dark:border-gray-700">
            <div className="px-4 py-5 sm:p-6 bg-gray-50 dark:bg-gray-700">
              <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Raw Data</h5>
              <div className="mt-2 max-h-80 overflow-y-auto">
                <pre className="text-xs text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-3 rounded">
                  {JSON.stringify(lead.additionalInfo, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">No additional information available</p>
        )}
        <div className="mt-4">
          <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</h5>
          <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {new Date(lead.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="mt-2">
          <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Updated</h5>
          <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {new Date(lead.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div 
          className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full max-w-lg sm:w-full"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
        >
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-headline">
              {lead.firstName} {lead.lastName}
            </h3>
            <button
              type="button"
              className="bg-white dark:bg-gray-600 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:p-6">
            <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => handleTabChange('info')}
                  className={`${
                    activeTab === 'info'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Contact Information
                </button>
                <button
                  onClick={() => handleTabChange('machinery')}
                  className={`${
                    activeTab === 'machinery'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Machinery Information
                </button>
                <button
                  onClick={() => handleTabChange('additional')}
                  className={`${
                    activeTab === 'additional'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Additional Details
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'info' && renderContactInfo()}
              {activeTab === 'machinery' && renderMachineryInfo()}
              {activeTab === 'additional' && renderAdditionalInfo()}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2 -ml-1 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleEdit}
                >
                  <FaEdit className="mr-2 -ml-1 h-4 w-4" />
                  Edit {activeTab === 'machinery' ? 'Machinery Info' : 'Contact Info'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={onClose}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal; 