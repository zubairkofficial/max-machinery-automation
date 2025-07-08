import React, { useState, useEffect } from 'react';
import { 
  FaPhone, FaSpinner, FaClock, FaUserTie, FaBuilding, FaInfoCircle,
  FaCheckCircle, FaTimesCircle 
} from 'react-icons/fa';
import LeadCallScheduler from '../components/LeadCallScheduler';
import { api, Lead } from '../services/api';
import { retellService } from '../services/retell-service';
import { CallService } from '../services/call-service';
import toast from 'react-hot-toast';
import CallDetailPanel from '@/components/CallDetailPanel';

interface CallHistoryRecord {
  id: string;
  callId: string;
  callType: string;
  agentId: string;
  status: string;
  startTimestamp: number;
  endTimestamp?: number;
  fromNumber: string;
  toNumber: string;
  direction: string;
  telephonyIdentifier?: any;
  callQuality?: any;
  analytics?: any;
  sentiment?: any;
  latency?: any;
  callCost?: any;
}

interface LastCallRecord {
  id: string;
  callId: string;
  status: string;
  timestamp: string;
  lead_id: string;
}

const BatchCallPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [priorityLeads, setPriorityLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [isLoadingCallDetails, setIsLoadingCallDetails] = useState(false);
  const [callStats, setCallStats] = useState<{
    total: number;
    called: number;
    pending: number;
    lastCalled?: string;
  }>({ total: 0, called: 0, pending: 0 });

  // Function to extract phone number from different sources
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

  // Check if a lead has a valid phone number
  const hasPhoneNumber = (lead: Lead): boolean => {
    return !!getLeadPhoneNumber(lead);
  };

  const fetchCallDetails = async (callId: string) => {
    try {
      setIsLoadingCallDetails(true);
      const callDetails = await CallService.getCallById(callId);
      return callDetails;
    } catch (error: any) {
      console.error('Error fetching call details:', error);
      toast.error(error.message || 'Failed to load call details');
      return null;
    } finally {
      setIsLoadingCallDetails(false);
    }
  };

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setIsLoading(true);
        
        // Fetch priority leads
        const priorityResult = await api.getPriority(1, 100);
        setPriorityLeads(priorityResult.data);
        
        // Fetch all leads
        const allResult = await api.getAll(1, 100);
        setAllLeads(allResult.data);
        
        // Calculate call stats
        const called = allResult.data.filter(lead => lead.contacted).length;
        const total = allResult.data.length;
        
        // Find the most recent call
        let lastCalled;
        const calledLeads = allResult.data.filter(lead => 
          lead.lastCallRecord || (lead.callHistoryRecords && lead.callHistoryRecords.length > 0)
        );
        
        if (calledLeads.length > 0) {
          // Sort leads by last call time
          calledLeads.sort((a, b) => {
            const aTime = a.lastCallRecord?.timestamp || 0;
            const bTime = b.lastCallRecord?.timestamp || 0;
            return Number(bTime) - Number(aTime);
          });
          
          const mostRecent = calledLeads[0];
          const lastCallTime = new Date(Number(mostRecent.lastCallRecord?.timestamp));
          lastCalled = `${mostRecent.firstName}  at ${lastCallTime.toLocaleString()}`;
        }
        
        setCallStats({
          total,
          called,
          pending: total - called,
          lastCalled
        });
      } catch (error) {
        console.error('Failed to fetch leads:', error);
        toast.error('Failed to load leads data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const handleCallComplete = (result: any) => {
    if (result.scheduled > 0) {
      toast.success(`Successfully initiated ${result.scheduled} calls`);
      
      // Update call stats
      setCallStats(prev => ({
        ...prev,
        called: prev.called + result.scheduled,
        pending: prev.pending - result.scheduled,
        lastCalled: new Date().toLocaleString()
      }));
      
      // Refresh lead data after making calls
      api.getAll(1, 100).then(result => {
        setAllLeads(result.data);
      });
      
      api.getPriority(1, 100).then(result => {
        setPriorityLeads(result.data);
      });
    } else if (result.errors && result.errors.length > 0) {
      toast.error(`Failed to schedule calls: ${result.errors[0].message}`);
    }
  };

  const handleCallClick = async (lead: Lead, phoneNumber: string) => {
    if (!phoneNumber) {
      toast.error('No phone number available for this lead');
      return;
    }

    try {
      const formattedPhone = phoneNumber.replace(/[^0-9+]/g, '');
      const result = await api.callSingleLead(lead.id, {
        toNumber: formattedPhone,
        override_agent_id: import.meta.env.VITE_AGENT_ID || 'agent_b6a6e23b739cde06fbe109a217'
      });
      if(result){
        toast.success(`Calling ${lead.firstName} ${lead.lastName} successfully transferred to retell`);
      }
console.log("result====",result.scheduled)
      // if (result.scheduled > 0) {
      //   toast.success(`Calling ${lead.firstName} ${lead.lastName}`);
        
      //   // Start polling for call updates
      //   const pollInterval = setInterval(async () => {
      //     try {
      //       const updatedLead = await api.findOne(lead.id);
      //       const latestCall = updatedLead.lastCallRecord;
            
      //       if (latestCall && (latestCall.status === 'registered' || latestCall.status === 'ended')) {
      //         clearInterval(pollInterval);
              
      //         // Get detailed call information
      //         const callDetails = await fetchCallDetails(latestCall.callId);
              
      //         if (callDetails) {
      //           setSelectedCall({
      //             ...callDetails,
      //             leadName: `${lead.firstName} ${lead.lastName}`,
      //             leadCompany: lead.company,
      //             phoneNumber: phoneNumber
      //           });
      //         }
      //       }
      //     } catch (error) {
      //       console.error('Error polling call status:', error);
      //     }
      //   }, 5000); // Poll every 5 seconds

      //   // Update local state to reflect the call
      //   setAllLeads(prev => 
      //     prev.map(l => 
      //       l.id === lead.id 
      //         ? { ...l, contacted: true } 
      //         : l
      //     )
      //   );
      // } else {
      //   toast.error('Failed to initiate call');
      // }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleViewCallDetails = async (lead: Lead, callRecord: CallHistoryRecord) => {
    try {
      setIsLoadingCallDetails(true);
      const callDetails = await fetchCallDetails(callRecord.callId);
      
      if (callDetails) {
        setSelectedCall({
          ...callDetails,
          leadName: `${lead.firstName} ${lead.lastName}`,
          leadCompany: lead.company,
          phoneNumber: callRecord.toNumber
        });
      }
    } catch (error) {
      console.error('Error fetching call details:', error);
      toast.error('Failed to load call details');
    } finally {
      setIsLoadingCallDetails(false);
    }
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Lead Calling Center
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-2">
            <FaPhone className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Total Calls
            </h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{callStats.called}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Out of {callStats.total} leads</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-2">
            <FaUserTie className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Pending Calls
            </h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{callStats.pending}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Leads not yet contacted</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-2">
            <FaClock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Last Called
            </h2>
          </div>
          <p className="text-md font-medium text-gray-900 dark:text-white">
            {callStats.lastCalled || "No calls made yet"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <LeadCallScheduler onCallComplete={handleCallComplete} />
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Recent Leads
            </h3>
            
            <div className="space-y-3">
              {allLeads.slice(0, 5).map(lead => {
                const phoneNumber = getLeadPhoneNumber(lead);
                return (
                  <div 
                    key={lead.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {lead.jobTitle} at {lead.company}
                      </p>
                      {phoneNumber && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {phoneNumber}
                          {!lead.phone && lead.additionalInfo?.rawData?.organization && (
                            <span className="ml-2 text-xs text-gray-500">
                              (Company)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {lead.lastCallRecord && (
                        <button
                          onClick={() => handleViewCallDetails(lead, lead.callHistoryRecords[lead.callHistoryRecords.length - 1])}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <FaInfoCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleCallClick(lead, phoneNumber!)}
                        disabled={!phoneNumber}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          !phoneNumber 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        }`}
                      >
                        <FaPhone className="mr-1 h-3 w-3" />
                        Call
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {isLoadingCallDetails ? (
            <div className="flex justify-center items-center h-32">
              <FaSpinner className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
          ) : selectedCall ? (
            <CallDetailPanel call={selectedCall} onClose={() => setSelectedCall(null)} />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Call History
              </h3>
              
              <div className="space-y-3">
                {allLeads
                  .filter(lead => lead.callHistoryRecords && lead.callHistoryRecords.length > 0)
                  .slice(0, 5)
                  .map(lead => {
                    const lastCall = lead.callHistoryRecords[lead.callHistoryRecords.length - 1];
                    return (
                      <div 
                        key={lead.id}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => handleViewCallDetails(lead, lastCall)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Called: {new Date(lastCall.createdAt).toLocaleString()}
                            </p>
                            {lastCall.leadPhone && (
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                To: {lastCall.leadPhone}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            lastCall.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                              : lastCall.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                          }`}>
                            {lastCall.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                }
                
                {allLeads.filter(lead => lead.callHistoryRecords && lead.callHistoryRecords.length > 0).length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No call history available yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchCallPage; 