import './AgentPill.styles.css';
import { AGENT_PILL_LABELS, AGENT_LABELS } from '../../constants';

interface Props {
  agente: string;
}

export function AgentPill({ agente }: Props) {
  const label = AGENT_PILL_LABELS[agente] ?? (AGENT_LABELS[agente] ? AGENT_LABELS[agente] + '...' : agente + '...');
  return (
    <div className="AgentPill">
      <div className="AgentPill-spinner" />
      <span className="AgentPill-label">{label}</span>
    </div>
  );
}
