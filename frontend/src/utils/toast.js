import { writable } from 'svelte/store';

export const toasts = writable([]);

let id = 0;
export function showToast({ message, type = 'info', timeout = 3000 }) {
  const t = { id: ++id, message, type };
  toasts.update(list => [...list, t]);
  if (timeout) {
    setTimeout(() => dismissToast(t.id), timeout);
  }
}

export function dismissToast(id) {
  toasts.update(list => list.filter(t => t.id !== id));
}

