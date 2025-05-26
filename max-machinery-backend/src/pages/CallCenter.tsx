 

import { useState, useEffect } from "react"
import { Phone, Pause, Play, User, Clock, Mic, MicOff } from "lucide-react"

interface Call {
  id: string
  leadName: string
  leadCompany: string
  phoneNumber: string
  status: "scheduled" | "in-progress" | "completed" | "failed"
  scheduledTime?: string
  duration?: string
  notes?: string
}

const CallCenter = () => {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCall, setActiveCall] = useState<Call | null>(null)
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "in-progress" | "completed">("idle")
  const [showRetellConfig, setShowRetellConfig] = useState(false)

  // Simulate loading data
  useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      const mockCalls: Call[] = Array.from({ length: 10 }, (_, i) => ({
        id: `call-${i + 1}`,
        leadName: `Contact ${i + 1}`,
        leadCompany: `Company ${i + 1}`,
        phoneNumber: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        status: ["scheduled", "in-progress", "completed", "failed"][Math.floor(Math.random() * 4)] as any,
        scheduledTime: new Date(Date.now() + Math.floor(Math.random() * 24 * 5) * 60 * 60 * 1000).toLocaleString(),
        duration:
          Math.floor(Math.random() * 10) +
          1 +
          ":" +
          Math.floor(Math.random() * 60)
            .toString()
            .padStart(2, "0"),
        notes: Math.random() > 0.5 ? "Interested in selling equipment. Follow up next week." : undefined,
      }))
      setCalls(mockCalls)
      setLoading(false)
    }, 1000)
  }, [])

  const startCall = (call: Call) => {
    setActiveCall(call)
    setCallStatus("calling")
    // In a real app, this would trigger the Retell AI Agent to make the call
    setTimeout(() => {
      setCallStatus("in-progress")
    }, 2000)
  }

  const endCall = () => {
    setCallStatus("completed")
    // In a real app, this would end the call and save the recording/transcript
    setTimeout(() => {
      setActiveCall(null)
      setCallStatus("idle")
      // Update the call status in the list
      if (activeCall) {
        setCalls(
          calls.map((call) =>
            call.id === activeCall.id
              ? { ...call, status: "completed", notes: "Call completed via Retell AI. Follow-up required." }
              : call,
          ),
        )
      }
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Call Center</h1>
        <div className="flex space-x-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center"
            onClick={() => setShowRetellConfig(true)}
          >
            <Mic className="h-4 w-4 mr-2" />
            Configure Retell AI
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center">
            <Phone className="h-4 w-4 mr-2" />
            Schedule Calls
          </button>
        </div>
      </div>

      {/* Active Call Panel */}
      {activeCall && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeCall.leadName}</h2>
              <p className="text-gray-500 dark:text-gray-400">
                {activeCall.leadCompany} • {activeCall.phoneNumber}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  callStatus === "calling"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : callStatus === "in-progress"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                }`}
              >
                {callStatus === "calling" ? "Calling..." : callStatus === "in-progress" ? "In Progress" : "Completed"}
              </div>
              <div className="ml-4 text-gray-500 dark:text-gray-400">
                <Clock className="inline-block h-4 w-4 mr-1" />
                <span>00:03:45</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Live Transcript</h3>
              <div className="space-y-4">
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm max-w-md">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      Hello, this is Sarah from MachineryMax. Am I speaking with the owner or manager of{" "}
                      {activeCall.leadCompany}?
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3 shadow-sm max-w-md">
                    <p className="text-sm text-gray-800 dark:text-blue-200">
                      Yes, this is John, I'm the owner. What can I do for you?
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </div>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm max-w-md">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      Great to meet you, John. I'm calling because MachineryMax helps business owners like you sell
                      surplus industrial machinery. Do you currently have any unused or underutilized equipment in your
                      facility?
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Call Controls</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Pause className="h-6 w-6 text-gray-700 dark:text-gray-300 mb-2" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Pause</span>
                  </button>
                  <button className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Play className="h-6 w-6 text-gray-700 dark:text-gray-300 mb-2" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Resume</span>
                  </button>
                  <button className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Mic className="h-6 w-6 text-gray-700 dark:text-gray-300 mb-2" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Unmute</span>
                  </button>
                  <button className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <MicOff className="h-6 w-6 text-gray-700 dark:text-gray-300 mb-2" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Mute</span>
                  </button>
                </div>
                <button
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md shadow-sm"
                  onClick={endCall}
                >
                  End Call
                </button>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Notes</h3>
                <textarea
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="Add notes about this call..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calls Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent & Upcoming Calls</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Lead
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Phone Number
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Scheduled Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Duration
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading calls...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No calls found
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{call.leadName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{call.leadCompany}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{call.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          call.status === "scheduled"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : call.status === "in-progress"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : call.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {call.status === "scheduled"
                          ? "Scheduled"
                          : call.status === "in-progress"
                            ? "In Progress"
                            : call.status === "completed"
                              ? "Completed"
                              : "Failed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{call.scheduledTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{call.duration || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {call.status === "scheduled" ? (
                        <button
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => startCall(call)}
                        >
                          Start Call
                        </button>
                      ) : call.status === "completed" || call.status === "failed" ? (
                        <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                          View Details
                        </button>
                      ) : (
                        <button className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300">
                          Join Call
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retell AI Configuration Modal */}
      {showRetellConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Configure Retell AI Agent</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Set up your Retell AI Agent to make outbound calls on behalf of MachineryMax.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Retell API Key
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your Retell API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Voice Selection
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option>Sarah (Female, Professional)</option>
                  <option>Michael (Male, Professional)</option>
                  <option>Emma (Female, Friendly)</option>
                  <option>James (Male, Friendly)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Call Script</label>
                <textarea
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your call script template..."
                  defaultValue="Hello, this is [Agent Name] from MachineryMax. Am I speaking with the owner or manager of [Company Name]? We help businesses sell their surplus industrial machinery. Do you currently have any unused or underutilized equipment in your facility?"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Call Handling</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="record-calls"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label htmlFor="record-calls" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Record all calls
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="transcribe-calls"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label htmlFor="transcribe-calls" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Generate transcripts
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto-followup"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label htmlFor="auto-followup" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Schedule automatic follow-ups
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setShowRetellConfig(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => setShowRetellConfig(false)}
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CallCenter
