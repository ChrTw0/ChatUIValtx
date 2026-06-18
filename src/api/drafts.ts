import { apiFetch } from './client';
import type { DraftData } from '../types/api';

export async function fetchDraft(oportunidadId: string): Promise<DraftData> {
  const res = await apiFetch(`/drafts/${oportunidadId}`);
  return res.json() as Promise<DraftData>;
}
