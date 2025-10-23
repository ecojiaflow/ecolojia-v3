// PATH: frontend/src/services/offlineService.ts
type Task = { id: string; url: string; method: 'POST'|'PUT'|'DELETE'; body?: unknown };
const KEY = 'ecolojia.queue';

function load(): Task[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function save(tasks: Task[]) { localStorage.setItem(KEY, JSON.stringify(tasks)); }

export function enqueue(t: Omit<Task,'id'>) {
  const id = Math.random().toString(36).slice(2);
  const tasks = load(); tasks.push({ id, ...t }); save(tasks);
}

export function flush(handler: (t: Task) => Promise<void>) {
  const tasks = load(); const rest: Task[] = [];
  return tasks.reduce<Promise<void>>(async (acc, t) => {
    await acc;
    try { await handler(t); } catch { rest.push(t); }
  }, Promise.resolve()).finally(() => save(rest));
}
