import './ChatApp.styles.css';
import { useChat } from '../../hooks/useChat';
import { useDraftPanel } from '../../hooks/useDraftPanel';
import { Navbar } from '../ui/Navbar';
import { MessageList } from '../ui/MessageList';
import { Composer } from '../ui/Composer';
import { DraftPanel } from '../ui/DraftPanel';
import { sendMessage } from '../../api/chat';
import { getOrCreateSessionId } from '../../utils/session';
import { EJECUTIVO_ID } from '../../constants';
import type { DraftData } from '../../types/api';

export function ChatApp() {
  const panel = useDraftPanel();
  const { messages, thinking, thinkingFase, enviar, adjuntar } = useChat(
    (draft: DraftData) => panel.abrir(draft)
  );

  async function handleGuardarEjecutar(contenido: Record<string, unknown>) {
    if (!panel.draft) return;
    panel.setLoading(true);
    try {
      await sendMessage({
        texto: '',
        ejecutivo_id: EJECUTIVO_ID,
        session_id: getOrCreateSessionId(),
        respuesta_hitl: {
          decision: 'guardar_draft',
          valor: { oportunidad_id: panel.draft.oportunidad_id, contenido },
        },
      });
    } finally {
      panel.setLoading(false);
      panel.cerrar();
    }
  }

  return (
    <div className="ChatApp-wrap">
      <div className={`ChatApp${panel.open ? ' ChatApp--split' : ''}`}>

        <div className="ChatApp-chat">
          <Navbar title="Valtx — Asistente Comercial" />

          <MessageList
            messages={messages}
            thinkingFase={thinkingFase}
            onVerBorrador={(draft) => panel.abrir(draft)}
            onHitlSelect={(valor) => enviar('', valor)}
          />

          <Composer
            onSend={(text) => enviar(text)}
            onAttach={adjuntar}
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
    </div>
  );
}
