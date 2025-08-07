import React from 'react';
import CategoryManager from '../components/categories/CategoryManager';

const Categories: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CategoryManager />
    </div>
  );
};

export default Categories;