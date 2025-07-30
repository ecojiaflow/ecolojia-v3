// PATH: frontend/src/components/UltraProcessingPanel.tsx
import React from 'react';

interface UltraProcessingResult {
  level: 'léger' | 'modéré' | 'sévère';
  score: number;
  detected: string[];
  justification: string;
}

interface Props {
  result: UltraProcessingResult;
}

const UltraProcessingPanel: React.FC<Props> = ({ result }) => {
  const getColor = () => {
    switch (result.level) {
      case 'léger': return 'green';
      case 'modéré': return 'orange';
      case 'sévère': return 'red';
      default: return 'gray';
    }
  };

  const color = getColor();

  return (
    <div className={`border-l-4 border-${color}-500 bg-${color}-50 p-6 rounded-2xl mb-6`}>
      <h3 className={`text-${color}-700 text-xl font-bold mb-2`}>
        🧪 Niveau de Transformation : {result.level.toUpperCase()}
      </h3>
      <p className="text-sm text-gray-700 mb-3">{result.justification}</p>

      <div className="text-sm text-gray-600 mb-2">
        <strong>Score de transformation : </strong> {result.score} / 100
      </div>

      <div>
        <strong className="text-sm text-gray-700">Procédés détectés :</strong>
        <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
          {result.detected.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UltraProcessingPanel;
// EOF
