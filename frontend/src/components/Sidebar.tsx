import { NavLink, useLocation } from "react-router-dom"
import { 
  Home, 
  Users, 
  Phone, 
  X, 
  PhoneCall,
  ChevronDown,
  FileText,
  Sliders,
  BarChart2,
  Settings,
  Clock,
  Trash2,
  Mail
} from "lucide-react"
import { useState, useEffect } from "react"
import { FaRobot } from "react-icons/fa"

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();
  const [callsExpanded, setCallsExpanded] = useState(false);
  const [leadsExpanded, setLeadsExpanded] = useState(false);

  // Expand submenu based on current path
  useEffect(() => {
    if (location.pathname.startsWith('/calls')) {
      setCallsExpanded(true);
    }
    if (location.pathname.startsWith('/leads')) {
      setLeadsExpanded(true);
    }
  }, [location.pathname]);

  // Helper for submenu button to avoid repetition
  const SubMenuButton = ({ 
    isExpanded, 
    toggleExpand, 
    icon: Icon, 
    path, 
    label 
  }: { 
    isExpanded: boolean, 
    toggleExpand: () => void, 
    icon: any, 
    path: string, 
    label: string 
  }) => (
    <button
      onClick={toggleExpand}
      className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg ${
        location.pathname.startsWith(path) 
          ? "bg-gray-900 text-white" 
          : "text-gray-500 hover:bg-gray-700 hover:text-white"
      }`}
    >
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
      </div>
      <ChevronDown 
        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
      />
    </button>
  );

  return (
    <div>
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 transform h-screen overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 flex-shrink-0 bg-white dark:bg-gray-900 p-4 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex flex-col items-center mb-8 pr-3 sm:px-2">
         
          
          {/* Close button (mobile only) */}
          <button
            className="lg:hidden text-gray-400 hover:text-gray-200 absolute right-4 top-4"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Main
            </p>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                }`
              }
              end
            >
              <Home className="w-5 h-5 mr-3" />
              <span>Dashboard</span>
            </NavLink>
          </div>

          {/* Lead Management Section */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Leads
            </p>
            <SubMenuButton 
              isExpanded={leadsExpanded}
              toggleExpand={() => setLeadsExpanded(!leadsExpanded)}
              icon={Users}
              path="/leads"
              label="Lead Management"
            />
            
            {leadsExpanded && (
              <div className="ml-6 pl-3 border-l border-gray-700 space-y-1 pt-1">
                <NavLink
                  to="/leads"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      isActive && location.pathname === '/leads' ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                  end
                >
                  <Users className="w-4 h-4 mr-3" />
                  <span>All Leads</span>
                </NavLink>
                {/* <NavLink
                  to="/leads/priority"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  <Award className="w-4 h-4 mr-3" />
                  <span>Priority Leads</span>
                </NavLink>
                <NavLink
                  to="/leads/new"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  <UserPlus className="w-4 h-4 mr-3" />
                  <span>Add New Lead</span>
                </NavLink> */}
                {/* <NavLink
                  to="/leads/search"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  <Search className="w-4 h-4 mr-3" />
                  <span>Advanced Search</span>
                </NavLink> */}
              </div>
            )}
          </div>
          
          {/* Communication Section */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Communication
            </p>
            
            <SubMenuButton 
              isExpanded={callsExpanded}
              toggleExpand={() => setCallsExpanded(!callsExpanded)}
              icon={Phone}
              path="/calls"
              label="Call Center"
            />
            
            {callsExpanded && (
              <div className="ml-6 pl-3 border-l border-gray-700 space-y-1 pt-1">
                {/* <NavLink
                  to="/calls"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      isActive && location.pathname === '/calls' ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                  end
                >
                  <Phone className="w-4 h-4 mr-3" />
                  <span>Call Dashboard</span>
                </NavLink> */}
                <NavLink
                  to="/calls/batch"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  <PhoneCall className="w-4 h-4 mr-3" />
                  <span>Batch Calling</span>
                </NavLink>
                <NavLink
                  to="/call-history"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  <Clock className="w-4 h-4 mr-3" />
                  <span>Call History</span>
                </NavLink>
              </div>
            )}

            <NavLink
              to="/templates"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <FileText className="w-5 h-5 mr-3" />
              <span>Message Templates</span>
            </NavLink>
            <NavLink
              to="/retell-llm"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <FaRobot className="w-5 h-5 mr-3" />
              <span>LLM Prompt</span>
            </NavLink>
            
            {/* <NavLink
              to="/follow-ups"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              <span>Follow-ups</span>
            </NavLink> */}
          </div>
          
          {/* Data & Settings Section */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Data & Settings
            </p>
            {/* <NavLink
              to="/apollo-settings"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <Sliders className="w-5 h-5 mr-3" />
              <span>Apollo Settings</span>
            </NavLink> */}
            {/* <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <BarChart2 className="w-5 h-5 mr-3" />
              <span>Analytics</span>
            </NavLink> */}
            <NavLink
              to="/cron-settings"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <Clock className="w-5 h-5 mr-3" />
              <span>Job Scheduler</span>
            </NavLink>
            <NavLink
              to="/phone-deletion"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <Trash2 className="w-5 h-5 mr-3" />
              <span>Delete by Phone</span>
            </NavLink>
            <NavLink
              to="/email-sender"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <Mail className="w-5 h-5 mr-3" />
              <span>Email Sender</span>
            </NavLink>
            {/* <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                  isActive ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <Settings className="w-5 h-5 mr-3" />
              <span>Settings</span>
            </NavLink> */}
          </div>
        </nav>
        
        {/* Application Version */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-4 py-2">
  <p className="text-xs text-gray-500 text-center">MaxMachinery v1.0.0</p>
</div>
      </div>
    </div>
  )
}

export default Sidebar
