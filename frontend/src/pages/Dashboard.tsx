import { useState, useEffect } from "react"
import { Phone, MessageSquare, Users,  CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { dashboardService, type DashboardStats, type Activity, type UpcomingCall } from "../services/dashboard.service"
import { FaSpinner } from "react-icons/fa"

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    activeCalls: 0,
    completedCalls: 0,
    pendingFollowUps: 0,
    successfulConversions: 0,
  })
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [upcomingCalls, setUpcomingCalls] = useState<UpcomingCall[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsData, activityData, callsData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentActivity(),
          dashboardService.getUpcomingCalls(),
        ])
        
        setStats(statsData)
        setRecentActivity(activityData)
        setUpcomingCalls(callsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

 

   if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <FaSpinner className="animate-spin h-8 w-8 text-indigo-600 mb-4" />
          <p className="text-gray-700 dark:text-gray-300">Loading dashboard...</p>
        </div>
      );
    }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
       
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
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

        {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 mr-4">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingFollowUps}</p>
            </div>
          </div>
        </div> */}

        {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 mr-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successfulConversions}</p>
            </div>
          </div>
        </div> */}
      </div>

      {/* Recent Activity and Upcoming Calls */}
      <div className="grid ">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {activity.type === 'call' ? (
                        <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      ) : activity.type === 'email' ? (
                        <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

       
      </div>

      {/* Version Info */}
      <div className="mt-6 px-4 py-2">
        <p className="text-xs text-gray-500">MaxMachinery v1.0.0</p>
      </div>
    </div>
  )
}

export default Dashboard 
