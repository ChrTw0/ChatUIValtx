import { useState, useCallback } from 'react';
import type { HitlState } from '../types/ui';

const HITL_VACIO: HitlState = { activo: false, pregunta: '', opciones: [], contexto: {} };

export function useHitl() {
  const [hitl, setHitl] = useState<HitlState>(HITL_VACIO);

  const activar = useCallback((pregunta: string, opciones: string[], contexto: Record<string, unknown>) => {
    setHitl({ activo: true, pregunta, opciones, contexto });
  }, []);

  const resolver = useCallback(() => {
    setHitl(HITL_VACIO);
  }, []);

  return { hitl, activar, resolver };
}
