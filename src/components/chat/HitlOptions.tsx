import type { HitlState } from '../../types/ui';

interface Props {
  hitl: HitlState;
  onSelect: (opcion: string, index: number) => void;
}

export function HitlOptions({ hitl, onSelect }: Props) {
  if (!hitl.activo || hitl.opciones.length === 0) return null;

  return (
    <div style={{ padding: '8px 16px' }}>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>{hitl.pregunta}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {hitl.opciones.map((opcion, i) => (
          <button
            key={i}
            onClick={() => onSelect(String(i + 1), i)}
            style={{
              textAlign: 'left',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#f9f9f9',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {i + 1}. {opcion}
          </button>
        ))}
      </div>
    </div>
  );
}
