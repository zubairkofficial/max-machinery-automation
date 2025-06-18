import React from 'react';
import RetellLLMEditor from '../components/RetellLLMEditor';

const RetellLLMPage: React.FC = () => {
  // You can make this configurable or fetch from an API
  const llmId = 'llm_bec730a8baacffdb13ec0cc522a4';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Retell AI LLM Management</h1>
      <RetellLLMEditor llmId={llmId} />
    </div>
  );
};

export default RetellLLMPage; 