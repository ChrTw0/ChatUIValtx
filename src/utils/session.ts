import { SESSION_ID_KEY } from '../constants';

export function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = `ejecutivo-${crypto.randomUUID()}`;
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_ID_KEY);
}
