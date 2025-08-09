import React from 'react';
import { Lead, leadsApi } from '../../services/api';
import { FaPhone, FaEnvelope, FaLinkedin, FaBuilding, FaMapMarkerAlt, FaUserTie } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface ContactInfoProps {
  lead: Lead;
  onLeadUpdated: (updatedLead: Lead) => void;
}

const ContactInfo: React.FC<ContactInfoProps> = ({ lead, onLeadUpdated }) => {
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

export default ContactInfo;