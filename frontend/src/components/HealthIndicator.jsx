// frontend/src/components/HealthIndicator.jsx

import React from 'react';

const HealthIndicator = ({ label, value, unit, status, icon, improvement }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'excellent': return '#7DDE4A';
      case 'good': return '#95D36B';
      case 'warning': return '#FFA726';
      case 'danger': return '#FF7043';
      default: return '#DDE9DA';
    }
  };

  const getStatusWidth = (status) => {
    switch(status) {
      case 'excellent': return '90%';
      case 'good': return '70%';
      case 'warning': return '45%';
      case 'danger': return '20%';
      default: return '0%';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        {improvement && (
          <span 
            className="text-sm font-medium" 
            style={{ color: improvement > 0 ? '#7DDE4A' : '#FF7043' }}
          >
            {improvement > 0 ? '+' : ''}{improvement}%
          </span>
        )}
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span 
          className="text-3xl font-bold" 
          style={{ color: getStatusColor(status) }}
        >
          {value}
        </span>
        <span className="text-lg text-gray-500">{unit}</span>
      </div>
      
      <div className="mt-2">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-1000"
            style={{ 
              backgroundColor: getStatusColor(status),
              width: getStatusWidth(status)
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HealthIndicator;