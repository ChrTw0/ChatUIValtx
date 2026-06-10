import './AgentBadge.styles.css';
import { IconBot } from '../ui/icons';
import { AGENT_LABELS } from '../../constants';

interface Props {
  agente: string | null;
}

export function AgentBadge({ agente }: Props) {
  if (!agente) return null;
  const label = AGENT_LABELS[agente] ?? agente;
  return (
    <div className="AgentBadge">
      <IconBot className="AgentBadge-icon" />
      {label}
    </div>
  );
}
