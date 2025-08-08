import React, { useState } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { CreateCategoryDto } from '@/services/category-service';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: (newCategory: CreateCategoryDto) => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onCategoryAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('List name is required');
      return;
    }

    const createDto: CreateCategoryDto = {
      name: formData.name,
      description: formData.description,
      isActive: formData.isActive,
    };

    // Notify parent component with the category data
    onCategoryAdded(createDto);
    toast.success('List created successfully!');
    setFormData({ name: '', description: '', isActive: true }); // Reset form
    onClose(); // Close modal
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create New List
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <FaTimes />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="List name"
                required
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={handleCreate}
              disabled={isCreating || !formData.name.trim()}
              className={`px-4 py-2 text-white rounded-md flex items-center ${
                isCreating
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isCreating ? (
                <>
                  <span className="animate-spin mr-2">&#9696;</span>
                  Creating...
                </>
              ) : (
                <><FaSave className="mr-2" />Save</>
              )}
            </button>
            <button
              onClick={() => {
                setFormData({ name: '', description: '', isActive: true });
                onClose();
              }}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;
