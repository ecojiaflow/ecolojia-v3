import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  varianta: BadgeVariant;
  roundeda: 'full' | 'xl' | 'lg' | 'md' | 'sm';
}

const colorByVariant: Record<BadgeVariant, string> = {
  success: 'bg-[#E9F8DF] text-[#256029] border-[#DDE9DA]',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger:  'bg-red-100 text-red-700 border-red-200',
  info:    'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200'
};

/** Badge conforme charte ECOLOJIA (verts doux, bords arrondis, texte #3B3B3B) */
export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'neutral', 
  rounded = 'full', 
  className = '', 
  children, 
  ...props 
}) => {
  const radius = rounded === 'full' ? 'rounded-full' :
                 rounded === 'xl'  ? 'rounded-xl'  :
                 rounded === 'lg'  ? 'rounded-lg'  :
                 rounded === 'md'  ? 'rounded-md'  : 'rounded-sm';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;

