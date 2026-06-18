import { useState } from 'react';
import './DraftPanel.styles.css';
import { IconClose, IconSpinner } from './icons';
import type { DraftData } from '../../types/api';

const SECCIONES: { key: string; label: string }[] = [
  { key: 'alcance_tecnico',        label: 'Alcance Técnico' },
  { key: 'entregables',            label: 'Entregables' },
  { key: 'equipo_propuesto',       label: 'Equipo Propuesto' },
  { key: 'plazo_ejecucion',        label: 'Plazo de Ejecución' },
  { key: 'precio_total',           label: 'Precio Total' },
  { key: 'desglose_costos',        label: 'Desglose de Costos' },
  { key: 'condiciones_comerciales',label: 'Condiciones Comerciales' },
  { key: 'garantias_sla',          label: 'Garantías y SLA' },
];

interface Props {
  draft: DraftData;
  loading: boolean;
  onCerrar: () => void;
  onCancelar: () => void;
  onGuardarEjecutar: (contenido: Record<string, unknown>) => void;
  onChange: (campo: string, valor: unknown) => void;
}

export function DraftPanel({ draft, loading, onCerrar, onCancelar, onGuardarEjecutar, onChange }: Props) {
  const [contenidoLocal, setContenidoLocal] = useState<Record<string, unknown>>(
    { ...draft.contenido }
  );

  function handleChange(campo: string, valor: string) {
    setContenidoLocal(prev => ({ ...prev, [campo]: valor }));
    onChange(campo, valor);
  }

  const pct = Math.round(draft.completitud_pct);

  return (
    <div className="DraftPanel">
      <div className="DraftPanel-header">
        <div className="DraftPanel-headerLeft">
          <span className="DraftPanel-title">PTE — {draft.cliente}</span>
          <span className="DraftPanel-meta">v{draft.version} · {pct}% completo</span>
        </div>
        <button className="DraftPanel-close" onClick={onCerrar} aria-label="Cerrar panel">
          <IconClose className="DraftPanel-closeIcon" />
        </button>
      </div>

      {draft.campos_incompletos.length > 0 && (
        <div className="DraftPanel-incompletos">
          <span className="DraftPanel-incompletosLabel">Campos pendientes:</span>
          <span>{draft.campos_incompletos.join(', ')}</span>
        </div>
      )}

      <div className="DraftPanel-body">
        {SECCIONES.map(({ key, label }) => (
          <div className="DraftPanel-field" key={key}>
            <label className="DraftPanel-label">{label}</label>
            <textarea
              className="DraftPanel-textarea"
              value={String(contenidoLocal[key] ?? '')}
              onChange={e => handleChange(key, e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
        ))}
      </div>

      <div className="DraftPanel-footer">
        <button
          className="DraftPanel-btnCancelar"
          onClick={onCancelar}
          disabled={loading}
        >
          Cancelar edición
        </button>
        <button
          className="DraftPanel-btnGuardar"
          onClick={() => onGuardarEjecutar(contenidoLocal)}
          disabled={loading}
        >
          {loading
            ? <><IconSpinner className="DraftPanel-spinner" /> Procesando...</>
            : 'Guardar y Ejecutar IA'}
        </button>
      </div>
    </div>
  );
}
