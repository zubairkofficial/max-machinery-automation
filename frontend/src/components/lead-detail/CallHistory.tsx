import React, { useState } from 'react';
import { Lead, leadsApi } from '../../services/api';
import { FaHistory, FaFileAlt, FaMoneyBill, FaUserTie } from 'react-icons/fa';
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

interface CallHistoryProps {
  lead: Lead;
}

const CallHistory: React.FC<CallHistoryProps> = ({ lead }) => {
  const [selectedCallDetail, setSelectedCallDetail] = useState<CallDetail | null>(null);
  const [isLoadingCallDetail, setIsLoadingCallDetail] = useState(false);

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
                    {item.words[0] && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(item.words[0]?.start * 1000).toISOString().substr(11, 8)}
                      </p>
                    )}
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

export default CallHistory;