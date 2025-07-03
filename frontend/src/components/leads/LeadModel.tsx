// components/AddLeadModal.tsx
import React, { useState } from 'react';
import { FaUser, FaMobile, FaBuilding, FaUserTie, FaTimesCircle } from 'react-icons/fa';

import toast from 'react-hot-toast';
import { Lead, api } from '@/services/api';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: (newLead: Lead) => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onLeadAdded }) => {
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    jobTitle: ''
  });
  const [isAddingLead, setIsAddingLead] = useState(false);

  const handleAddLead = async () => {
    if (!newLead.firstName.trim() || !newLead.phone.trim()) {
      toast.error('First name and phone number are required');
      return;
    }

    try {
      setIsAddingLead(true);
      const createDto = {
        firstName: newLead.firstName,
        // lastName: "lead",
        phone: newLead.phone,
        // company: newLead.company,
        // jobTitle: newLead.jobTitle,
        status: 'new',
        contacted: false,
        source: 'manual'
      };

      const createdLead = await api.createLead(createDto);
      toast.success('Lead added successfully!');
      
      // Reset form
      setNewLead({
        firstName: '',
        lastName: '',
        phone: '',
        company: '',
        jobTitle: ''
      });
      
      // Notify parent component
      onLeadAdded(createdLead);
      
      // Close modal
      onClose();
    } catch (error) {
      toast.error('Failed to add lead');
      console.error('Error adding lead:', error);
    } finally {
      setIsAddingLead(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add New Lead
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimesCircle />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={newLead.firstName}
                  onChange={(e) => setNewLead({...newLead, firstName: e.target.value})}
                  className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John"
                />
              </div>
            </div>
            
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={newLead.lastName}
                  onChange={(e) => setNewLead({...newLead, lastName: e.target.value})}
                  className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Doe"
                />
              </div>
            </div>
             */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMobile className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBuilding className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={newLead.company}
                  onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                  className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Acme Inc"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserTie className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={newLead.jobTitle}
                  onChange={(e) => setNewLead({...newLead, jobTitle: e.target.value})}
                  className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="CEO"
                />
              </div>
            </div> */}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAddLead}
              disabled={isAddingLead}
              className={`px-4 py-2 text-white rounded-md flex items-center ${
                isAddingLead 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isAddingLead ? (
                <>
                  <span className="animate-spin mr-2">&#9696;</span>
                  Adding...
                </>
              ) : (
                'Add Lead'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLeadModal;