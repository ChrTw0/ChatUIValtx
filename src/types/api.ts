export interface ChatMessage {
  texto: string;
  ejecutivo_id: string;
  session_id: string;
  file_ids?: string[];
  respuesta_hitl?: {
    decision: string;
    valor?: unknown;
  };
}

export interface HitlData {
  opciones: string[];
  contexto: Record<string, unknown>;
  hitl_tipo: string;
}

export interface SSEEvent {
  tipo: 'pensando' | 'agente_llamado' | 'respuesta' | 'narrativa' | 'hitl' | 'error' | 'fin' | 'token';
  agente?: string | null;
  mensaje?: string | null;
  token?: string | null;
  datos?: HitlData | DraftData | Record<string, unknown> | null;
}

export interface DraftData {
  oportunidad_id: string;
  cliente: string;
  version: number;
  completitud_pct: number;
  estado: 'borrador' | 'revisado' | 'aprobado' | 'enviado';
  contenido: Record<string, unknown>;
  campos_incompletos: string[];
  moneda?: string;
  margen_estimado?: number;
}
