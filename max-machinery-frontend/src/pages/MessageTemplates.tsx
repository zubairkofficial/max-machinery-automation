import React from 'react';
import MessageTemplatesManager from '../components/templates/MessageTemplatesManager';

const MessageTemplates: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
          <MessageTemplatesManager />
        </div>
      </div>
    </div>
  );
};

export default MessageTemplates; 