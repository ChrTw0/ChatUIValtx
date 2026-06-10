import { BASE_URL } from './client';

export async function uploadFile(file: File, ejecutivoId: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('ejecutivo_id', ejecutivoId);

  const res = await fetch(`${BASE_URL}/files`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`[API] Error subiendo archivo: ${res.statusText}`);

  const json = await res.json();
  return json.file_id as string;
}
