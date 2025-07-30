// PATH: src/components/admin/StatsCard.tsx
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: string;
  percentage?: number;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  percentage,
  subtitle
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  };

  const textColorClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700',
    red: 'text-red-700'
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 ${colorClasses[color]} p-6 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-bold ${textColorClasses[color]}`}>
              {value}
            </p>
            
            {trend && (
              <span className="text-sm text-green-600 font-medium">
                {trend}
              </span>
            )}
          </div>
          
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          
          {percentage !== undefined && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Taux de réussite</span>
                <span>{Math.round(percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    color === 'green' ? 'bg-green-500' :
                    color === 'blue' ? 'bg-blue-500' :
                    color === 'purple' ? 'bg-purple-500' :
                    color === 'orange' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
// EOF