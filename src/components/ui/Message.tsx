import './Message.styles.css';
import { Bubble } from './Bubble';
import { DraftCard } from './DraftCard';
import { AgentBadge } from '../common/AgentBadge';
import type { DraftData } from '../../types/api';

interface Props {
  position: 'left' | 'right';
  type?: string;
  text: string;
  agente?: string | null;
  typing?: boolean;
  draft?: DraftData;
  onVerBorrador?: (draft: DraftData) => void;
}

export function Message({ position, type, text, agente, typing, draft, onVerBorrador }: Props) {
  return (
    <div className={`Message Message--${position}`}>
      <div className="Message-main">
        <div className="Message-inner">
          {position === 'left' && <AgentBadge agente={agente ?? null} />}
          {type === 'draft' && draft && onVerBorrador
            ? <DraftCard draft={draft} onVerBorrador={onVerBorrador} />
            : <Bubble text={text} typing={typing} />
          }
        </div>
      </div>
    </div>
  );
}
