import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import LeadsManagement from './pages/LeadsManagement';
import FollowUps from "./pages/FollowUps";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import MessageTemplates from './pages/MessageTemplates';
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./App.css";
import { QueryClient, QueryClientProvider } from 'react-query';
import ApolloSettings from './pages/ApolloSettings';
import BatchCallPage from './pages/BatchCallPage';
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CallDashboard from './components/CallDashboard';
import FormPage from './pages/FormPage';
import InitialContactForm from './components/leads/InitialContactForm';
import RetellLLMPage from "./pages/RetellLlmPage";

// Import or create route placeholders (these components can be implemented later)
// const PriorityLeads = () => <LeadsManagement currentTab="priority" />;
// const AddNewLead = () => <div className="p-4">Add New Lead Form (Coming Soon)</div>;
// const LeadSearch = () => <div className="p-4">Advanced Lead Search (Coming Soon)</div>;

// A component for embedding in an iframe on machinerymax.com
const EmbeddedFormPage = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  return (
    <div className="bg-transparent p-2">
      <InitialContactForm apiUrl={apiUrl} />
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <div className="h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Public routes that don't require authentication */}
              <Route path="/form" element={<FormPage />} />
              <Route path="/embedded-form" element={<EmbeddedFormPage />} />
              
              {/* Protected routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen overflow-hidden">
                      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            
                            {/* Leads Management Routes */}
                            <Route path="/leads" element={<LeadsManagement currentTab="all" />} />
                            {/* <Route path="/leads/priority" element={<PriorityLeads />} />
                            <Route path="/leads/new" element={<AddNewLead />} />
                            <Route path="/leads/search" element={<LeadSearch />} /> */}
                            
                            <Route path="/apollo-settings" element={<ApolloSettings />} />
                            {/* <Route path="/calls" element={<CallCenter />} /> */}
                            <Route path="/calls/batch" element={<BatchCallPage />} />
                            <Route path="/follow-ups" element={<FollowUps />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/calls" element={<CallDashboard />} />
                            <Route path="/calls/dashboard" element={<CallDashboard />} />
                            <Route path="/templates" element={<MessageTemplates />} />
                            <Route path="/retell-llm" element={<RetellLLMPage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
