import React, { useState } from 'react';
import { Lead, leadsApi } from '../../services/api';
import { FaEdit, FaSave, FaTimes, FaBell, FaCalendarAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface MachineryInfoProps {
  lead: Lead;
  onLeadUpdated: (updatedLead: Lead) => void;
}

interface MachineryInfoState {
  hasSurplusMachinery: boolean;
  machineryInterest: string;
  machineryNotes: string;
  machineryDetails: {
    types: string[];
    brands: string[];
    condition: string;
    age: string;
    estimatedValue: number;
  };
  reminderDate: string;
  reminderNote: string;
  reminderCompleted: boolean;
}

const MachineryInfo: React.FC<MachineryInfoProps> = ({ lead, onLeadUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [machineryInfo, setMachineryInfo] = useState<MachineryInfoState>({
    hasSurplusMachinery: lead?.hasSurplusMachinery || false,
    machineryInterest: lead?.machineryInterest || '',
    machineryNotes: lead?.machineryNotes || '',
    machineryDetails: {
      types: lead?.machineryDetails?.types || [],
      brands: lead?.machineryDetails?.brands || [],
      condition: lead?.machineryDetails?.condition || '',
      age: lead?.machineryDetails?.age || '',
      estimatedValue: lead?.machineryDetails?.estimatedValue || 0,
    },
    reminderDate: lead?.reminderDate || '',
    reminderNote: lead?.reminderNote || '',
    reminderCompleted: lead?.reminderCompleted || false,
  });

  React.useEffect(() => {
    if (lead) {
      setMachineryInfo({
        hasSurplusMachinery: lead.hasSurplusMachinery || false,
        machineryInterest: lead.machineryInterest || '',
        machineryNotes: lead.machineryNotes || '',
        machineryDetails: {
          types: lead.machineryDetails?.types || [],
          brands: lead.machineryDetails?.brands || [],
          condition: lead.machineryDetails?.condition || '',
          age: lead.machineryDetails?.age || '',
          estimatedValue: lead.machineryDetails?.estimatedValue || 0,
        },
        reminderDate: lead.reminderDate || '',
        reminderNote: lead.reminderNote || '',
        reminderCompleted: lead.reminderCompleted || false,
      });
    }
  }, [lead]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setMachineryInfo(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, any>,
          [child]: value,
        },
      }));
    } else {
      setMachineryInfo(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleTypesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.split(',').map(type => type.trim());
    setMachineryInfo(prev => ({
      ...prev,
      machineryDetails: {
        ...prev.machineryDetails,
        types: value,
      },
    }));
  };

  const handleBrandsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.split(',').map(brand => brand.trim());
    setMachineryInfo(prev => ({
      ...prev,
      machineryDetails: {
        ...prev.machineryDetails,
        brands: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedLead = await leadsApi.updateMachineryInfo(lead.id, machineryInfo);
      onLeadUpdated(updatedLead);
      setIsEditing(false);
      toast.success('Machinery information updated successfully');
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast.error('Failed to update machinery information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setMachineryInfo({
      hasSurplusMachinery: lead?.hasSurplusMachinery || false,
      machineryInterest: lead?.machineryInterest || '',
      machineryNotes: lead?.machineryNotes || '',
      machineryDetails: {
        types: lead?.machineryDetails?.types || [],
        brands: lead?.machineryDetails?.brands || [],
        condition: lead?.machineryDetails?.condition || '',
        age: lead?.machineryDetails?.age || '',
        estimatedValue: lead?.machineryDetails?.estimatedValue || 0,
      },
      reminderDate: lead?.reminderDate || '',
      reminderNote: lead?.reminderNote || '',
      reminderCompleted: lead?.reminderCompleted || false,
    });
    setIsEditing(false);
  };

  const isReminderOverdue = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date() && !machineryInfo.reminderCompleted;
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* Edit Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Machinery Information</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-1 h-3 w-3" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <FaTimes className="mr-1 h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>

        {/* Reminder Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">📅 Reminder Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reminderDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reminder Date & Time
              </label>
              <input
                type="datetime-local"
                id="reminderDate"
                name="reminderDate"
                value={machineryInfo.reminderDate}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="reminderNote" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reminder Note
              </label>
              <input
                type="text"
                id="reminderNote"
                name="reminderNote"
                value={machineryInfo.reminderNote}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Follow up on machinery requirements"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="reminderCompleted"
                name="reminderCompleted"
                checked={machineryInfo.reminderCompleted}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="reminderCompleted" className="font-medium text-gray-700 dark:text-gray-300">
                Mark reminder as completed
              </label>
            </div>
          </div>
        </div>

        {/* Surplus Machinery */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="hasSurplusMachinery"
              name="hasSurplusMachinery"
              checked={machineryInfo.hasSurplusMachinery}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="hasSurplusMachinery" className="font-medium text-gray-700 dark:text-gray-300">
              Has Surplus Machinery
            </label>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Check if this lead has surplus machinery available for sale or liquidation
            </p>
          </div>
        </div>

        {/* Machinery Interest */}
        <div>
          <label htmlFor="machineryInterest" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Machinery Interest
          </label>
          <input
            type="text"
            id="machineryInterest"
            name="machineryInterest"
            value={machineryInfo.machineryInterest}
            onChange={handleChange}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="CNC Machines, Industrial Equipment, etc."
          />
        </div>

        {/* Machinery Notes */}
        <div>
          <label htmlFor="machineryNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Machinery Notes
          </label>
          <textarea
            id="machineryNotes"
            name="machineryNotes"
            rows={4}
            value={machineryInfo.machineryNotes}
            onChange={handleChange}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            placeholder="Details about the machinery, condition, etc."
          />
        </div>

        {/* Machinery Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Machinery Details</h4>
          
          <div>
            <label htmlFor="machineryTypes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Types (comma separated)
            </label>
            <input
              type="text"
              id="machineryTypes"
              name="machineryTypes"
              value={machineryInfo.machineryDetails.types.join(', ')}
              onChange={handleTypesChange}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="CNC, Lathe, Mill, etc."
            />
          </div>
          
          <div>
            <label htmlFor="machineryBrands" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Brands (comma separated)
            </label>
            <input
              type="text"
              id="machineryBrands"
              name="machineryBrands"
              value={machineryInfo.machineryDetails.brands.join(', ')}
              onChange={handleBrandsChange}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Haas, Okuma, DMG Mori, etc."
            />
          </div>
          
          <div>
            <label htmlFor="machineryDetails.condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Condition
            </label>
            <select
              id="machineryDetails.condition"
              name="machineryDetails.condition"
              value={machineryInfo.machineryDetails.condition}
              onChange={handleChange}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select condition</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="machineryDetails.age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Age
            </label>
            <input
              type="text"
              id="machineryDetails.age"
              name="machineryDetails.age"
              value={machineryInfo.machineryDetails.age}
              onChange={handleChange}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="5 years, 10+ years, etc."
            />
          </div>
          
          <div>
            <label htmlFor="machineryDetails.estimatedValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estimated Value ($)
            </label>
            <input
              type="number"
              id="machineryDetails.estimatedValue"
              name="machineryDetails.estimatedValue"
              value={machineryInfo.machineryDetails.estimatedValue || ''}
              onChange={handleChange}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="25000"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Machinery Information</h3>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <FaEdit className="mr-1 h-3 w-3" />
          Edit
        </button>
      </div>

      {/* Reminder Display */}
      {(lead?.reminderDate || lead?.reminderNote) && (
        <div className={`border rounded-lg p-4 ${
          isReminderOverdue(lead.reminderDate || '') 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
        }`}>
          <div className="flex items-start">
            <FaBell className={`h-5 w-5 mt-0.5 mr-3 ${
              isReminderOverdue(lead.reminderDate || '') ? 'text-red-400' : 'text-yellow-400'
            }`} />
            <div className="flex-1">
              <h4 className="text-sm font-medium">
                {isReminderOverdue(lead.reminderDate || '') ? 'Overdue Reminder' : 'Upcoming Reminder'}
                {lead.reminderCompleted && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                )}
              </h4>
              {lead.reminderDate && (
                <div className="flex items-center mt-1">
                  <FaCalendarAlt className="h-4 w-4 mr-1 text-gray-400" />
                  <p className="text-sm">
                    {new Date(lead.reminderDate).toLocaleString()}
                  </p>
                </div>
              )}
              {lead.reminderNote && (
                <p className="text-sm mt-2">{lead.reminderNote}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Surplus Machinery */}
      <div className="flex items-center">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Surplus Machinery:</h4>
        {lead?.hasSurplusMachinery ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            No
          </span>
        )}
      </div>
      
      {/* Machinery Interest */}
      {lead?.machineryInterest && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Machinery Interest</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{lead.machineryInterest}</p>
        </div>
      )}
      
      {/* Machinery Notes */}
      {lead?.machineryNotes && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Machinery Notes</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{lead.machineryNotes}</p>
        </div>
      )}
      
      {/* Machinery Details */}
      {lead?.machineryDetails && Object.keys(lead.machineryDetails).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Machinery Details</h4>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lead.machineryDetails.types && lead.machineryDetails.types.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Types</h5>
                <div className="mt-1 flex flex-wrap gap-1">
                  {lead.machineryDetails.types.map((type, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {lead.machineryDetails.brands && lead.machineryDetails.brands.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Brands</h5>
                <div className="mt-1 flex flex-wrap gap-1">
                  {lead.machineryDetails.brands.map((brand, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {lead.machineryDetails.condition && (
              <div>
                <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Condition</h5>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{lead.machineryDetails.condition}</p>
              </div>
            )}
            
            {lead.machineryDetails.age && (
              <div>
                <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Age</h5>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{lead.machineryDetails.age}</p>
              </div>
            )}
            
            {lead.machineryDetails.estimatedValue && (
              <div>
                <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Estimated Value</h5>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">${lead.machineryDetails.estimatedValue.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* No Data Message */}
      {(!lead?.hasSurplusMachinery && 
        !lead?.machineryInterest && 
        !lead?.machineryNotes && 
        !lead?.reminderDate &&
        !lead?.reminderNote &&
        (!lead?.machineryDetails || Object.keys(lead?.machineryDetails || {}).length === 0)) && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No machinery information available</p>
      )}
    </div>
  );
};

export default MachineryInfo;