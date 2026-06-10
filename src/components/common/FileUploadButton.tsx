import { useRef } from 'react';
import { uploadFile } from '../../api/files';

interface Props {
  ejecutivoId: string;
  onUploaded: (fileId: string, filename: string) => void;
  onError?: (err: string) => void;
}

export function FileUploadButton({ ejecutivoId, onUploaded, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileId = await uploadFile(file, ejecutivoId);
      onUploaded(fileId, file.name);
    } catch (err) {
      onError?.(String(err));
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <button onClick={() => inputRef.current?.click()} title="Adjuntar archivo">
        📎
      </button>
      <input ref={inputRef} type="file" accept=".pdf,.eml,.msg" hidden onChange={handleChange} />
    </>
  );
}
