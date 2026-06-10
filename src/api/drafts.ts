import { apiFetch } from './client';

export interface DraftResponse {
  oportunidad_id: string;
  version: string | number;
  estado: string;
  completitud_pct: number;
  campos_incompletos: string[];
  margen_proyectado: number | null;
  contenido: Record<string, string>;
}

export async function getDraft(oportunidadId: string): Promise<DraftResponse> {
  return apiFetch(`/drafts/${oportunidadId}`);
}
