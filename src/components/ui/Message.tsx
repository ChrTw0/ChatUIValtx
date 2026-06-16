import './Message.styles.css';
import { Bubble } from './Bubble';
import { DraftCard } from './DraftCard';
import { AgentBadge } from '../common/AgentBadge';
import { TraceEvent } from '../common/TraceEvent';
import { HitlCard } from '../chat/HitlCard';
import type { DraftData } from '../../types/api';

interface Props {
  position: 'left' | 'right';
  type?: string;
  text: string;
  agente?: string | null;
  typing?: boolean;
  draft?: DraftData;
  fontFamily?: string;
  // trace
  traceAgente?: string;
  traceDone?: boolean;
  // hitl inline
  hitlOpciones?: string[];
  hitlTipo?: string;
  onVerBorrador?: (draft: DraftData) => void;
  onHitlSelect?: (valor: string) => void;
}

export function Message({
  position, type, text, agente, typing, draft, fontFamily,
  traceAgente, traceDone,
  hitlOpciones, hitlTipo,
  onVerBorrador, onHitlSelect,
}: Props) {
  if (type === 'trace' && traceAgente) {
    return <TraceEvent agente={traceAgente} done={traceDone} />;
  }

  return (
    <div className={`Message Message--${position}`}>
      <div className="Message-main">
        <div className="Message-inner">
          {position === 'left' && <AgentBadge agente={agente ?? null} />}

          {type === 'draft' && draft && onVerBorrador ? (
            <DraftCard draft={draft} onVerBorrador={onVerBorrador} />
          ) : type === 'hitl' && hitlOpciones && onHitlSelect ? (
            <Bubble text={text}>
              <HitlCard
                opciones={hitlOpciones}
                hitl_tipo={hitlTipo ?? 'confirmacion'}
                onSelect={onHitlSelect}
              />
            </Bubble>
          ) : (
            <Bubble text={text} typing={typing} fontFamily={fontFamily} />
          )}
        </div>
      </div>
    </div>
  );
}
