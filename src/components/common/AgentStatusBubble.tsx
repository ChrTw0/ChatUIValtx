import { AGENT_LABELS } from '../../constants';

interface Props {
  agente: string | null;
  pensando: boolean;
}

// Muestra el estado del agente inline dentro del chat durante el procesamiento.
// Reemplaza el AgentBadge externo — el estado vive en el área de mensajes.
export function AgentStatusBubble({ agente, pensando }: Props) {
  if (!pensando) return null;

  const label = agente ? (AGENT_LABELS[agente] ?? agente) : null;
  const texto = label ? `${label} procesando...` : 'Procesando...';

  return (
    <div className="agent-status-bubble">
      <span className="agent-status-dot" />
      <span className="agent-status-text">{texto}</span>
    </div>
  );
}
