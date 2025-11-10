import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';

interface EducationalCard {
  title: string;
  category: string;
  message: string;
  explanation: string;
  source?: {
    name: string;
    url: string;
  };
  trigger: string;
}

interface EducationalCardsProps {
  cards: EducationalCard[];
}

export const EducationalCards: React.FC<EducationalCardsProps> = ({ cards }) => {
  if (!cards || cards.length === 0) {
    return null;
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
      case 'alimentaire':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'cosmetic':
      case 'cosmétique':
        return 'bg-primary-50 border-primary-200 text-forest-dark';
      case 'detergent':
      case 'détergent':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">
          À savoir sur ce produit
        </h3>
      </div>

      {cards.map((card, index) => (
        <div
          key={index}
          className={`rounded-lg border-2 p-5 ${getCategoryColor(card.category)}`}
        >
          <h4 className="font-semibold text-lg mb-2">{card.title}</h4>
          <p className="text-gray-700 mb-3">{card.message}</p>

          {card.explanation && (
            <div className="bg-white bg-opacity-50 rounded p-3 mb-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Pourquoi ? </span>
                {card.explanation}
              </p>
            </div>
          )}

          {card.source && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Source :</span>
              <a href={card.source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                {card.source.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};