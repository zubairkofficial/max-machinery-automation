import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle,
  Clock,
  PhoneCall,
  Heart,
  X,
  Calendar,
  Bell,
  CheckSquare,
} from "lucide-react";
import {
  dashboardService,
  type DashboardStats,
} from "../services/dashboard.service";
import { FaSpinner } from "react-icons/fa";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    todaysCalls: 0,
    scheduledCall: 0,
    rescheduledCall: 0,
    reminderCall: 0,
    pendingCalls: 0,
    completedCalls: 0,
    interestedLeads: 0,
    notInterestedLeads: 0,
    rescheduledLeads: 0,
    reminderLeads: 0,
    completedLeads: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsData = await dashboardService.getStats();

        setStats(statsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
      </div>

      {/* Call Statistics */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Call Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Leads
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalLeads.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

         

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 mr-4">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pending Calls
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingCalls.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mr-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completed Calls
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completedCalls.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 mt-5">
             <div className="w-[3.2rem] p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 mr-4">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Today's Calls
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.todaysCalls.toLocaleString()}
                </p>
               
              </div>
          <div className="flex items-center justify-between p-5  dark:bg-inherit rounded-lg transition-shadow duration-300">
  <div className="flex flex-col gap-9 w-full">
    <ul role="list" className="space-y-6">
      <li className="flex justify-between items-center text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12h4m-2-2v4m-7-4v4m0 0h4" />
          </svg>
          <span>Schedule Calls:</span>
        </div>
        <span className="text-xl font-semibold text-gray-900 dark:text-white">
          {stats.scheduledCall.toLocaleString()}
        </span>
      </li>
      <li className="flex justify-between items-center text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h3m3 0h3m-3-3v6m-3-6v6" />
          </svg>
          <span>ReSchedule Calls:</span>
        </div>
        <span className="text-xl font-semibold text-gray-900 dark:text-white">
          {stats.rescheduledCall.toLocaleString()}
        </span>
      </li>
      <li className="flex justify-between items-center text-sm font-medium text-gray-600 dark:text-gray-300 pb-3">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 0l-2-2m2 2l2-2" />
          </svg>
          <span>Reminder Calls:</span>
        </div>
        <span className="text-xl font-semibold text-gray-900 dark:text-white">
          {stats.reminderCall.toLocaleString()}
        </span>
      </li>
    </ul>
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
  );
};

export default Dashboard;
