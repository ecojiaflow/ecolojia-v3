// PATH: src/components/admin/ImportProgress.tsx
import React, { useState } from 'react';
import { Download, Play, Pause, AlertCircle } from 'lucide-react';

const ImportProgress: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<string>('');

  const handleStartImport = async () => {
    setIsImporting(true);
    setProgress(0);
    setImportStatus('Connexion  OpenFoodFacts...');

    // Simulation du processus d'import
    const steps = [
      { progress: 10, status: 'Connexion  OpenFoodFacts...' },
      { progress: 25, status: 'Recuperation des produits...' },
      { progress: 50, status: 'Analyse des ingredients...' },
      { progress: 75, status: 'Classification NOV?...' },
      { progress: 90, status: 'Sauvegarde en base...' },
      { progress: 100, status: 'Import termine avec succes!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(step.progress);
      setImportStatus(step.status);
    }

    setTimeout(() => {
      setIsImporting(false);
      setProgress(0);
      setImportStatus('');
    }, 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <Download className="h-5 w-5 mr-2" />
          Import de produits
        </h2>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleStartImport}
            disabled={isImporting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isImporting ? 'bg-gray-100 text-neutral-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isImporting ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Import en cours...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Demarrer import</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      {isImporting && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{importStatus}</span>
            <span className="text-sm text-neutral-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Statistiques d'import */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">25</div>
          <div className="text-sm text-gray-600">Produits  importer</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">23</div>
          <div className="text-sm text-gray-600">Succes</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">2</div>
          <div className="text-sm text-gray-600">aachecs</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">92%</div>
          <div className="text-sm text-gray-600">Taux de reussite</div>
        </div>
      </div>

      {/* Aide */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-yellow-800 font-medium">Conseils pour l'import</h3>
            <ul className="text-yellow-700 text-sm mt-1 space-y-1">
              <li>aa L'import peut prendre 2-5 minutes selon la quantite</li>
              <li>aa Les produits existants ne seront pas dupliques</li>
              <li>aa Verifiez la connexion internet avant de commencer</li>
              <li>aa Les images sont telechargees automatiquement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportProgress;
// EOF



