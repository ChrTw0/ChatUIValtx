import { useState, useCallback } from 'react';
import type { DraftData } from '../types/api';

export interface DraftPanelState {
  open: boolean;
  draft: DraftData | null;
  loading: boolean;
}

export function useDraftPanel() {
  const [state, setState] = useState<DraftPanelState>({
    open: false,
    draft: null,
    loading: false,
  });

  const abrir = useCallback((draft: DraftData) => {
    setState({ open: true, draft, loading: false });
  }, []);

  const cerrar = useCallback(() => {
    setState(s => ({ ...s, open: false }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(s => ({ ...s, loading }));
  }, []);

  const actualizarContenido = useCallback((campo: string, valor: unknown) => {
    setState(s => {
      if (!s.draft) return s;
      return {
        ...s,
        draft: {
          ...s.draft,
          contenido: { ...s.draft.contenido, [campo]: valor },
        },
      };
    });
  }, []);

  return { ...state, abrir, cerrar, setLoading, actualizarContenido };
}
