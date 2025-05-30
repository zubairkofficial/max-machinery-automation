 

import { useState, useEffect } from "react"
import { Phone, MessageSquare, Users, Clock, CheckCircle, AlertCircle } from "lucide-react"

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeCalls: 0,
    completedCalls: 0,
    pendingFollowUps: 0,
    successfulConversions: 0,
  })

  // Simulate loading data
  useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      setStats({
        totalLeads: 1248,
        activeCalls: 3,
        completedCalls: 856,
        pendingFollowUps: 42,
        successfulConversions: 128,
      })
    }, 1000)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex space-x-2">
          <select className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm">Export</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mr-4">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Calls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCalls}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mr-4">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Calls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedCalls}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 mr-4">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingFollowUps}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 mr-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successfulConversions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Upcoming Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {item % 3 === 0 ? (
                        <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      ) : item % 3 === 1 ? (
                        <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item % 3 === 0
                        ? "Call completed with Acme Industries"
                        : item % 3 === 1
                          ? "Follow-up email sent to Global Manufacturing"
                          : "New lead imported from Apollo.io"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item} hour{item !== 1 ? "s" : ""} ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Calls</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {
                          [
                            "Acme Corp",
                            "XYZ Industries",
                            "Global Manufacturing",
                            "Tech Solutions",
                            "Machinery Experts",
                          ][item - 1]
                        }
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Scheduled for {new Date().toLocaleDateString()} at {10 + item}:00 AM
                      </p>
                    </div>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
