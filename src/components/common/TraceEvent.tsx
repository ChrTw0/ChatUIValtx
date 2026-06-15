import './TraceEvent.styles.css';
import { AGENT_LABELS } from '../../constants';

interface Props {
  agente: string;
  done?: boolean;
}

export function TraceEvent({ agente, done = false }: Props) {
  const label = AGENT_LABELS[agente] ?? agente;
  return (
    <div className={`TraceEvent${done ? ' TraceEvent--done' : ''}`}>
      <div className="TraceEvent-line" />
      <span className="TraceEvent-content">
        <span className="TraceEvent-spinner" />
        <span className="TraceEvent-label">{label}</span>
      </span>
      <div className="TraceEvent-line" />
    </div>
  );
}
