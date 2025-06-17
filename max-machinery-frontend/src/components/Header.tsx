import { Menu, Bell, Settings, User, Sun, Moon, LogOut } from "lucide-react"
import logo from "../assets/images/max-machinery-automation.jfif"
import { useTheme } from "../contexts/ThemeContext"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">
          {/* Left: Hamburger button */}
          <div className="flex lg:hidden">
            <button
              className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Left: Logo */}
          <div className="flex items-center space-x-3">
            <img src={logo || "src/assets/images/max-machinery-automation.jfif"} alt="MachineryMax" className="h-8" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">MachineryMax Automation</h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            <button
              className="p-2 text-gray-500 rounded-full hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            {/* <button className="p-2 text-gray-500 rounded-full hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 rounded-full hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700">
              <Settings className="w-5 h-5" />
            </button> */}
            <div className="relative">
              <button className="flex items-center p-2 text-gray-500 rounded-full hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700">
                {user ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {user.name && user.name.length > 0 
                        ? user.name.charAt(0).toUpperCase()
                        : user.email && user.email.length > 0 
                          ? user.email.charAt(0).toUpperCase()
                          : "U"}
                    </div>
                    <span className="hidden md:block text-sm font-medium">
                      {user.name || user.email || "User"}
                    </span>
                  </div>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>
              
            </div>
            <button 
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-500 rounded-full hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 
