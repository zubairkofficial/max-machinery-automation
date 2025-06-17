import React from 'react';
import RetellAgentPrompt from '../components/RetellAgentPrompt';

const RetellAgentSettings: React.FC = () => {
  // In a real application, you would fetch this from your backend or environment variables
  const agentId = import.meta.env.VITE_RETELL_AGENT_ID || 'your-agent-id';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Retell Agent Settings</h1>
      <RetellAgentPrompt agentId={agentId} />
    </div>
  );
};

export default RetellAgentSettings; 