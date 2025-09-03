// PATH: frontend/src/services/notificationService.ts
export type ToastType = 'info'|'success'|'warning'|'error';
export interface Toast { id: string; type: ToastType; message: string; timeout: number; }

type Listener = (items: Toast[]) => void;

class NotificationStore {
  private items: Toast[] = [];
  private listeners = new Set<Listener>();

  push(type: ToastType, message: string, timeout = 3500) {
    const id = Math.random().toString(36).slice(2);
    this.items = [...this.items, { id, type, message, timeout }];
    this.emit();
    window.setTimeout(() => this.remove(id), timeout);
  }

  remove(id: string) {
    this.items = this.items.filter(t => t.id !== id);
    this.emit();
  }

  subscribe(fn: Listener) { this.listeners.add(fn); fn(this.items); return () => this.listeners.delete(fn); }
  private emit() { this.listeners.forEach(fn => fn(this.items)); }
}

export const notifications = new NotificationStore();
