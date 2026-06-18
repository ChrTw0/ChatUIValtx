import { type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Streamdown } from 'streamdown';
import 'streamdown/styles.css';
import './Bubble.styles.css';

interface Props {
  text?: string;
  typing?: boolean;
  streaming?: boolean;
  children?: ReactNode;
}

export function Bubble({ text, typing, streaming, children }: Props) {
  if (typing) {
    return (
      <div className="Bubble Bubble--typing">
        <span /><span /><span />
      </div>
    );
  }
  if (!text && !children) return null;

  if (streaming && text) {
    return (
      <div className="Bubble Bubble--text Bubble--streaming">
        <Streamdown>{text}</Streamdown>
      </div>
    );
  }

  return (
    <div className="Bubble Bubble--text">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text ?? ''}</ReactMarkdown>
      {children}
    </div>
  );
}
