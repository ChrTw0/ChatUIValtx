import { BASE_URL, apiFetch } from './client';
import type { ChatMessage, SSEEvent } from '../types/api';

export async function sendMessage(body: ChatMessage): Promise<void> {
  await apiFetch('/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function openStream(
  sessionId: string,
  onEvent: (e: SSEEvent) => void,
  onDone: () => void,
): EventSource {
  const es = new EventSource(`${BASE_URL}/chat/stream/${sessionId}`);

  es.addEventListener('mensaje', (e: MessageEvent) => {
    const data: SSEEvent = JSON.parse(e.data);
    onEvent(data);
    if (data.tipo === 'fin') {
      es.close();
      onDone();
    }
  });

  es.addEventListener('fin', () => { es.close(); onDone(); });
  es.addEventListener('ping', () => {});
  es.onerror = () => { es.close(); onDone(); };

  return es;
}
