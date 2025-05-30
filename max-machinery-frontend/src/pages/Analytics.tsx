 

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const Analytics = () => {
  const [timeframe, setTimeframe] = useState("month")
  const [loading, setLoading] = useState(true)
  const [callData, setCallData] = useState([])
  const [conversionData, setConversionData] = useState([])
  const [sourceData, setSourceData] = useState([])
  const [statusData, setStatusData] = useState([])

  // Simulate loading data
  useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      // Call volume data
      const mockCallData = [
        { name: "Week 1", completed: 45, scheduled: 60, failed: 8 },
        { name: "Week 2", completed: 52, scheduled: 70, failed: 5 },
        { name: "Week 3", completed: 48, scheduled: 65, failed: 10 },
        { name: "Week 4", completed: 60, scheduled: 75, failed: 7 },
      ]

      // Conversion data
      const mockConversionData = [
        { name: "Initial Contact", value: 100 },
        { name: "Interested", value: 65 },
        { name: "Qualified", value: 40 },
        { name: "Converted", value: 25 },
      ]

      // Lead source data
      const mockSourceData = [
        { name: "Apollo.io", value: 65 },
        { name: "Manual Entry", value: 15 },
        { name: "Website", value: 10 },
        { name: "Referral", value: 8 },
        { name: "Trade Show", value: 2 },
      ]

      // Lead status data
      const mockStatusData = [
        { name: "New", value: 30 },
        { name: "Contacted", value: 45 },
        { name: "Qualified", value: 15 },
        { name: "Converted", value: 8 },
        { name: "Closed", value: 2 },
      ]

      setCallData(mockCallData)
      setConversionData(mockConversionData)
      setSourceData(mockSourceData)
      setStatusData(mockStatusData)
      setLoading(false)
    }, 1000)
  }, [])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <select
            className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm">
            Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Call Volume Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Call Volume</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scheduled" stackId="a" fill="#8884d8" name="Scheduled" />
                  <Bar dataKey="completed" stackId="a" fill="#82ca9d" name="Completed" />
                  <Bar dataKey="failed" stackId="a" fill="#ff8042" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion Funnel and Lead Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Conversion Funnel</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={conversionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8">
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Lead Sources</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Calls</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">856</p>
              <div className="flex items-center mt-2">
                <span className="text-green-500 text-sm font-medium">↑ 12%</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">vs last {timeframe}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">15.2%</p>
              <div className="flex items-center mt-2">
                <span className="text-green-500 text-sm font-medium">↑ 3.5%</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">vs last {timeframe}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Call Duration</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">4:32</p>
              <div className="flex items-center mt-2">
                <span className="text-red-500 text-sm font-medium">↓ 0:18</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">vs last {timeframe}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost per Acquisition</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$42.18</p>
              <div className="flex items-center mt-2">
                <span className="text-green-500 text-sm font-medium">↓ $3.24</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">vs last {timeframe}</span>
              </div>
            </div>
          </div>

          {/* Lead Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Lead Status Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Analytics
