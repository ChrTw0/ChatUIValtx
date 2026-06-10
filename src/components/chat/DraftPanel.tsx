import { useDraftPanel } from '../../hooks/useDraftPanel';
import type { DraftActivo } from '../../hooks/useChat';

const CAMPO_LABELS: Record<string, string> = {
  cliente:                 'Cliente',
  precio_total:            'Precio total',
  entregables:             'Entregables',
  garantias_sla:           'Garantías SLA',
  alcance_tecnico:         'Alcance técnico',
  desglose_costos:         'Desglose de costos',
  plazo_ejecucion:         'Plazo de ejecución',
  equipo_propuesto:        'Equipo propuesto',
  condiciones_comerciales: 'Condiciones comerciales',
  requisitos_detectados:   'Requisitos detectados',
  descripcion_servicio:    'Descripción del servicio',
  metodologia:             'Metodología',
  riesgos:                 'Riesgos',
};

function labelCampo(campo: string): string {
  return CAMPO_LABELS[campo] ?? campo.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface Props {
  draftActivo: DraftActivo;
  onCerrar: () => void;
  enviar: (texto: string) => Promise<void>;
}

export function DraftPanel({ draftActivo, onCerrar, enviar }: Props) {
  const {
    draft,
    cargando,
    camposState,
    campoEditando,
    iniciarEdicion,
    cancelarEdicion,
    cambiarValor,
    guardarCampo,
  } = useDraftPanel(draftActivo, true, enviar);

  const completitud = draft?.completitud_pct ?? draftActivo.completitud_pct;
  const version = String(draftActivo.version).startsWith('v') ? draftActivo.version : `v${draftActivo.version}`;
  const colorBarra = completitud >= 80 ? '#22c55e' : completitud >= 60 ? '#f59e0b' : '#ef4444';

  const camposCompletos = draft
    ? Object.keys(draft.contenido).filter(c => draft.contenido[c] && !(draft.campos_incompletos ?? []).includes(c))
    : [];
  const camposIncompletos = draft?.campos_incompletos ?? draftActivo.campos_incompletos;

  const hayEdicion = campoEditando !== null;
  const guardando = campoEditando ? camposState[campoEditando]?.guardando : false;

  return (
    <div className="draft-panel">
      {/* Header */}
      <div className="draft-panel__header">
        <button className="draft-panel__cerrar" onClick={onCerrar} aria-label="Cerrar panel">✕</button>
        <div className="draft-panel__header-info">
          <span className="draft-panel__titulo">Borrador PTE {version}</span>
          {draft && <span className="draft-panel__cliente">{draft.contenido.cliente ?? ''}</span>}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="draft-panel__progreso">
        <div className="draft-panel__barra-container">
          <div
            className="draft-panel__barra-fill"
            style={{ width: `${completitud}%`, backgroundColor: colorBarra }}
          />
        </div>
        <span className="draft-panel__completitud">{completitud.toFixed(0)}% completo</span>
      </div>

      {/* Contenido */}
      <div className="draft-panel__body">
        {cargando && (
          <div className="draft-panel__cargando">Cargando borrador...</div>
        )}

        {!cargando && draft && (
          <>
            {/* Campos completos */}
            {camposCompletos.length > 0 && (
              <div className="draft-panel__seccion">
                <p className="draft-panel__seccion-titulo">Completado</p>
                {camposCompletos.map(campo => (
                  <div key={campo} className="draft-panel__campo draft-panel__campo--completo">
                    <span className="draft-panel__campo-label">{labelCampo(campo)}</span>
                    <p className="draft-panel__campo-valor">{draft.contenido[campo]}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Campos incompletos */}
            {camposIncompletos.length > 0 && (
              <div className="draft-panel__seccion">
                <p className="draft-panel__seccion-titulo">Pendiente</p>
                {camposIncompletos.map(campo => {
                  const estado = camposState[campo];
                  const editando = estado?.editando ?? false;
                  const okFlash = estado?.guardadoOk ?? false;

                  return (
                    <div
                      key={campo}
                      className={[
                        'draft-panel__campo',
                        editando ? 'draft-panel__campo--editando' : '',
                        okFlash ? 'draft-panel__campo--ok' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <div className="draft-panel__campo-row">
                        <span className="draft-panel__campo-label">{labelCampo(campo)}</span>
                        {!editando && !campoEditando && (
                          <button
                            className="draft-panel__btn-editar"
                            onClick={() => iniciarEdicion(campo)}
                          >
                            Editar
                          </button>
                        )}
                      </div>

                      {editando ? (
                        <textarea
                          className="draft-panel__textarea"
                          value={estado?.valor ?? ''}
                          onChange={e => cambiarValor(campo, e.target.value)}
                          rows={3}
                          autoFocus
                          disabled={guardando}
                          placeholder={`Ingresa ${labelCampo(campo).toLowerCase()}...`}
                        />
                      ) : (
                        estado?.valor
                          ? <p className="draft-panel__campo-valor draft-panel__campo-valor--pendiente">{estado.valor}</p>
                          : <p className="draft-panel__campo-vacio">Sin completar</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {camposCompletos.length === 0 && camposIncompletos.length === 0 && (
              <p className="draft-panel__todo-completo">Todos los campos completados.</p>
            )}
          </>
        )}
      </div>

      {/* Footer sticky — solo visible al editar */}
      {hayEdicion && (
        <div className="draft-panel__footer">
          <button
            className="draft-panel__btn-cancelar"
            onClick={cancelarEdicion}
            disabled={guardando ?? false}
          >
            Cancelar edición
          </button>
          <button
            className="draft-panel__btn-guardar"
            onClick={() => campoEditando && guardarCampo(campoEditando)}
            disabled={guardando ?? false}
          >
            {guardando ? (
              <span className="draft-panel__spinner" />
            ) : (
              'Guardar y continuar chat'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
