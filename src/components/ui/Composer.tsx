import { useState } from 'react';
import './Composer.styles.css';
import { IconAttach, IconSend } from './icons';

interface Props {
  onSend: (text: string) => void;
  onAttach: (file: File) => void;
  disabled?: boolean;
}

export function Composer({ onSend, onAttach, disabled }: Props) {
  const [input, setInput] = useState('');

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
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

  return (
    <div className="ChatFooter">
      <div className="Composer">
        <button className="Composer-attach" onClick={handleAttachClick} title="Adjuntar archivo" aria-label="Adjuntar archivo">
          <IconAttach className="Composer-attachIcon" />
        </button>
        <div className="Composer-inputWrap">
          <textarea
            className="Composer-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            rows={1}
            disabled={disabled}
          />
        </div>
        <button
          className="Composer-sendBtn"
          onClick={submit}
          disabled={disabled || !input.trim()}
          aria-label="Enviar"
        >
          <IconSend className="Composer-sendIcon" />
        </button>
      </div>
    </div>
  );
}
