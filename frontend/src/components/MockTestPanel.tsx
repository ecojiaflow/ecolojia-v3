// frontend/src/components/MockTestPanel.tsx
import React from 'react';
import { useUser } from '../hooks/useUser';
import { useQuota } from '../hooks/useQuota';

export function MockTestPanel() {
  const { user, loading: userLoading, isPremium, refetch: refetchUser } = useUser();
  const { quota, loading: quotaLoading, hasRemaining, usagePercentage, refetch: refetchQuota } = useQuota();

  if (userLoading || quotaLoading) {
    return <div className="p-4 bg-gray-100 rounded">⏳ Chargement...</div>;
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">🧪 Test Endpoints Mock</h3>
      
      {/* User Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h4 className="font-medium text-blue-800">👤 Utilisateur</h4>
        <p><strong>Plan:</strong> <span className={`px-2 py-1 rounded text-xs ${isPremium ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800'}`}>{user?.plan}</span></p>
        <p><strong>Email:</strong> {user?.email}</p>
        <button onClick={refetchUser} className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
          🔄 Actualiser
        </button>
      </div>

      {/* Quota Info */}
      <div className="p-3 bg-green-50 rounded">
        <h4 className="font-medium text-green-800">📊 Quotas</h4>
        <p><strong>Utilisé:</strong> {quota?.usedToday}/{quota?.limit} ({usagePercentage}%)</p>
        <p><strong>Restant:</strong> <span className={hasRemaining ? 'text-green-700' : 'text-red-600'}>{quota?.remaining}</span></p>
        <p><strong>Reset:</strong> {quota ? new Date(quota.resetAt).toLocaleTimeString() : 'N/A'}</p>
        <button onClick={refetchQuota} className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
          🔄 Actualiser
        </button>
      </div>

      {/* Switch Token Info */}
      <div className="mt-4 p-2 bg-yellow-50 rounded text-sm">
        <strong>🔧 Test:</strong> Pour tester premium, changez le token dans apiClient vers "Bearer demo_premium"
      </div>
    </div>
  );
}

