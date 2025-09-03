// PATH: frontend/src/components/OfflineIndicator.tsx
import { useEffect, useState } from "react";
import { notifications } from "../services/notificationService";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    // Gestionnaires d'événements
    const handleOnline = () => {
      setIsOnline(true);
      notifications.push('success', 'Connexion rétablie');
      checkQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      notifications.push('warning', 'Mode hors ligne activé');
    };

    const checkQueue = () => {
      try {
        const queue = JSON.parse(localStorage.getItem('ecolojia.queue') || '[]');
        setQueueLength(queue.length);
      } catch {
        setQueueLength(0);
      }
    };

    // Écouter les changements de connexion
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier la queue périodiquement
    const interval = setInterval(checkQueue, 5000);
    checkQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Ne rien afficher si en ligne et pas de queue
  if (isOnline && queueLength === 0) return null;

  return (
    <div className={`fixed bottom-4 left-4 px-4 py-2 rounded-2xl shadow-lg text-sm ${
      isOnline ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
    }`}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${
          isOnline ? "bg-green-500" : "bg-red-500"
        } ${syncInProgress ? "animate-pulse" : ""}`} />
        
        {!isOnline ? (
          <span>Mode hors ligne</span>
        ) : syncInProgress ? (
          <span>Synchronisation...</span>
        ) : queueLength > 0 ? (
          <span>{queueLength} élément{queueLength > 1 ? "s" : ""} en attente</span>
        ) : null}
      </div>
    </div>
  );
}