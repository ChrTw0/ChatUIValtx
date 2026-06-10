import { useRef, useCallback } from 'react';
import { openStream } from '../api/chat';
import type { SSEEvent } from '../types/api';

export function useStream() {
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(
    (sessionId: string, onEvent: (e: SSEEvent) => void, onDone: () => void) => {
      esRef.current?.close();
      esRef.current = openStream(sessionId, onEvent, onDone);
    },
    [],
  );

  const disconnect = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  return { connect, disconnect };
}
