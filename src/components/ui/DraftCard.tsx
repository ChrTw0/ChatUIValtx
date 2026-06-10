import './DraftCard.styles.css';
import { IconDocument } from './icons';
import type { DraftData } from '../../types/api';

interface Props {
  draft: DraftData;
  onVerBorrador: (draft: DraftData) => void;
}

export function DraftCard({ draft, onVerBorrador }: Props) {
  const pct = Math.round(draft.completitud_pct);
  const estado = draft.estado === 'borrador' ? 'Borrador' :
                 draft.estado === 'revisado' ? 'Revisado' :
                 draft.estado === 'aprobado' ? 'Aprobado' : 'Enviado';

  return (
    <div className="DraftCard">
      <div className="DraftCard-icon">
        <IconDocument className="DraftCard-docIcon" />
      </div>
      <div className="DraftCard-body">
        <span className="DraftCard-title">PTE — {draft.cliente}</span>
        <span className="DraftCard-meta">
          v{draft.version} · {estado} · {pct}% completo
        </span>
      </div>
      <button
        className="DraftCard-btn"
        onClick={() => onVerBorrador(draft)}
        aria-label="Ver borrador"
      >
        Ver
      </button>
    </div>
  );
}
