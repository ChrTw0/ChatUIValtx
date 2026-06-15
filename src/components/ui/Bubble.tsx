import { type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import './Bubble.styles.css';

interface Props {
  text?: string;
  typing?: boolean;
  children?: ReactNode;
}

export function Bubble({ text, typing, children }: Props) {
  if (typing) {
    return (
      <div className="Bubble Bubble--typing">
        <span /><span /><span />
      </div>
    );
  }
  return (
    <div className="Bubble Bubble--text">
      <ReactMarkdown>{text ?? ''}</ReactMarkdown>
      {children}
    </div>
  );
}
