import React, { useState } from 'react';
import { Lead } from '../services/api';
import { FaTimes } from 'react-icons/fa';
import ContactInfo from './lead-detail/ContactInfo';
import MachineryInfo from './lead-detail/MachineryInfo';
import CallHistory from './lead-detail/CallHistory';
import AdditionalInfo from './lead-detail/AdditionalInfo';
import TabNavigation, { TabType } from './lead-detail/TabNavigation';

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
  const [activeTab, setActiveTab] = useState<TabType>('info');

  if (!isOpen || !lead) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <ContactInfo lead={lead} onLeadUpdated={onLeadUpdated} />;
      case 'machinery':
        return <MachineryInfo lead={lead} onLeadUpdated={onLeadUpdated} />;
      case 'calls':
        return <CallHistory lead={lead} />;
      case 'additional':
        return <AdditionalInfo lead={lead} />;
      default:
        return <ContactInfo lead={lead} onLeadUpdated={onLeadUpdated} />;
    }
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
          {/* Modal Header */}
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

          {/* Modal Body */}
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:p-6">
            {/* Tab Navigation */}
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <div className="mt-6">
              {renderTabContent()}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;