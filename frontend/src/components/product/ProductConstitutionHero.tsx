import React from 'react';
import { Constitution } from './Constitution';

interface ConstitutionHeroProps {
  constitution: any;
  productName: string;
}

export const ProductConstitutionHero: React.FC<ConstitutionHeroProps> = ({ 
  constitution, 
  productName 
}) => {
  if (!constitution) return null;

  return (
    <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📋</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Constitution Ecolojia
          </h1>
          <p className="text-sm text-gray-600">
            Comprendre {productName} en 3 cartes
          </p>
        </div>
      </div>
      
      <Constitution constitution={constitution} />
    </div>
  );
};
