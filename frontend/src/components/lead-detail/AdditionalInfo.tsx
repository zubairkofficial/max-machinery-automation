import React from 'react';
import { Lead } from '../../services/api';
import { convertToEasternTime } from '../../utils/timeUtils';

interface AdditionalInfoProps {
  lead: Lead;
}

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({ lead }) => {
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
            {convertToEasternTime(lead.createdAt, 'MMM dd, yyyy hh:mm a')}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Updated</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {convertToEasternTime(lead.updatedAt, 'MMM dd, yyyy hh:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfo;