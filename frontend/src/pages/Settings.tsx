

import { useState, useEffect } from "react"
import { Save, User, RefreshCw, Lock, Eye, EyeOff, Shield} from "lucide-react"
import { authService } from "../services/auth-service"
import toast from "react-hot-toast"

const Settings = () => {
  const [activeTab, setActiveTab] = useState("personal")

  // Personal profile state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  
  // User data state
  const [userData, setUserData] = useState({
    name: "Admin User",
    email: "admin@machinerymax.com",
    role: "Administrator"
  })
  const [nameEditSuccess, setNameEditSuccess] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user) {
          setUserData({
            name: user.name || user.username || "Admin User",
            email: user.email || "admin@machinerymax.com",
            role: user.role || "Administrator"
          })
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }
    
    fetchUserData()
  }, [])

  const handlePasswordUpdate = async () => {
    setPasswordError("")
    setPasswordSuccess("")
    
    if (!currentPassword) {
      setPasswordError("Current password is required")
      return
    }
    
    if (!newPassword) {
      setPasswordError("New password is required")
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters")
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }
    
    setIsUpdatingPassword(true)
    
    try {
      await authService.changePassword({
        currentPassword,
        newPassword
      })
       toast.success("Password updated successfully!", {
          duration: 5000,
          position: 'top-right'
        });
      setPasswordSuccess("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      setTimeout(() => setPasswordSuccess(""), 3000)
    } catch (error: any) {
      if (error.response?.data?.message) {
        setPasswordError(error.response.data.message)
      } else if (error.response?.status === 401) {
        setPasswordError("Current password is incorrect")
      } else {
        setPasswordError("Failed to update password. Please try again.")
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleNameUpdate = async () => {
    setIsSavingName(true)
    setNameEditSuccess("")
    
    try {
      await authService.updateProfile({ username: userData.name })
      toast.success("Name updated successfully!", {
          duration: 5000,
          position: 'top-right'
        });
      setNameEditSuccess("Name updated successfully!")
      setTimeout(() => setNameEditSuccess(""), 3000)
    } catch (error: any) {
      console.error('Failed to update name:', error)
    } finally {
      setIsSavingName(false)
    }
  }

  const renderPasswordField = (label: string, type: 'current' | 'new' | 'confirm', showState: string) => {
    const getValue = () => {
      switch (type) {
        case 'current': return currentPassword
        case 'new': return newPassword
        case 'confirm': return confirmPassword
        default: return ''
      }
    }

    const getShowState = () => {
      switch (showState) {
        case 'showCurrent': return showCurrentPassword
        case 'showNew': return showNewPassword
        case 'showConfirm': return showConfirmPassword
        default: return false
      }
    }

    const setShowState = (value: boolean) => {
      switch (showState) {
        case 'showCurrent': setShowCurrentPassword(value); break
        case 'showNew': setShowNewPassword(value); break
        case 'showConfirm': setShowConfirmPassword(value); break
      }
    }

    const handleChange = (value: string) => {
      switch (type) {
        case 'current': setCurrentPassword(value); break
        case 'new': setNewPassword(value); break
        case 'confirm': setConfirmPassword(value); break
      }
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            type={getShowState() ? "text" : "password"}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={getValue()}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowState(!getShowState())}
          >
            {getShowState() ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Settings
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage your account settings, integrations, and preferences
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
         
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "personal"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("personal")}
            >
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Personal Information
              </div>
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "password"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("password")}
            >
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </div>
            </button>
          
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "personal" && (
            <div className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <div className="flex items-center mb-6">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-3">
                    <User className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      value={userData.name}
                      onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                    {nameEditSuccess && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {nameEditSuccess}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-400 cursor-not-allowed"
                      value={userData.email}
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Email cannot be changed. Contact administrator for updates.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleNameUpdate}
                    disabled={isSavingName}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingName ? (
                      <>
                        <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="-ml-1 mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "password" && (
            <div className="space-y-8">
              {/* Security Section */}
              <div>
                <div className="flex items-center mb-6">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 mr-3">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h3>
                </div>
                
                <div className="max-w-md space-y-6">
                  {renderPasswordField('Current Password', 'current', 'showCurrent')}
                  {renderPasswordField('New Password', 'new', 'showNew')}
                  {renderPasswordField('Confirm New Password', 'confirm', 'showConfirm')}

                  {passwordError && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {passwordSuccess && (
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handlePasswordUpdate}
                      disabled={isUpdatingPassword}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Lock className="-ml-1 mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          

         

        
        </div>
      </div>
    </div>
  )
}

export default Settings

