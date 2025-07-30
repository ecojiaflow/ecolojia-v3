import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CATEGORIES, CategoryType } from '../types/categories';

const CategoryNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-6 py-4 overflow-x-auto">
          {/* Toutes catégories */}
          <Link
            to="/"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              location.pathname === '/'
                ? 'bg-green-100 text-green-800'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            <span>🌱</span>
            <span>Toutes</span>
          </Link>

          {/* Catégories spécifiques */}
          {Object.entries(CATEGORIES).map(([key, config]) => (
            <Link
              key={key}
              to={`/category/${key}`}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                location.pathname === `/category/${key}`
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.name}</span>
            </Link>
          ))}

          {/* Lien Stats */}
          <Link
            to="/stats"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              location.pathname === '/stats'
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <span>📊</span>
            <span>Stats</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategoryNavigation;