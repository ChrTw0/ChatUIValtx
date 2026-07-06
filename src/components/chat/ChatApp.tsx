import { useState } from 'react';
import './ChatApp.styles.css';
import { useChat } from '../../hooks/useChat';
import { useDraftPanel } from '../../hooks/useDraftPanel';
import { Navbar } from '../ui/Navbar';
import { MessageList } from '../ui/MessageList';
import { Composer } from '../ui/Composer';
import { DraftPanel } from '../ui/DraftPanel';
import { IndicadoresPanel } from '../ui/IndicadoresPanel';
import { fetchDraft } from '../../api/drafts';
import type { DraftData } from '../../types/api';

export function ChatApp() {
  const panel = useDraftPanel();
  const [indicadoresOpen, setIndicadoresOpen] = useState(false);
  const { messages, thinking, thinkingFase, enviar, adjuntar, pendingFiles, quitarArchivo } = useChat(
    (draft: DraftData) => panel.abrir(draft)
  );

  async function handleGuardarEjecutar(contenido: Record<string, unknown>) {
    if (!panel.draft) return;

    const camposTexto = Object.entries(contenido)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n');

    const texto = `Guarda el draft de la propuesta para ${panel.draft.cliente} (oportunidad_id: ${panel.draft.oportunidad_id}).\nCampos completados:\n${camposTexto}`;

    panel.cerrar();
    enviar(texto);
  }

  return (
    <div className="ChatApp-wrap">
      <div className={`ChatApp${panel.open ? ' ChatApp--split' : ''}`}>

        <div className="ChatApp-chat">
          <Navbar title="Valtx — Asistente Comercial" onIndicadores={() => setIndicadoresOpen(true)} />

          <MessageList
            messages={messages}
            thinkingFase={thinkingFase}
            onVerBorrador={async (draft) => {
            const full = await fetchDraft(draft.oportunidad_id);
            panel.abrir({ ...full, cliente: draft.cliente });
          }}
            onHitlSelect={(valor) => enviar('', valor)}
          />

          <Composer
            onSend={(text) => enviar(text)}
            onAttach={adjuntar}
            onRemoveFile={quitarArchivo}
            pendingFiles={pendingFiles}
            disabled={thinking}
          />
        </div>

        {panel.open && panel.draft && (
          <div className="ChatApp-panel">
            <DraftPanel
              draft={panel.draft}
              loading={panel.loading}
              onCerrar={panel.cerrar}
              onCancelar={panel.cerrar}
              onGuardarEjecutar={handleGuardarEjecutar}
              onChange={panel.actualizarContenido}
            />
          </div>
        )}

      </div>

      {indicadoresOpen && (
        <IndicadoresPanel onClose={() => setIndicadoresOpen(false)} />
      )}
    </div>
  );
}
