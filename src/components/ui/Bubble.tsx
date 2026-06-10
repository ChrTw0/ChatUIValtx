import './Bubble.styles.css';

interface Props {
  text?: string;
  typing?: boolean;
}

export function Bubble({ text, typing }: Props) {
  if (typing) {
    return (
      <div className="Bubble Bubble--typing">
        <span /><span /><span />
      </div>
    );
  }
  return (
    <div className="Bubble Bubble--text">
      {text}
    </div>
  );
}
