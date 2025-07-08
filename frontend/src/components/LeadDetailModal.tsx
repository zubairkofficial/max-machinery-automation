import React, { useState } from 'react';
import { Lead, leadsApi } from '../services/api';
import { FaPhone, FaEnvelope, FaLinkedin, FaBuilding, FaMapMarkerAlt, FaEdit, FaTimes, FaSave, FaUserTie, FaHistory, FaFileAlt, FaMoneyBill } from 'react-icons/fa';
import toast from 'react-hot-toast';


interface CallDetail {
  call_id: string;
  call_type: string;
  agent_id: string;
  agent_version: number;
  agent_name: string;
  retell_llm_dynamic_variables: {
    lead_name: string;
    contact_info: string;
    follow_up_weeks: string;
    consultation_link: string;
  };
  call_status: string;
  start_timestamp: number;
  end_timestamp: number;
  duration_ms: number;
  public_log_url: string;
  disconnection_reason: string;
  transcript?: string;
  call_cost: {
    total_duration_unit_price: number;
    product_costs: any[];
    combined_cost: number;
    total_duration_seconds: number;
  };
  call_analysis: {
    in_voicemail: boolean;
    call_summary: string;
    user_sentiment: string;
    custom_analysis_data: any;
    call_successful: boolean;
  };
  from_number: string;
  to_number: string;
  direction: string;
  telephony_identifier: {
    twilio_call_sid: string;
  };
  lead?: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string;
    email: string | null;
    status: string;
    contacted: boolean;
    zohoEmail: string;
    zohoPhoneNumber: string;
    scheduledCallbackDate: string;
    company: string | null;
    industry: string | null;
    linkClicked: boolean;
    formSubmitted: boolean;
  };
  transcript_object?: Array<{
    role: string;
    content: string;
    words: Array<{
      word: string;
      start: number;
      end: number;
    }>;
    metadata?: {
      response_id?: number;
    };
  }>;
  recording_url?: string;
  llm_token_usage?: {
    values: number[];
    average: number;
    num_requests: number;
  };
  latency?: {
    llm: {
      p99: number;
      min: number;
      max: number;
      p90: number;
      num: number;
      values: number[];
      p50: number;
      p95: number;
    };
    e2e: {
      p99: number;
      min: number;
      max: number;
      p90: number;
      num: number;
      values: number[];
      p50: number;
      p95: number;
    };
    tts: {
      p99: number;
      min: number;
      max: number;
      p90: number;
      num: number;
      values: number[];
      p50: number;
      p95: number;
    };
  };
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
  const [selectedCallDetail, setSelectedCallDetail] = useState<CallDetail | null>(null);
  const [isLoadingCallDetail, setIsLoadingCallDetail] = useState(false);
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
      setSelectedCallDetail(null)
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

  const fetchCallDetail = async (callId: string) => {
    setIsLoadingCallDetail(true);
    try {
      const detail = await leadsApi.getCallDetail(callId);
      setSelectedCallDetail(detail);
    } catch (error) {
      console.error('Error fetching call detail:', error);
      toast.error('Failed to load call details');
    } finally {
      setIsLoadingCallDetail(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (!ms) return 'Not connected';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(cost);
  };

  const renderCallHistory = () => {
    const callHistory = lead?.lastCallRecord ? [lead.lastCallRecord] : [];
    
    if (isLoadingCallDetail) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Call List */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Call History</h3>
          {callHistory.length > 0 ? (
            <div className="space-y-4">
              {callHistory.map((call) => (
                <div 
                  key={call.id}
                  className="bg-white dark:bg-gray-700 shadow rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Call ID: {call.callId}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Status: {call.status}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Date: {new Date(parseInt(call.timestamp)).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => fetchCallDetail(call.callId)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FaFileAlt className="mr-1.5 h-4 w-4" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No call history available
            </p>
          )}
        </div>

        {/* Call Details */}
        {selectedCallDetail && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Call Details</h4>
            
            {/* Lead Status */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Lead Status</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Link Status:</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedCallDetail.lead?.linkClicked 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}>
                    {selectedCallDetail.lead?.linkClicked ? 'Link Clicked' : 'Not Clicked'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Form Status:</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedCallDetail.lead?.formSubmitted 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}>
                    {selectedCallDetail.lead?.formSubmitted ? 'Form Submitted' : 'Not Submitted'}
                  </span>
                </div>
              </div>
            </div>

            {/* Call Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center">
                  <FaHistory className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDuration(selectedCallDetail.duration_ms)}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center">
                  <FaMoneyBill className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCost(selectedCallDetail.call_cost.combined_cost/100) || 0}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center">
                  <FaUserTie className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedCallDetail.call_status}
                </p>
              </div>
            </div>

            {/* Transcript */}
            {selectedCallDetail.transcript_object && (
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-4">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Detailed Transcript</h5>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedCallDetail.transcript_object.map((item, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${
                        item.role === 'agent' 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : 'bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {item.role === 'agent' ? 'Agent' : 'User'}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {item.content}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(item.words[0]?.start * 1000).toISOString().substr(11, 8)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call Analysis */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Call Analysis</h5>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Summary:</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedCallDetail.call_analysis.call_summary}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Sentiment:</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedCallDetail.call_analysis.user_sentiment}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Success:</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedCallDetail.call_analysis.call_successful
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}>
                    {selectedCallDetail.call_analysis.call_successful ? 'Successful' : 'Not Successful'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recording */}
            {selectedCallDetail.recording_url && (
              <div className="mt-4">
                <a
                  href={selectedCallDetail.recording_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <FaFileAlt className="mr-2 h-4 w-4" />
                  Listen to Recording
                </a>
              </div>
            )}
          </div>
        )}
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
                  onClick={() => setActiveTab('calls')}
                  className={`${
                    activeTab === 'calls'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
                >
                  Call History
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
              {activeTab === 'calls' && renderCallHistory()}
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