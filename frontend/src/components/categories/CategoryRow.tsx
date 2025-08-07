import { Category, UpdateCategoryDto } from "@/services/category-service";
import { useState } from "react";
import { FaSave, FaTimes, FaEdit, FaTrash } from "react-icons/fa";

interface CategoryRowProps {
    category: Category;
    isEditing: boolean;
    onEdit: () => void;
    onSave: (data: UpdateCategoryDto) => void;
    onCancel: () => void;
    onDelete: () => void;
    predefinedColors: string[];
  }
  
  export const CategoryRow: React.FC<CategoryRowProps> = ({
    category,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    predefinedColors,
  }) => {
    const [editData, setEditData] = useState<UpdateCategoryDto>({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6',
      isActive: category.isActive,
    });
  
    const handleSave = () => {
      onSave(editData);
    };
  
    if (isEditing) {
      return (
        <tr>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: editData.color }}
              />
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
              />
            </div>
          </td>
          <td className="px-6 py-4">
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full"
              rows={2}
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {category.leadCount || 0}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editData.isActive}
                onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Active</span>
            </label>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSave}
                className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
              >
                <FaSave />
              </button>
              <button
                onClick={onCancel}
                className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-400"
              >
                <FaTimes />
              </button>
            </div>
          </td>
        </tr>
      );
    }
  
    return (
      <tr>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-3"
              style={{ backgroundColor: category.color }}
            />
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {category.name}
            </div>
          </div>
        </td>
       
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {category.leadCount || 0}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              category.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
            }`}
          >
            {category.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex justify-end space-x-2">
            <button
              onClick={onEdit}
              className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400"
            >
              <FaEdit />
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
              disabled={(category.leadCount || 0) > 0}
              title={(category.leadCount || 0) > 0 ? 'Cannot delete category with leads' : 'Delete category'}
            >
              <FaTrash className={(category.leadCount || 0) > 0 ? 'opacity-50' : ''} />
            </button>
          </div>
        </td>
      </tr>
    );
  };