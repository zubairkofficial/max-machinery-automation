import React, { useState, useEffect } from 'react';
import { categoryService, Category, CreateCategoryDto, UpdateCategoryDto } from '../../services/category-service';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaTag } from 'react-icons/fa';
import { CategoryRow } from './CategoryRow';
import AddCategoryModal from './AddCategoryModal';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    // description: '',
    // color: '#3b82f6',
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    fetchCategories();
  }, []);

    const handleCreateCategory = async (categoryData: CreateCategoryDto) => {
    try {
      setError(null);
      const createdCategory = await categoryService.create(categoryData); // API call to create category
      setCategories((prevCategories) => [...prevCategories, createdCategory]); // Update the category list
      setIsCreating(false); // Close the modal
    } catch (error: any) {
      console.error('Failed to create category:', error);
      setError(error.response?.data?.message || 'Failed to create category');
    }
  }
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      
      // Get lead counts for each category
      const categoriesWithCounts = await Promise.all(
        data.map(async (category) => {
          try {
            const { leadCount } = await categoryService.getLeadCount(category.id);
            return { ...category, leadCount };
          } catch (error) {
            console.error(`Failed to get lead count for category ${category.id}:`, error);
            return { ...category, leadCount: 0 };
          }
        })
      );
      
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      await categoryService.create(formData);
      setIsCreating(false);
      setFormData({ name: '',  isActive: true });
      await fetchCategories();
    } catch (error: any) {
      console.error('Failed to create category:', error);
      setError(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleUpdate = async (id: string, data: UpdateCategoryDto) => {
    try {
      setError(null);
      await categoryService.update(id, data);
      setEditingId(null);
      await fetchCategories();
    } catch (error: any) {
      console.error('Failed to update category:', error);
      setError(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }

    try {
      setError(null);
      await categoryService.delete(id);
      await fetchCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      setError(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={isCreating}
        >
          <FaPlus className="mr-2" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <AddCategoryModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCategoryAdded={handleCreateCategory}
      />
      )}

      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Category
              </th>
           
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Leads
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                isEditing={editingId === category.id}
                onEdit={() => setEditingId(category.id)}
                onSave={(data) => handleUpdate(category.id, data)}
                onCancel={() => setEditingId(null)}
                onDelete={() => handleDelete(category.id, category.name)}
                predefinedColors={predefinedColors}
              />
            ))}
          </tbody>
        </table>
        
        {categories.length === 0 && (
          <div className="p-8 text-center">
            <FaTag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No categories</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new category.</p>
          </div>
        )}
      </div>
    </div>
  );
};



export default CategoryManager;


