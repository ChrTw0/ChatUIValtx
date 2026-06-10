import { useState } from 'react';

const CAMPO_LABELS: Record<string, string> = {
  cliente:                'Cliente',
  precio_total:           'Precio total',
  entregables:            'Entregables',
  garantias_sla:          'Garantías SLA',
  alcance_tecnico:        'Alcance técnico',
  desglose_costos:        'Desglose de costos',
  plazo_ejecucion:        'Plazo de ejecución',
  equipo_propuesto:       'Equipo propuesto',
  condiciones_comerciales:'Condiciones comerciales',
  requisitos_detectados:  'Requisitos detectados',
  descripcion_servicio:   'Descripción del servicio',
  metodologia:            'Metodología',
  riesgos:                'Riesgos',
};

function labelCampo(campo: string): string {
  return CAMPO_LABELS[campo] ?? campo.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface Props {
  oportunidadId: string;
  completitud: number;
  version: string | number;
  estado: string;
  camposIncompletos: string[];
  onVerDraft: (oportunidadId: string) => void;
}

export function DraftCard({ oportunidadId, completitud, version, estado, camposIncompletos, onVerDraft }: Props) {
  const [expandido, setExpandido] = useState(false);

  const colorBarra = completitud >= 80 ? '#22c55e' : completitud >= 60 ? '#f59e0b' : '#ef4444';
  const versionLabel = String(version).startsWith('v') ? version : `v${version}`;

  return (
    <div className="draft-card">
      <div className="draft-card__header" onClick={() => setExpandido(e => !e)}>
        <span className="draft-card__icono">📄</span>
        <span className="draft-card__titulo">Borrador PTE {versionLabel}</span>
        <span className="draft-card__estado">{estado}</span>
        <span className="draft-card__chevron">{expandido ? '▲' : '▼'}</span>
      </div>

      <div className="draft-card__progreso">
        <div className="draft-card__barra-container">
          <div
            className="draft-card__barra-fill"
            style={{ width: `${completitud}%`, backgroundColor: colorBarra }}
          />
        </div>
        <span className="draft-card__completitud">{completitud.toFixed(0)}% completo</span>
      </div>

      {expandido && (
        <div className="draft-card__detalle">
          {camposIncompletos.length > 0 ? (
            <>
              <p className="draft-card__campos-titulo">Campos pendientes:</p>
              <ul className="draft-card__campos-lista">
                {camposIncompletos.map(campo => (
                  <li key={campo}>{labelCampo(campo)}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="draft-card__completo">Todos los campos completados.</p>
          )}
        </div>
      )}

      <button
        className="draft-card__btn-ver"
        onClick={() => onVerDraft(oportunidadId)}
      >
        Ver borrador completo
      </button>
    </div>
  );
}
