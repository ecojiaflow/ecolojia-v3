// PATH: frontend/src/components/NotificationContainer.tsx
import { useEffect, useState } from 'react';
import { notifications, type Toast } from '../services/notificationService';

export default function NotificationContainer() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => notifications.subscribe(setItems), []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3" aria-live="polite" role="status">
      {items.map(t => (
        <div key={t.id} className="card p-3 toast-enter" data-type={t.type}>
          <div className="text-sm font-semibold">{t.type.toUpperCase()}</div>
          <div className="text-sm">{t.message}</div>
          <button onClick={() => notifications.remove(t.id)} className="btn-ghost text-xs mt-2">Fermer</button>
        </div>
      ))}
    </div>
  );
}
