import { useState, useEffect } from "react"
import { Users, CheckCircle, Clock, PhoneCall, Heart, X, Calendar, Bell, CheckSquare } from "lucide-react"
import { dashboardService, type DashboardStats } from "../services/dashboard.service"
import { FaSpinner } from "react-icons/fa"

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    todaysCalls: 0,
    pendingCalls: 0,
    completedCalls: 0,
    interestedLeads: 0,
    notInterestedLeads: 0,
    rescheduledLeads: 0,
    reminderLeads: 0,
    completedLeads: 0,
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const statsData = await dashboardService.getStats()
        
        setStats(statsData)
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

      {/* Call Statistics */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Call Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLeads.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mr-4">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Calls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todaysCalls.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Calls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingCalls.toLocaleString()}</p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedCalls.toLocaleString()}</p>
            </div>
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



