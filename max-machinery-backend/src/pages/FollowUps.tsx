 

import { useState, useEffect } from "react"
import { Search, Filter, Mail, MessageSquare, Calendar, Phone } from "lucide-react"

interface FollowUp {
  id: string
  leadName: string
  leadCompany: string
  type: "email" | "sms" | "call"
  status: "pending" | "sent" | "completed" | "failed"
  scheduledTime: string
  content?: string
  response?: string
}

const FollowUps = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  // Simulate loading data
  useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      const mockFollowUps: FollowUp[] = Array.from({ length: 20 }, (_, i) => ({
        id: `followup-${i + 1}`,
        leadName: `Contact ${i + 1}`,
        leadCompany: `Company ${i + 1}`,
        type: ["email", "sms", "call"][Math.floor(Math.random() * 3)] as any,
        status: ["pending", "sent", "completed", "failed"][Math.floor(Math.random() * 4)] as any,
        scheduledTime: new Date(Date.now() + Math.floor(Math.random() * 7 * 24) * 60 * 60 * 1000).toLocaleString(),
        content:
          Math.random() > 0.3
            ? "Thank you for your time on our call. As discussed, I wanted to follow up about your surplus machinery..."
            : undefined,
        response: Math.random() > 0.7 ? "Thanks for reaching out. I am interested in discussing further..." : undefined,
      }))
      setFollowUps(mockFollowUps)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredFollowUps = followUps.filter(
    (followUp) =>
      (followUp.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.leadCompany.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedType === "all" || followUp.type === selectedType) &&
      (selectedStatus === "all" || followUp.status === selectedStatus),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Follow-up Management</h1>
        <div className="flex space-x-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center"
            onClick={() => setShowTemplateModal(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Manage Templates
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Follow-up
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search follow-ups..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <select
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white py-2 px-4 rounded-md shadow-sm"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="call">Call</option>
          </select>
          <select
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white py-2 px-4 rounded-md shadow-sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <button className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white py-2 px-4 rounded-md shadow-sm flex items-center hover:bg-gray-50 dark:hover:bg-gray-600">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Follow-ups Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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
                  Type
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
                  Content
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
                    Loading follow-ups...
                  </td>
                </tr>
              ) : filteredFollowUps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No follow-ups found
                  </td>
                </tr>
              ) : (
                filteredFollowUps.map((followUp) => (
                  <tr key={followUp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{followUp.leadName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{followUp.leadCompany}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {followUp.type === "email" ? (
                          <Mail className="h-4 w-4 text-blue-500 mr-1" />
                        ) : followUp.type === "sms" ? (
                          <MessageSquare className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <Phone className="h-4 w-4 text-purple-500 mr-1" />
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{followUp.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          followUp.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : followUp.status === "sent"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : followUp.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {followUp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{followUp.scheduledTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {followUp.content || "No content available"}
                      </div>
                      {followUp.response && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">Has response</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          View
                        </button>
                        {followUp.status === "pending" && (
                          <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                            Send Now
                          </button>
                        )}
                        {followUp.status === "sent" && (
                          <button className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300">
                            Check Status
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Template Management Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Follow-up Templates</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Manage your follow-up templates for emails, SMS, and call scripts.
            </p>

            <div className="mb-6">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button className="py-2 px-4 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium">
                  Email Templates
                </button>
                <button className="py-2 px-4 text-gray-500 dark:text-gray-400 font-medium">SMS Templates</button>
                <button className="py-2 px-4 text-gray-500 dark:text-gray-400 font-medium">Call Scripts</button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Initial Follow-up</h4>
                <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                  Edit
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Subject: Following up on our conversation about your surplus machinery
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  Dear {"{{lead_name}}"},<br />
                  <br />
                  Thank you for taking the time to speak with me today about your surplus industrial machinery at{" "}
                  {"{{company_name}}"}.<br />
                  <br />
                  As discussed, MachineryMax specializes in helping businesses like yours sell unused or underutilized
                  equipment. Based on our conversation, I believe we could help you convert your surplus{" "}
                  {"{{machinery_type}}"} into cash quickly and efficiently.
                  <br />
                  <br />
                  Would you be available for a brief follow-up call this week to discuss the next steps? Alternatively,
                  you can send me photos and details of the equipment you're looking to sell, and I can provide a
                  preliminary valuation.
                  <br />
                  <br />
                  Looking forward to working with you.
                  <br />
                  <br />
                  Best regards,
                  <br />
                  {"{{agent_name}}"}
                  <br />
                  MachineryMax
                  <br />
                  {"{{agent_phone}}"}
                  <br />
                  {"{{agent_email}}"}
                </p>
              </div>

              <div className="flex justify-between items-center mt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Second Follow-up</h4>
                <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                  Edit
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Subject: Checking in about your machinery at {"{{company_name}}"}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  Dear {"{{lead_name}}"},<br />
                  <br />I wanted to follow up on our previous conversation about the surplus machinery at your facility.
                  I understand you're busy, but I wanted to remind you of the opportunity to convert unused equipment
                  into capital that could be reinvested in your business.
                  <br />
                  <br />
                  MachineryMax has successfully helped many businesses in the {"{{industry}}"} industry sell their
                  equipment quickly and at competitive prices.
                  <br />
                  <br />
                  Has there been any further thought about selling your {"{{machinery_type}}"} equipment? I'm happy to
                  answer any questions or provide more information about our process.
                  <br />
                  <br />
                  Best regards,
                  <br />
                  {"{{agent_name}}"}
                  <br />
                  MachineryMax
                  <br />
                  {"{{agent_phone}}"}
                  <br />
                  {"{{agent_email}}"}
                </p>
              </div>

              <button className="mt-4 w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500">
                + Add New Template
              </button>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setShowTemplateModal(false)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => setShowTemplateModal(false)}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FollowUps
