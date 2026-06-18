import { useEffect, useRef } from 'react';
import './MessageList.styles.css';
import { Message } from './Message';
import { SkeletonBubble } from './SkeletonBubble';
import { AgentPill } from '../common/AgentPill';
import type { MessageProps } from '@chatui/core';
import type { DraftData } from '../../types/api';
import type { ThinkingFase } from '../../types/ui';

interface Props {
  messages: MessageProps[];
  thinkingFase: ThinkingFase;
  onVerBorrador?: (draft: DraftData) => void;
  onHitlSelect?: (valor: string) => void;
}

export function MessageList({ messages, thinkingFase, onVerBorrador, onHitlSelect }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingFase]);

  return (
    <div className="MessageContainer">
      <div className="MessageList">
        {messages.map((msg) => (
          <Message
            key={msg._id}
            position={(msg.position as 'left' | 'right') ?? 'left'}
            type={msg.type}
            text={msg.content?.text ?? ''}
            agente={msg.content?.agente ?? null}
            draft={msg.content?.draft as DraftData | undefined}
            streaming={msg.content?.streaming as boolean | undefined}
            traceAgente={msg.content?.agente as string | undefined}
            traceDone={msg.content?.done as boolean | undefined}
            hitlOpciones={msg.content?.opciones as string[] | undefined}
            hitlTipo={msg.content?.hitl_tipo as string | undefined}
            hitlContexto={msg.content?.contexto as Record<string, unknown> | undefined}
            onVerBorrador={onVerBorrador}
            onHitlSelect={onHitlSelect}
          />
        ))}

        {thinkingFase.tipo === 'skeleton' && (
          <div className="Message Message--left">
            <div className="Message-main">
              <div className="Message-inner">
                <SkeletonBubble />
              </div>
            </div>
          </div>
        )}

        {thinkingFase.tipo === 'typing' && (
          <div className="Message Message--left">
            <div className="Message-main">
              <div className="Message-inner">
                <Message position="left" text="" typing />
              </div>
            </div>
          </div>
        )}

        {thinkingFase.tipo === 'pill' && (
          <div className="Message Message--left">
            <div className="Message-main">
              <div className="Message-inner">
                <AgentPill agente={thinkingFase.agente} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
