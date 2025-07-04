import React, { useState } from 'react';
import { FaPlay, FaPause, FaDownload, FaFileAlt, FaRobot, FaChartLine, FaUsers, FaPhone, FaClock, FaExternalLinkAlt, FaCheckCircle, FaTimesCircle, FaSmile, FaMeh, FaFrown } from 'react-icons/fa';
import { CallHistory } from '../types/call-history';

interface CallDetailPanelProps {
  call: CallHistory;
  onClose: () => void;
}

interface ProductCost {
  product: string;
  cost: number;
  unit_price: number;
}

interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

interface TranscriptEntry {
  role: string;
  content: string;
  words?: TranscriptWord[];
  metadata?: {
    response_id?: number;
  };
}

interface CallAnalysis {
  call_successful?: boolean;
  user_sentiment?: string;
  call_summary?: string;
  in_voicemail?: boolean;
  custom_analysis_data?: any;
}

interface LatencyData {
  llm?: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    num: number;
    values: number[];
  };
  tts?: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    num: number;
    values: number[];
  };
  e2e?: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    num: number;
    values: number[];
  };
}

interface CallCost {
  total_duration_seconds?: number;
  total_duration_unit_price?: number;
  combined_cost?: number;
  product_costs?: ProductCost[];
}

const formatTimestamp = (timestamp: string | number): string => {
  try {
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return 'Invalid timestamp';
  }
};

const formatDuration = (durationMs: number): string => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return <FaSmile className="text-green-500" />;
    case 'negative':
      return <FaFrown className="text-red-500" />;
    default:
      return <FaMeh className="text-yellow-500" />;
  }
};

const CallDetailPanel: React.FC<CallDetailPanelProps> = ({ call, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showDetailedTranscript, setShowDetailedTranscript] = useState(false);
  const [expandedWordIndex, setExpandedWordIndex] = useState<number | null>(null);

  // Parse additional call data
  const callAnalysis: CallAnalysis = call.call_analysis || {};
  const latency: LatencyData = call.latency || {};
  const callCost: CallCost = call.call_cost || {};
  const transcriptObject: TranscriptEntry[] = call.transcript_object || [];
  const retellDynamicVars = call.retell_llm_dynamic_variables || {};

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (call.recording_url) {
      window.open(call.recording_url, '_blank');
    }
  };

  const toggleWordDetails = (index: number) => {
    setExpandedWordIndex(expandedWordIndex === index ? null : index);
  };

  const duration = call.duration_ms || (call.endTimestamp - call.startTimestamp);
  const totalDuration = formatDuration(duration);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <FaPhone className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatTimestamp(call.startTimestamp)} {call.call_type || 'phone_call'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Agent: {call.agent_name || 'Unknown'} | Version {call.agent_version} | Call ID: {call.call_id?.substring(0, 20)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            
            {/* Call Summary Section */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Phone Call</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {call.from_number} → {call.to_number}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Duration</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatTimestamp(call.startTimestamp)} - {formatTimestamp(call.endTimestamp)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Duration</span>
                  <p className="font-medium text-gray-900 dark:text-white">{totalDuration}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Cost</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {callCost.combined_cost ? formatCurrency(callCost.combined_cost) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Audio Player */}
            {call.recording_url && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePlayPause}
                    className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded">
                        <div className="h-1 bg-blue-600 rounded" style={{ width: '0%' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{totalDuration}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    <FaDownload />
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Analysis */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FaChartLine className="mr-2 text-green-600" />
                Conversation Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Preset</span>
                  <div className="ml-auto flex items-center space-x-1">
                    {callAnalysis.call_successful ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaTimesCircle className="text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {callAnalysis.call_successful ? 'Successful' : 'Failed'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Call Status</span>
                  <div className="ml-auto">
                    <span className="text-sm font-medium capitalize">{call.status || 'Ended'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">User Sentiment</span>
                  <div className="ml-auto flex items-center space-x-1">
                    {getSentimentIcon(callAnalysis.user_sentiment || '')}
                    <span className="text-sm font-medium">{callAnalysis.user_sentiment || 'Neutral'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Disconnection Reason</span>
                  <div className="ml-auto">
                    <span className="text-sm font-medium">{call.disconnection_reason || 'User hangup'}</span>
                  </div>
                </div>

                {latency.e2e && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">End to End Latency</span>
                    <div className="ml-auto">
                      <span className="text-sm font-medium">{latency.e2e.p50}ms</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {callAnalysis.call_summary && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Summary</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {callAnalysis.call_summary}
                </p>
              </div>
            )}

            {/* Agent Information */}
            {call.agent_name && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                  <FaRobot className="mr-2" />
                  Agent Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Agent ID:</span>
                    <p className="text-blue-800 dark:text-blue-200">{call.agent_id}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Agent Name:</span>
                    <p className="text-blue-800 dark:text-blue-200">{call.agent_name}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Version:</span>
                    <p className="text-blue-800 dark:text-blue-200">{call.agent_version}</p>
                  </div>
                </div>

                {/* Dynamic Variables */}
                {Object.keys(retellDynamicVars).length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Dynamic Variables</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(retellDynamicVars).map(([key, value]) => (
                        <div key={key} className="bg-blue-100 dark:bg-blue-800/30 p-2 rounded">
                          <span className="text-blue-700 dark:text-blue-300 font-medium">{key}:</span>
                          <p className="text-blue-800 dark:text-blue-200">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Performance Metrics */}
            {latency && Object.keys(latency).length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-3 flex items-center">
                  <FaClock className="mr-2" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {latency.llm && (
                    <div className="bg-purple-100 dark:bg-purple-800/30 p-3 rounded">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">LLM Latency</h4>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>P50:</span>
                          <span>{latency.llm.p50}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>P90:</span>
                          <span>{latency.llm.p90}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max:</span>
                          <span>{latency.llm.max}ms</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {latency.tts && (
                    <div className="bg-purple-100 dark:bg-purple-800/30 p-3 rounded">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">TTS Latency</h4>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>P50:</span>
                          <span>{latency.tts.p50}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>P90:</span>
                          <span>{latency.tts.p90}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max:</span>
                          <span>{latency.tts.max}ms</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {latency.e2e && (
                    <div className="bg-purple-100 dark:bg-purple-800/30 p-3 rounded">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">End-to-End</h4>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>P50:</span>
                          <span>{latency.e2e.p50}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>P90:</span>
                          <span>{latency.e2e.p90}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max:</span>
                          <span>{latency.e2e.max}ms</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cost Breakdown */}
            {callCost && callCost.product_costs && callCost.product_costs.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-3 flex items-center">
                  <FaChartLine className="mr-2" />
                  Cost Breakdown
                </h3>
                <div className="space-y-2">
                  {callCost.product_costs.map((cost, index) => (
                    <div key={index} className="flex justify-between items-center bg-green-100 dark:bg-green-800/30 p-2 rounded">
                      <span className="text-green-800 dark:text-green-200 capitalize">
                        {cost.product.replace(/_/g, ' ')}
                      </span>
                      <span className="text-green-900 dark:text-green-100 font-medium">
                        {formatCurrency(cost.cost)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center font-medium text-green-900 dark:text-green-100 border-t border-green-200 dark:border-green-700 pt-2">
                    <span>Total Cost:</span>
                    <span>{formatCurrency(callCost.combined_cost || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <FaFileAlt className="mr-2 text-gray-600" />
                  Transcription
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowDetailedTranscript(false)}
                    className={`px-3 py-1 text-xs rounded ${!showDetailedTranscript 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    Data
                  </button>
                  <button
                    onClick={() => setShowDetailedTranscript(true)}
                    className={`px-3 py-1 text-xs rounded ${showDetailedTranscript 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  >
                    Detail Logs
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {!showDetailedTranscript ? (
                  // Simple transcript view
                  call.transcript ? (
                    call.transcript.split('\n').map((line, index) => {
                      const isAgent = line.startsWith('Agent:');
                      const isUser = line.startsWith('User:');
                      const timestamp = `${Math.floor(index * 10)}:${((index * 10) % 60).toString().padStart(2, '0')}`;
                      
                      return (
                        <div key={index} className="flex space-x-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400 w-12 shrink-0 mt-1">
                            {timestamp}
                          </span>
                          <div className={`flex-1 p-2 rounded text-sm ${
                            isAgent ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' :
                            isUser ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100' :
                            'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            <span className="font-medium">
                              {isAgent ? 'Agent' : isUser ? 'User' : 'System'}:
                            </span>
                            <span className="ml-2">
                              {line.replace(/^(Agent:|User:)\s*/, '')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No transcript available</p>
                  )
                ) : (
                  // Detailed transcript view with word-level timing
                  transcriptObject.length > 0 ? (
                    transcriptObject.map((entry, index) => {
                      const startTime = entry.words?.[0]?.start || 0;
                      const timestamp = `${Math.floor(startTime / 60)}:${Math.floor(startTime % 60).toString().padStart(2, '0')}`;
                      
                      return (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded font-medium ${
                                entry.role === 'agent' 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              }`}>
                                {entry.role.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {timestamp}
                              </span>
                              {entry.metadata?.response_id !== undefined && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Response ID: {entry.metadata.response_id}
                                </span>
                              )}
                            </div>
                            {entry.words && entry.words.length > 0 && (
                              <button
                                onClick={() => toggleWordDetails(index)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {expandedWordIndex === index ? 'Hide' : 'Show'} Word Timing
                              </button>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {entry.content}
                          </p>

                          {expandedWordIndex === index && entry.words && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
                              <h5 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Word-level Timing:</h5>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {entry.words.map((word, wordIndex) => (
                                  <div key={wordIndex} className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">"{word.word}"</span>
                                    <span className="text-gray-500 dark:text-gray-500">
                                      {word.start.toFixed(2)}s - {word.end.toFixed(2)}s
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No detailed transcript available</p>
                  )
                )}
              </div>
            </div>

            {/* External Links */}
            <div className="flex space-x-4">
              {call.recording_url && (
                <a
                  href={call.recording_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <FaExternalLinkAlt className="h-4 w-4" />
                  <span>View in Playground</span>
                </a>
              )}
              {call.public_log_url && (
                <a
                  href={call.public_log_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <FaExternalLinkAlt className="h-4 w-4" />
                  <span>Public Log</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallDetailPanel; 