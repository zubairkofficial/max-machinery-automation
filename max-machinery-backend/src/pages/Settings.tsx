 

import { useState } from "react"
import { Save, User, Phone, Mail, MessageSquare, Database, RefreshCw } from "lucide-react"

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general")
  const [zohoIntegrationEnabled, setZohoIntegrationEnabled] = useState(true)
  const [apolloIntegrationEnabled, setApolloIntegrationEnabled] = useState(true)
  const [retellIntegrationEnabled, setRetellIntegrationEnabled] = useState(true)
  const [smsProviderEnabled, setSmsProviderEnabled] = useState(true)
  const [emailProviderEnabled, setEmailProviderEnabled] = useState(true)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "general"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "integrations"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("integrations")}
          >
            Integrations
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "notifications"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "users"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        </div>

        <div className="p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      defaultValue="MachineryMax"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      defaultValue="https://machinerymax.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      defaultValue="info@machinerymax.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      defaultValue="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Automatic Call Scheduling</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically schedule calls based on lead priority and agent availability
                      </p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Automatic Follow-ups</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Send automatic follow-up emails and SMS after calls
                      </p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Call Recording</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Record all calls for quality assurance and training
                      </p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Lead Scoring</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically score leads based on engagement and responses
                      </p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Connect your third-party services to automate lead generation, calling, and follow-up processes.
                </p>
              </div>

              <div className="space-y-6">
                {/* Zoho CRM Integration */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4">
                        <Database className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Zoho CRM</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sync leads, contacts, and call data with Zoho CRM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer mr-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={zohoIntegrationEnabled}
                          onChange={() => setZohoIntegrationEnabled(!zohoIntegrationEnabled)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                        Configure
                      </button>
                    </div>
                  </div>
                  {zohoIntegrationEnabled && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Zoho API Key
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                            value="••••••••••••••••"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Sync Frequency
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm">
                            <option>Real-time</option>
                            <option>Every 15 minutes</option>
                            <option>Hourly</option>
                            <option>Daily</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Test Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Apollo.io Integration */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-4">
                        <User className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Apollo.io</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Import leads and contacts from Apollo.io
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer mr-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={apolloIntegrationEnabled}
                          onChange={() => setApolloIntegrationEnabled(!apolloIntegrationEnabled)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                        Configure
                      </button>
                    </div>
                  </div>
                  {apolloIntegrationEnabled && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Apollo.io API Key
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                            value="••••••••••••••••"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Lead Criteria
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm">
                            <option>Industrial Machinery Owners</option>
                            <option>Manufacturing Companies</option>
                            <option>Equipment Dealers</option>
                            <option>Custom Search...</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Test Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Retell AI Integration */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-4">
                        <Phone className="h-5 w-5 text-green-600 dark:text-green-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Retell AI</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Automated calling with AI voice agents
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer mr-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={retellIntegrationEnabled}
                          onChange={() => setRetellIntegrationEnabled(!retellIntegrationEnabled)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                        Configure
                      </button>
                    </div>
                  </div>
                  {retellIntegrationEnabled && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Retell API Key
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                            value="••••••••••••••••"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Voice Selection
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm">
                            <option>Sarah (Female, Professional)</option>
                            <option>Michael (Male, Professional)</option>
                            <option>Emma (Female, Friendly)</option>
                            <option>James (Male, Friendly)</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Test Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SMS Provider Integration */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mr-4">
                        <MessageSquare className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">SMS Provider</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Send SMS follow-ups via Twilio</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer mr-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={smsProviderEnabled}
                          onChange={() => setSmsProviderEnabled(!smsProviderEnabled)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                        Configure
                      </button>
                    </div>
                  </div>
                  {smsProviderEnabled && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Twilio Account SID
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                            value="••••••••••••••••"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Twilio Auth Token
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                            value="••••••••••••••••"
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Test Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Provider Integration */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-4">
                        <Mail className="h-5 w-5 text-red-600 dark:text-red-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Email Provider</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Send emails via SendGrid</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer mr-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={emailProviderEnabled}
                          onChange={() => setEmailProviderEnabled(!emailProviderEnabled)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                        Configure
                      </button>
                    </div>
                  </div>
                  {emailProviderEnabled && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            SendGrid API Key
                          </label>
                          <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                            value="••••••••••••••••"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Default Sender Email
                          </label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                            defaultValue="info@machinerymax.com"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Test Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose which notifications you want to receive.
              </p>
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Management</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage and invite users to your organization.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
