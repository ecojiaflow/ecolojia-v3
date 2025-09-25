import React from 'react';
import { MockTestPanel } from '../components/MockTestPanel';

export function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          🧪 Test des Services Mock
        </h1>
        
        <MockTestPanel />
        
        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">📋 Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Vérifiez les données utilisateur (plan: free)</li>
            <li>Vérifiez les quotas (5 max, décompte à chaque refresh)</li>
            <li>Testez les boutons "Actualiser"</li>
            <li>Pour premium : changez demo_free → demo_premium dans api.ts</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
