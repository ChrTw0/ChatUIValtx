import { useState, useRef, useLayoutEffect } from 'react';
import './DraftPanel.styles.css';
import { IconClose, IconSpinner } from './icons';
import type { DraftData } from '../../types/api';

const SECCIONES: { key: string; label: string; hint: string }[] = [
  { key: 'alcance_tecnico',         label: 'Alcance Técnico',         hint: 'ej: soporte TI nivel 2, mantenimiento preventivo de servidores' },
  { key: 'entregables',             label: 'Entregables',             hint: 'ej: informes mensuales de incidencias, documentación técnica actualizada' },
  { key: 'equipo_propuesto',        label: 'Equipo Propuesto',        hint: 'ej: 2 ingenieros senior, 1 project manager, 1 técnico de guardia' },
  { key: 'plazo_ejecucion',         label: 'Plazo de Ejecución',      hint: 'ej: 12 meses renovables, inicio estimado agosto 2026' },
  { key: 'precio_total',            label: 'Precio Total',            hint: 'ej: 48000 (USD sin IGV)' },
  { key: 'desglose_costos',         label: 'Desglose de Costos',      hint: 'ej: mano de obra 60%, licencias 20%, soporte 20%' },
  { key: 'condiciones_comerciales', label: 'Condiciones Comerciales', hint: 'ej: pago a 30 días, facturación mensual, penalidad 0.5% por día' },
  { key: 'garantias_sla',           label: 'Garantías y SLA',         hint: 'ej: 99.5% uptime, tiempo de respuesta < 4h, resolución < 24h' },
];

interface Props {
  draft: DraftData;
  loading: boolean;
  onCerrar: () => void;
  onCancelar: () => void;
  onGuardarEjecutar: (contenido: Record<string, unknown>) => void;
  onChange: (campo: string, valor: unknown) => void;
}

function AutoTextarea({ value, placeholder, onChange, disabled, className }: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = ref.current.scrollHeight + 'px';
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      placeholder={placeholder}
      rows={1}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
    />
  );
}

export function DraftPanel({ draft, loading, onCerrar, onCancelar, onGuardarEjecutar, onChange }: Props) {
  const [contenidoLocal, setContenidoLocal] = useState<Record<string, unknown>>(
    { ...draft.contenido }
  );
  const [confirmados, setConfirmados]           = useState<Set<string>>(new Set());
  const [animando, setAnimando]                 = useState<Set<string>>(new Set());
  const [snapshots, setSnapshots]               = useState<Record<string, string>>({});
  const [mostrarCompletos, setMostrarCompletos] = useState(false);

  function handleChange(campo: string, valor: string) {
    setContenidoLocal(prev => ({ ...prev, [campo]: valor }));
  }

  function handleListo(campo: string) {
    const valor = String(contenidoLocal[campo] ?? '').trim();
    if (!valor || animando.has(campo)) return;
    setAnimando(prev => new Set(prev).add(campo));
    setTimeout(() => {
      setAnimando(prev => { const s = new Set(prev); s.delete(campo); return s; });
      setConfirmados(prev => new Set(prev).add(campo));
      setSnapshots(prev => ({ ...prev, [campo]: String(contenidoLocal[campo] ?? '').trim() }));
      setMostrarCompletos(true);
    }, 650);
  }

  const originalmentePendientes = new Set(draft.campos_incompletos);

  function esPendiente(key: string) {
    return originalmentePendientes.has(key) && !confirmados.has(key);
  }

  function recienCompletado(key: string) {
    return originalmentePendientes.has(key) && confirmados.has(key);
  }

  const seccionesPendientes = SECCIONES.filter(s => esPendiente(s.key));
  const seccionesCompletas  = SECCIONES.filter(s => !esPendiente(s.key));
  const hayNuevosValores = confirmados.size > 0 || seccionesCompletas.some(({ key }) => {
    const base   = confirmados.has(key) ? (snapshots[key] ?? '') : String(draft.contenido[key] ?? '').trim();
    const actual = String(contenidoLocal[key] ?? '').trim();
    return actual !== base;
  });

  const totalCampos    = SECCIONES.length;
  const camposCompletos = SECCIONES.filter(s => !!String(contenidoLocal[s.key] ?? '').trim()).length;
  const pctDinamico    = Math.round((camposCompletos / totalCampos) * 100);

  return (
    <div className="DraftPanel">

      {/* Header */}
      <div className="DraftPanel-header">
        <div className="DraftPanel-headerLeft">
          <span className="DraftPanel-title">{draft.contenido?.servicio ? String(draft.contenido.servicio) : `PTE — ${draft.cliente}`}</span>
          <span className="DraftPanel-meta">v{draft.version}</span>
        </div>
        <button className="DraftPanel-close" onClick={onCerrar} aria-label="Cerrar panel">
          <IconClose className="DraftPanel-closeIcon" />
        </button>
      </div>

      {/* Barra de progreso dinámica */}
      <div className="DraftPanel-progress">
        <div className="DraftPanel-progressBar">
          <div className="DraftPanel-progressFill" style={{ width: `${pctDinamico}%` }} />
        </div>
        <span className="DraftPanel-progressPct">{pctDinamico}%</span>
      </div>

      {/* Chips de pendientes */}
      {seccionesPendientes.length > 0 && (
        <div className="DraftPanel-incompletos">
          <span className="DraftPanel-incompletosLabel">
            {seccionesPendientes.length} campo{seccionesPendientes.length > 1 ? 's' : ''} pendiente{seccionesPendientes.length > 1 ? 's' : ''}
          </span>
          <div className="DraftPanel-chips">
            {seccionesPendientes.map(s => (
              <span key={s.key} className="DraftPanel-chip">{s.label}</span>
            ))}
          </div>
        </div>
      )}

      <div className="DraftPanel-body">

        {/* ── Sección: Pendientes ── */}
        {seccionesPendientes.length > 0 && (
          <div className="DraftPanel-seccionTitulo DraftPanel-seccionTitulo--pte">
            Campos pendientes
          </div>
        )}

        {seccionesPendientes.map(({ key, label, hint }) => {
          const enAnimacion = animando.has(key);
          const tieneValor  = !!String(contenidoLocal[key] ?? '').trim();
          return (
            <div
              className={`DraftPanel-field DraftPanel-field--pte${enAnimacion ? ' DraftPanel-field--check' : ''}`}
              key={key}
            >
              <div className="DraftPanel-labelRow">
                <label className="DraftPanel-label">{label}</label>
                {enAnimacion
                  ? <span className="DraftPanel-badge DraftPanel-badge--nuevo DraftPanel-badge--anim">✓ listo</span>
                  : tieneValor
                    ? <button className="DraftPanel-btnListoInline" onClick={() => handleListo(key)}>¿Correcto?</button>
                    : <span className="DraftPanel-badge DraftPanel-badge--pte">pendiente</span>
                }
              </div>
              <AutoTextarea
                className="DraftPanel-textarea"
                value={String(contenidoLocal[key] ?? '')}
                placeholder={hint}
                onChange={v => handleChange(key, v)}
                disabled={loading || enAnimacion}
              />
            </div>
          );
        })}

        {/* ── Sección: Completados ── */}
        {seccionesCompletas.length > 0 && (
          <button
            className="DraftPanel-seccionTitulo DraftPanel-seccionTitulo--ok"
            onClick={() => setMostrarCompletos(v => !v)}
          >
            <span>{mostrarCompletos ? '▾' : '▸'}</span>
            Campos completados · editable ({seccionesCompletas.length})
          </button>
        )}

        {mostrarCompletos && seccionesCompletas.map(({ key, label, hint }) => {
          const base    = recienCompletado(key) ? (snapshots[key] ?? '') : String(draft.contenido[key] ?? '').trim();
          const actual  = String(contenidoLocal[key] ?? '').trim();
          const editado = actual !== base;
          return (
          <div
            className={`DraftPanel-field DraftPanel-field--ok${recienCompletado(key) ? ' DraftPanel-field--nuevo' : ''}`}
            key={key}
          >
            <div className="DraftPanel-labelRow">
              <label className="DraftPanel-label">{label}</label>
              {editado
                ? <span className="DraftPanel-badge DraftPanel-badge--editado">● editado</span>
                : recienCompletado(key)
                  ? <span className="DraftPanel-badge DraftPanel-badge--nuevo">✓ nuevo</span>
                  : <span className="DraftPanel-badge DraftPanel-badge--ok">✓</span>
              }
            </div>
            <AutoTextarea
              className="DraftPanel-textarea"
              value={String(contenidoLocal[key] ?? '')}
              placeholder={hint}
              onChange={v => handleChange(key, v)}
              disabled={loading}
            />
          </div>
          );
        })}

      </div>

      {/* Footer */}
      <div className="DraftPanel-footer">
        <button className="DraftPanel-btnCancelar" onClick={onCancelar} disabled={loading}>
          Cancelar
        </button>
        <button
          className="DraftPanel-btnGuardar"
          onClick={() => onGuardarEjecutar(contenidoLocal)}
          disabled={loading || !hayNuevosValores}
        >
          {loading
            ? <><IconSpinner className="DraftPanel-spinner" /> Procesando...</>
            : 'Guardar y ejecutar IA'
          }
        </button>
      </div>

    </div>
  );
}
