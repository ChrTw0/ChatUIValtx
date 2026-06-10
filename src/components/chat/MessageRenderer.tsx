import { Bubble } from '@chatui/core';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { MessageProps } from '@chatui/core/lib/components/Message/Message';
import { HitlCard } from './HitlCard';

const mdComponents: Components = {
  li: ({ children }) => <li>{children}</li>,
};

function normalizeText(text: string): string {
  return text.replace(/  \n/g, '\n').replace(/\n{3,}/g, '\n\n');
}

export function createMessageRenderer(onHitlSelect: (codigo: string) => void) {
  return function renderMessageContent(msg: MessageProps) {
    const { type, content } = msg;

    switch (type) {
      case 'text':
        return (
          <Bubble>
            <div className="md-bubble">
              <ReactMarkdown components={mdComponents}>{normalizeText(content.text)}</ReactMarkdown>
            </div>
          </Bubble>
        );
      case 'typing':
        return (
          <Bubble>
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </Bubble>
        );
      case 'hitl':
        return <HitlCard opciones={content.opciones} hitl_tipo={content.hitl_tipo ?? ''} onSelect={onHitlSelect} />;
      default:
        return null;
    }
  };
}
