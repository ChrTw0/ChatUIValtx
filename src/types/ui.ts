export interface HitlState {
  activo: boolean;
  pregunta: string;
  opciones: string[];
  contexto: Record<string, unknown>;
}

export interface ChatStatus {
  pensando: boolean;
  agenteActivo: string | null;
  error: string | null;
}
