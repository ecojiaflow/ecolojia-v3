// PATH: src/components/admin/LogViewer.tsx
import React, { useState } from 'react';
import { ImportLog } from '../../types/admin';
import { FileText, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface LogViewerProps {
  logs: ImportLog[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getStatusIcon = (status: 'success' | 'error' | 'running') => {
    const icons = {
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      error: <XCircle className="h-5 w-5 text-red-500" />,
      running: <Clock className="h-5 w-5 text-blue-500 animate-spin" />
    };
    return icons[status];
  };

  const getStatusBadge = (status: 'success' | 'error' | 'running') => {
    const badges = {
      success: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      running: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    const labels = {
      success: 'Succès',
      error: 'Erreur',
      running: 'En cours'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun log d'import</h3>
          <p className="text-gray-600">Les logs d'import apparaîtront ici après votre premier import.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Historique des imports ({logs.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-200">
        {logs.map((log) => (
          <div key={log.id} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(log.status)}
                <div>
                  <div className="font-medium text-gray-900">
                    Import {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {log.fileName || 'OpenFoodFacts'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {getStatusBadge(log.status)}
                <button
                  onClick={() => toggleLogExpansion(log.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {expandedLogs.has(log.id) ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Résumé rapide */}
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
              <span>📊 {log.productsProcessed} traités</span>
              <span>✅ {log.productsSuccess} réussis</span>
              <span>❌ {log.productsFailed} échoués</span>
              <span>⏱️ {formatDuration(log.duration)}</span>
            </div>

            {/* Barre de progression */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Taux de réussite</span>
                <span className="text-xs text-gray-500">
                  {log.productsProcessed > 0 
                    ? Math.round((log.productsSuccess / log.productsProcessed) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    log.status === 'success' ? 'bg-green-500' : 
                    log.status === 'error' ? 'bg-red-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ 
                    width: `${log.productsProcessed > 0 
                      ? (log.productsSuccess / log.productsProcessed) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Détails étendus */}
            {expandedLogs.has(log.id) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Détails techniques</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                          {log.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Début:</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durée:</span>
                        <span>{formatDuration(log.duration)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Résultats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total traités:</span>
                        <span className="font-medium">{log.productsProcessed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Succès:</span>
                        <span className="font-medium text-green-600">{log.productsSuccess}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Échecs:</span>
                        <span className="font-medium text-red-600">{log.productsFailed}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message d'erreur */}
                {log.errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-1">Message d'erreur</h4>
                    <p className="text-red-700 text-sm font-mono">{log.errorMessage}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogViewer;
// EOF