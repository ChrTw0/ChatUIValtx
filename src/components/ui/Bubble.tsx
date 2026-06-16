import { type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Bubble.styles.css';

interface Props {
  text?: string;
  typing?: boolean;
  children?: ReactNode;
  fontFamily?: string;
}

export function Bubble({ text, typing, children, fontFamily }: Props) {
  if (typing) {
    return (
      <div className="Bubble Bubble--typing">
        <span /><span /><span />
      </div>
    );
  }
  return (
    <div className="Bubble Bubble--text" style={fontFamily ? { fontFamily } : undefined}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text ?? ''}</ReactMarkdown>
      {children}
    </div>
  );
}
