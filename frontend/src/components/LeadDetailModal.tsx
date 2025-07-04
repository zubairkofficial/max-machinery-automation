import React, { useState } from 'react';
import { Lead, leadsApi } from '../services/api';
import { FaPhone, FaEnvelope, FaLinkedin, FaBuilding, FaMapMarkerAlt, FaEdit, FaTimes, FaSave, FaUserTie } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import LeadCallScheduler from './LeadCallScheduler';

interface CallHistoryItem {
  callTime: string;
  fromNumber: string;
  status: string;
  callId?: string;
}

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [machineryInfo, setMachineryInfo] = useState({
    hasSurplusMachinery: lead?.hasSurplusMachinery || false,
    machineryInterest: lead?.machineryInterest || '',
    machineryNotes: lead?.machineryNotes || '',
    machineryDetails: {
      types: lead?.machineryDetails?.types || [],
      brands: lead?.machineryDetails?.brands || [],
      condition: lead?.machineryDetails?.condition || '',
      age: lead?.machineryDetails?.age || '',
      estimatedValue: lead?.machineryDetails?.estimatedValue || 0,
    },
  });

  React.useEffect(() => {
    if (lead) {
      setMachineryInfo({
        hasSurplusMachinery: lead.hasSurplusMachinery || false,
        machineryInterest: lead.machineryInterest || '',
        machineryNotes: lead.machineryNotes || '',
        machineryDetails: {
          types: lead.machineryDetails?.types || [],
          brands: lead.machineryDetails?.brands || [],
          condition: lead.machineryDetails?.condition || '',
          age: lead.machineryDetails?.age || '',
          estimatedValue: lead.machineryDetails?.estimatedValue || 0,
        },
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setMachineryInfo(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, any>,
          [child]: value,
        },
      }));
    } else {
      setMachineryInfo(prev => ({
        ...prev,
        [name]: name === 'hasSurplusMachinery' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleTypesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.split(',').map(type => type.trim());
    setMachineryInfo(prev => ({
      ...prev,
      machineryDetails: {
        ...prev.machineryDetails,
        types: value,
      },
    }));
  };

  const handleBrandsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.split(',').map(brand => brand.trim());
    setMachineryInfo(prev => ({
      ...prev,
      machineryDetails: {
        ...prev.machineryDetails,
        brands: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      const updatedLead = await leadsApi.updateMachineryInfo(lead.id, machineryInfo);
      onLeadUpdated(updatedLead);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCallComplete = (result: any) => {
    if (result.scheduled > 0) {
      toast.success(`Successfully initiated call to ${lead.firstName} `);
      // Refresh the lead data to show updated call history
      leadsApi.getById(lead.id).then(updatedLead => {
        onLeadUpdated(updatedLead);
      });
    } else if (result.errors && result.errors.length > 0) {
      toast.error(`Failed to call lead: ${result.errors[0].message}`);
    }
  };

  const getLeadPhoneNumber = (lead: Lead): string | null => {
    // First check if lead has a direct phone number
    if (lead.phone) return lead.phone;
    
    // Then try to extract from additionalInfo
    if (lead.additionalInfo) {
      try {
        // Try to get from rawData.organization.phone
        if (lead.additionalInfo.rawData?.organization?.phone) {
          return lead.additionalInfo.rawData.organization.phone;
        }
        
        // Try to get from rawData.organization.primary_phone.number
        else if (lead.additionalInfo.rawData?.organization?.primary_phone?.number) {
          return lead.additionalInfo.rawData.organization.primary_phone.number;
        }
        
        // Try to get from rawData.organization.sanitized_phone
        else if (lead.additionalInfo.rawData?.organization?.sanitized_phone) {
          return lead.additionalInfo.rawData.organization.sanitized_phone;
        }
        
        // Finally, try to get directly from rawData
        else if (lead.additionalInfo.rawData?.phone) {
          return lead.additionalInfo.rawData.phone;
        }
      } catch (error) {
        console.warn('Failed to extract phone from additionalInfo:', error);
      }
    }
    
    return null;
  };

  const renderContactInfo = () => {
    const phoneNumber = getLeadPhoneNumber(lead);
    
    return (
      <div className="space-y-4">
        <div className="flex items-start">
          <FaUserTie className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Job Title</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{lead.jobTitle || 'Not available'}</p>
          </div>
        </div>

        <div className="flex items-start">
          <FaBuilding className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Company</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{lead.company || 'Not available'}</p>
            {lead.industry && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Industry: {lead.industry}</p>
            )}
          </div>
        </div>

        <div className="flex items-start">
          <FaPhone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Phone</h4>
            {phoneNumber ? (
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {phoneNumber}
                  {!lead.phone && lead.additionalInfo?.rawData?.organization && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">
                      (Company)
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    leadsApi.callSingleLead(lead.id, { 
                      toNumber: phoneNumber || '',
                      override_agent_id: import.meta.env.VITE_AGENT_ID || 'agent_b6a6e23b739cde06fbe109a217'
                    })
                      .then((result: { scheduled: number; callDetails?: any[] }) => {
                        if (result.scheduled > 0 || (result.callDetails && result.callDetails.length > 0)) {
                          toast.success(`Successfully initiated call to ${lead.firstName}`);
                          onLeadUpdated(lead);
                        } else {
                          toast.error('Failed to initiate call');
                        }
                      })
                      .catch((error: Error) => {
                        toast.error(`Error: ${error.message}`);
                      });
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaPhone className="mr-1 h-3 w-3" /> Call Now
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-500">Not available</p>
            )}
          </div>
        </div>

        <div className="flex items-start">
          <FaEnvelope className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Email</h4>
            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {lead.email}
              </a>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-500">Not available</p>
            )}
          </div>
        </div>

        <div className="flex items-start">
          <FaMapMarkerAlt className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Location</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{lead.location || 'Not available'}</p>
          </div>
        </div>

        {lead.linkedinUrl && (
          <div className="flex items-start">
            <FaLinkedin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">LinkedIn</h4>
              <a
                href={lead.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Profile
              </a>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMachineryInfo = () => {
    if (isEditing) {
      return (
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="hasSurplusMachinery"
                name="hasSurplusMachinery"
                checked={machineryInfo.hasSurplusMachinery}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="hasSurplusMachinery" className="font-medium text-gray-700 dark:text-gray-300">
                Has Surplus Machinery
              </label>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Check if this lead has surplus machinery available for sale or liquidation
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="machineryInterest" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Machinery Interest
            </label>
            <input
              type="text"
              id="machineryInterest"
              name="machineryInterest"
              value={machineryInfo.machineryInterest}
              onChange={handleChange}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="CNC Machines, Industrial Equipment, etc."
            />
          </div>

          <div>
            <label htmlFor="machineryNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Machinery Notes
            </label>
            <textarea
              id="machineryNotes"
              name="machineryNotes"
              rows={4}
              value={machineryInfo.machineryNotes}
              onChange={handleChange}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Details about the machinery, condition, etc."
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Machinery Details</h4>
            
            <div>
              <label htmlFor="machineryTypes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Types (comma separated)
              </label>
              <input
                type="text"
                id="machineryTypes"
                name="machineryTypes"
                value={machineryInfo.machineryDetails.types.join(', ')}
                onChange={handleTypesChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="CNC, Lathe, Mill, etc."
              />
            </div>
            
            <div>
              <label htmlFor="machineryBrands" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Brands (comma separated)
              </label>
              <input
                type="text"
                id="machineryBrands"
                name="machineryBrands"
                value={machineryInfo.machineryDetails.brands.join(', ')}
                onChange={handleBrandsChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Haas, Okuma, DMG Mori, etc."
              />
            </div>
            
            <div>
              <label htmlFor="machineryDetails.condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Condition
              </label>
              <select
                id="machineryDetails.condition"
                name="machineryDetails.condition"
                value={machineryInfo.machineryDetails.condition}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select condition</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="machineryDetails.age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Age
              </label>
              <input
                type="text"
                id="machineryDetails.age"
                name="machineryDetails.age"
                value={machineryInfo.machineryDetails.age}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="5 years, 10+ years, etc."
              />
            </div>
            
            <div>
              <label htmlFor="machineryDetails.estimatedValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Estimated Value ($)
              </label>
              <input
                type="number"
                id="machineryDetails.estimatedValue"
                name="machineryDetails.estimatedValue"
                value={machineryInfo.machineryDetails.estimatedValue || ''}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="25000"
              />
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Surplus Machinery:</h4>
          {lead?.hasSurplusMachinery ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              No
            </span>
          )}
        </div>
        
        {lead?.machineryInterest && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Machinery Interest</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{lead.machineryInterest}</p>
          </div>
        )}
        
        {lead?.machineryNotes && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Machinery Notes</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{lead.machineryNotes}</p>
          </div>
        )}
        
        {lead?.machineryDetails && Object.keys(lead.machineryDetails).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Machinery Details</h4>
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
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{lead.machineryDetails.condition}</p>
                </div>
              )}
              
              {lead.machineryDetails.age && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Age</h5>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{lead.machineryDetails.age}</p>
                </div>
              )}
              
              {lead.machineryDetails.estimatedValue && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Estimated Value</h5>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">${lead.machineryDetails.estimatedValue.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {(!lead?.hasSurplusMachinery && 
          !lead?.machineryInterest && 
          !lead?.machineryNotes && 
          (!lead?.machineryDetails || Object.keys(lead?.machineryDetails || {}).length === 0)) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No machinery information available</p>
        )}
      </div>
    );
  };
  
  const renderAdditionalInfo = () => {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Lead Source</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{lead.source || lead.leadSource || 'Unknown'}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Lead Status</h4>
          <div className="mt-1 flex items-center">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              lead.status === 'qualified' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
              lead.status === 'contacted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
              lead.status === 'not-interested' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {lead.status ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1) : 'New'}
            </span>
          </div>
        </div>
        
        {lead.additionalInfo && Object.keys(lead.additionalInfo).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional Data</h4>
            <div className="mt-1 max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
              <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(lead.additionalInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {new Date(lead.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Updated</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {new Date(lead.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div 
          className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
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
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`${
                    activeTab === 'info'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
                >
                  Contact Information
                </button>
                <button
                  onClick={() => setActiveTab('machinery')}
                  className={`${
                    activeTab === 'machinery'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
                >
                  Machinery Information
                </button>
                <button
                  onClick={() => setActiveTab('call')}
                  className={`${
                    activeTab === 'call'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
                >
                  Call Lead
                </button>
                <button
                  onClick={() => setActiveTab('additional')}
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
              {activeTab === 'call' && (
                <div className="space-y-4">
                  <LeadCallScheduler 
                    leadId={lead.id} 
                    onCallComplete={handleCallComplete} 
                  />
                  
                  {/* Call History Section */}
                  <div className="mt-6">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Call History</h3>
                    {(lead.additionalInfo?.callHistory as CallHistoryItem[] | undefined)?.length ? (
                      <div className="space-y-2">
                        {(lead.additionalInfo?.callHistory as CallHistoryItem[]).map((call, index) => (
                          <div 
                            key={index} 
                            className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600"
                          >
                            <p className="text-sm">
                              <span className="font-medium">Time:</span> {new Date(call.callTime).toLocaleString()}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">From:</span> {call.fromNumber}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Status:</span> {call.status}
                            </p>
                            {call.callId && (
                              <p className="text-sm">
                                <span className="font-medium">Call ID:</span> {call.callId}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No call history available for this lead.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'additional' && renderAdditionalInfo()}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
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
                {activeTab !== 'call' && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleEdit}
                  >
                    <FaEdit className="mr-2 -ml-1 h-4 w-4" />
                    Edit {activeTab === 'machinery' ? 'Machinery Info' : 'Contact Info'}
                  </button>
                )}
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