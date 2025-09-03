// PATH: frontend/src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { notifications, Toast } from '../services/notificationService';

export function useNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => notifications.subscribe(setToasts), []);
  return { toasts };
}
