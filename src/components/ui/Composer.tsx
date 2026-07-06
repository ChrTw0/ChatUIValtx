import { useState, useRef } from 'react';
import './Composer.styles.css';
import { IconAttach, IconSend, IconDocument, IconClose } from './icons';

interface PendingFile {
  id: string;
  name: string;
}

interface Props {
  onSend: (text: string) => void;
  onAttach: (file: File) => void;
  onRemoveFile?: (id: string) => void;
  pendingFiles?: PendingFile[];
  disabled?: boolean;
}

export function Composer({ onSend, onAttach, onRemoveFile, pendingFiles = [], disabled }: Props) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    resize();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    if (!input.trim() && pendingFiles.length === 0) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleAttachClick() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.eml,.msg';
    fileInput.onchange = (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (file) onAttach(file);
    };
    fileInput.click();
  }

  const canSend = !disabled && (input.trim().length > 0 || pendingFiles.length > 0);

  return (
    <div className="ChatFooter">
      {pendingFiles.length > 0 && (
        <div className="Composer-files">
          {pendingFiles.map(f => (
            <div key={f.id} className="Composer-fileChip">
              <IconDocument className="Composer-fileChip-icon" />
              <span className="Composer-fileChip-name" title={f.name}>{f.name}</span>
              {onRemoveFile && (
                <button
                  className="Composer-fileChip-remove"
                  onClick={() => onRemoveFile(f.id)}
                  aria-label={`Quitar ${f.name}`}
                >
                  <IconClose className="Composer-fileChip-removeIcon" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="Composer">
        <button className="Composer-attach" onClick={handleAttachClick} title="Adjuntar archivo" aria-label="Adjuntar archivo" disabled={disabled}>
          <IconAttach className="Composer-attachIcon" />
        </button>
        <div className="Composer-inputWrap">
          <textarea
            ref={textareaRef}
            className="Composer-input"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={pendingFiles.length > 0 ? 'Añade un mensaje o envía directo…' : 'Escribe tu mensaje...'}
            rows={1}
            disabled={disabled}
          />
        </div>
        <button
          className="Composer-sendBtn"
          onClick={submit}
          disabled={!canSend}
          aria-label="Enviar"
        >
          <IconSend className="Composer-sendIcon" />
        </button>
      </div>
    </div>
  );
}
