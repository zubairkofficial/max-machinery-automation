import React, { useState } from 'react';
import { FaPlay, FaPause, FaDownload, FaFileAlt } from 'react-icons/fa';
import { CallHistory } from '../types/call-history';

interface CallDetailPanelProps {
  call: CallHistory;
  onClose: () => void;
}

interface ProductCost {
  product: string;
  cost: number;
}

const formatTimestamp = (timestamp: string | number): string => {
  try {
    const date = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(date).toLocaleString();
  } catch (error) {
    console.error('Error formatting timestamp:', timestamp, error);
    return 'Invalid Date';
  }
};

const formatDuration = (ms: number): string => {
  if (!ms) return '0:00';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatCost = (cost: number): string => {
  return `$${cost.toFixed(2)}`;
};

const CallDetailPanel: React.FC<CallDetailPanelProps> = ({ call, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePlayPause = () => {
    if (!audioElement && call.recording_url) {
      const audio = new Audio(call.recording_url);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (call.recording_url) {
      const link = document.createElement('a');
      link.href = call.recording_url;
      link.download = `call-recording-${call.call_id || call.callId}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Call Details</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Call ID: {call.call_id || call.callId}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="text-2xl">&times;</span>
        </button>
      </div>

      {/* Recording Player */}
      {call.recording_url && (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Call Recording</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isPlaying ? <FaPause className="h-4 w-4" /> : <FaPlay className="h-4 w-4" />}
              <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaDownload className="h-4 w-4" />
              <span className="ml-2">Download</span>
            </button>
          </div>
        </div>
      )}

      {/* Transcript */}
      {call.transcript && (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white flex items-center">
            <FaFileAlt className="mr-2" />
            Transcript
          </h3>
          <div className="max-h-60 overflow-y-auto">
            <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">
              {call.transcript}
            </pre>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Lead Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{call.leadName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{call.leadCompany || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Title</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{call.leadJobTitle || 'N/A'}</p>
            </div>
            <div className='overflow-hidden'>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white ">{call.leadEmail || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Call Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Call Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{call.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Direction</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{call.direction}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">From</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{call.fromNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">To</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{call.leadPhone}</p>
            </div>
          </div>
        </div>

        {/* Timing Details */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Timing Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatTimestamp(call.startTimestamp)}
              </p>
            </div>
            {call.endTimestamp && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Time</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatTimestamp(call.endTimestamp)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {call.duration_ms ? formatDuration(call.duration_ms) : 'N/A'}
              </p>
            </div>
            {call.disconnection_reason && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Disconnection Reason</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{call.disconnection_reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Information */}
        {call.callCost && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Cost Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Combined Cost</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatCost(call.callCost.combined_cost)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration (seconds)</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {call.callCost.total_duration_seconds || 0}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit Price</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatCost(call.callCost.total_duration_unit_price || 0)}
                </p>
              </div>
            </div>
            {call.callCost.product_costs && call.callCost.product_costs.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Costs</label>
                <div className="mt-2 space-y-2">
                  {call.callCost.product_costs.map((cost: ProductCost, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-900 dark:text-white">{cost.product}</span>
                      <span className="text-gray-900 dark:text-white">{formatCost(cost.cost)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Settings */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg md:col-span-2">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Additional Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sensitive Data Storage</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {call.opt_out_sensitive_data_storage ? 'Opted Out' : 'Opted In'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Signed URL</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {call.opt_in_signed_url ? 'Opted In' : 'Opted Out'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallDetailPanel; 