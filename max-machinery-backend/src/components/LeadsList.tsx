import React from 'react';
import { Lead } from '../services/api';
import { 
  FaPhone, 
  FaEnvelope, 
  FaLinkedin, 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaCheck, 
  FaExclamationCircle,
  FaRegClock,
  FaTag,
  FaUserTie
} from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

interface LeadsListProps {
  leads: Lead[];
  isLoading: boolean;
  onViewDetails: (lead: Lead) => void;
}

const LeadsList: React.FC<LeadsListProps> = ({ leads, isLoading, onViewDetails }) => {
  const { theme } = useTheme();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <FaExclamationCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No leads found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search parameters or import new leads from Apollo.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string, hasMachinery: boolean) => {
    let colorClass = '';
    let statusText = status || 'New';
    let icon = null;

    switch (statusText.toLowerCase()) {
      case 'new':
        colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        icon = <FaRegClock className="mr-1" />;
        break;
      case 'contacted':
        colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        icon = <FaPhone className="mr-1" />;
        break;
      case 'qualified':
        colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        icon = <FaCheck className="mr-1" />;
        break;
      case 'not-interested':
        colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        icon = <FaExclamationCircle className="mr-1" />;
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        icon = <FaTag className="mr-1" />;
    }

    const badge = (
      <span className={`flex items-center px-2 py-1 text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
        {icon}
        {statusText}
      </span>
    );

    // Add the machinery badge if applicable
    const machineryBadge = hasMachinery ? (
      <span className="flex items-center px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 mr-2">
        <FaCheck className="mr-1" /> Has Machinery
      </span>
    ) : null;

    return (
      <div className="flex flex-wrap gap-2">
        {machineryBadge}
        {badge}
      </div>
    );
  };

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 rounded-md">
        {leads.map((lead) => (
          <li key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
            <div 
              className="cursor-pointer p-4" 
              onClick={() => onViewDetails(lead)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-300">
                      {lead.firstName && lead.lastName ? (
                        <span className="text-lg font-medium">
                          {lead.firstName.charAt(0)}
                          {lead.lastName.charAt(0)}
                        </span>
                      ) : (
                        <FaUserTie className="h-6 w-6" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-indigo-600 dark:text-indigo-400 truncate">
                      {lead.firstName} {lead.lastName}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <FaBuilding className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <p className="truncate">
                        {lead.jobTitle || 'Unknown'} {lead.company ? `at ${lead.company}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  {getStatusBadge(lead.status, !!lead.hasSurplusMachinery)}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex flex-col space-y-2">
                  {lead.email && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FaEnvelope className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <p className="truncate">{lead.email}</p>
                    </div>
                  )}
                  
                  {lead.phone && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FaPhone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <p>{lead.phone}</p>
                    </div>
                  )}
                  
                  {lead.linkedinUrl && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FaLinkedin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <p className="truncate">LinkedIn Profile</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  {lead.location && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <p className="truncate">{lead.location}</p>
                    </div>
                  )}
                  
                  {lead.industry && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {lead.industry}
                      </span>
                    </div>
                  )}
                  
                  {lead.machineryDetails && (
                    <div className="mt-2">
                      {lead.machineryDetails.types && lead.machineryDetails.types.map((type, idx) => (
                        <span key={idx} className="inline-flex items-center mr-1 mb-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {lead.machineryNotes && (
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <p className="line-clamp-2">{lead.machineryNotes}</p>
                </div>
              )}
              
              <div className="mt-2 flex justify-end">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(lead);
                  }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  View Details
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeadsList; 