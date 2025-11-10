// PATH: frontend/ecolojiaFrontV3/src/components/scanner/CategoryAutoDetector.tsx
import React from 'react';

export interface ProductCategory {
  type: 'alimentaire' | 'cosmetique' | 'detergent';
  confidence: number;
  icon: string;
  color: string;
  bgColor: string;
  route: string;
}

export class CategoryDetector {
  public static detectCategory(barcode: string): ProductCategory {
    const prefix = barcode.substring(0, 2);
    let detectedType: ProductCategory['type'] = 'alimentaire'; // Par defaut
    let confidence = 0.7;

    // Detection par prefixe de code-barres
    if (['30', '31', '32', '33', '34', '35', '36', '37'].includes(prefix)) {
      detectedType = 'alimentaire';
      confidence = 0.9;
    } else if (['50', '51', '52', '53', '54', '55'].includes(prefix)) {
      detectedType = 'cosmetique';
      confidence = 0.8;
    } else if (['70', '71', '72', '73', '74', '75'].includes(prefix)) {
      detectedType = 'detergent';
      confidence = 0.8;
    }

    return {
      type: detectedType,
      confidence,
      icon: detectedType === 'alimentaire' ? '' : detectedType === 'cosmetique' ? 'aaaaa' : '',
      color: '#7DDE4A',
      bgColor: '#E9F8DF',
      route: '/results'
    };
  }
}

interface CategoryAutoDetectorProps {
  category: ProductCategory;
  barcode: string;
  onConfirm: () => void;
}

export const CategoryAutoDetector: React.FC<CategoryAutoDetectorProps> = ({
  category,
  barcode,
  onConfirm
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{category.icon}</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-1">
          Categorie detectee
        </h3>
        <p className="text-gray-600 text-sm">
          Code-barres: <span className="font-mono">{barcode}</span>
        </p>
      </div>

      <div className="rounded-xl p-4 mb-6 bg-nature-100 border-2 border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <p className="font-semibold text-gray-800 capitalize">
                {category.type}
              </p>
              <p className="text-sm text-gray-600">
                Confiance: {Math.round(category.confidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="w-full bg-primary text-forest py-3 rounded-xl font-semibold hover:bg-[#6BC93A] transition-colors"
      >
        Analyser ce produit {category.icon}
      </button>
    </div>
  );
};

export default CategoryAutoDetector;
// EOF

