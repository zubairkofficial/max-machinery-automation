import React from 'react';
import CategoryManager from '../components/categories/CategoryManager';

const List: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CategoryManager />
    </div>
  );
};

export default List;