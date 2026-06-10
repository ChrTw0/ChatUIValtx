import { useEffect, useRef } from 'react';
import './MessageList.styles.css';
import { Message } from './Message';
import type { MessageProps } from '@chatui/core';
import type { DraftData } from '../../types/api';

interface Props {
  messages: MessageProps[];
  typing: boolean;
  onVerBorrador?: (draft: DraftData) => void;
}

export function MessageList({ messages, typing, onVerBorrador }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

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
            onVerBorrador={onVerBorrador}
          />
        ))}
        {typing && (
          <Message position="left" text="" typing />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
