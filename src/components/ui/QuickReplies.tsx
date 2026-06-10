import './QuickReplies.styles.css';

interface Item {
  code: string;
  name: string;
}

interface Props {
  items: Item[];
  pregunta?: string;
  visible: boolean;
  onSelect: (code: string) => void;
}

export function QuickReplies({ items, pregunta, visible, onSelect }: Props) {
  if (!visible || items.length === 0) return null;

  return (
    <div className="QuickReplies">
      {pregunta && <p className="QuickReplies-pregunta">{pregunta}</p>}
      <div className="QuickReplies-list">
        {items.map((item) => (
          <button key={item.code} className="QuickReply" onClick={() => onSelect(item.code)}>
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
