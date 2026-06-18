import './Message.styles.css';
import { Bubble } from './Bubble';
import { DraftCard } from './DraftCard';
import { SkeletonBubble } from './SkeletonBubble';
import { AgentBadge } from '../common/AgentBadge';
import { AgentPill } from '../common/AgentPill';
import { TraceEvent } from '../common/TraceEvent';
import { HitlCard } from '../chat/HitlCard';
import type { DraftData } from '../../types/api';

interface Props {
  position: 'left' | 'right';
  type?: string;
  text: string;
  agente?: string | null;
  typing?: boolean;
  streaming?: boolean;
  draft?: DraftData;
  // trace
  traceAgente?: string;
  traceDone?: boolean;
  // hitl inline
  hitlOpciones?: string[];
  hitlTipo?: string;
  hitlContexto?: Record<string, unknown>;
  onVerBorrador?: (draft: DraftData) => void;
  onHitlSelect?: (valor: string) => void;
}

export function Message({
  position, type, text, agente, typing, streaming, draft,
  traceAgente, traceDone,
  hitlOpciones, hitlTipo, hitlContexto,
  onVerBorrador, onHitlSelect,
}: Props) {
  if (type === 'trace' && traceAgente) {
    return <TraceEvent agente={traceAgente} done={traceDone} />;
  }
  if (type === 'skeleton') {
    return (
      <div className="Message Message--left">
        <div className="Message-main"><div className="Message-inner"><SkeletonBubble /></div></div>
      </div>
    );
  }
  if (type === 'typing') {
    return (
      <div className="Message Message--left">
        <div className="Message-main"><div className="Message-inner"><Bubble typing /></div></div>
      </div>
    );
  }
  if (type === 'pill' && agente) {
    return (
      <div className="Message Message--left">
        <div className="Message-main"><div className="Message-inner"><AgentPill agente={agente} /></div></div>
      </div>
    );
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
                contexto={hitlContexto}
                onSelect={onHitlSelect}
              />
            </Bubble>
          ) : (
            <Bubble text={text} typing={typing} streaming={streaming} />
          )}
        </div>
      </div>
    </div>
  );
}
