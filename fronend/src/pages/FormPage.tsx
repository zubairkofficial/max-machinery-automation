import React from 'react';
import { useLocation } from 'react-router-dom';
import DetailedLeadForm from '../components/leads/DetailedLeadForm';

const FormPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  // Replace with your API URL from environment variable or configuration
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto mt-10 bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <p className="font-bold">Error</p>
          <p>No verification token provided.</p>
        </div>
        <p className="text-center mt-4">
          Please return to <a href="https://machinerymax.com" className="text-blue-600 hover:underline">MachineryMax.com</a> to request a verification link.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center">
          <img 
            src="/logo.png" 
            alt="MachineryMax Logo" 
            className="h-16 mx-auto"
            onError={(e) => {
              // Fallback if logo is not found
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-3xl font-bold mt-4">MachineryMax</h1>
        </div>
        
        <DetailedLeadForm apiUrl={apiUrl} token={token} />
        
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} MachineryMax. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default FormPage; 