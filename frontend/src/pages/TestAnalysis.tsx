import React, { useState } from 'react';
import analysisService from '../services/analysisService';

const TestAnalysis: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAnalysis = async () => {
    setLoading(true);
    try {
      const response = await analysisService.analyzeManual({
        name: 'Yaourt Nature',
        category: 'food',
        ingredients: 'Lait, ferments lactiques',
        brand: 'Test'
      });
      setResult(response);
    } catch (error) {
      console.error('Test failed:', error);
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Connexion Backend</h1>
      <button 
        onClick={testAnalysis}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Test en cours...' : 'Tester l\'analyse'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestAnalysis;
