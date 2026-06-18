import './HitlContexto.styles.css';

interface Props {
  contexto: Record<string, unknown>;
  hitl_tipo?: string;
}

const TIPO_LABEL: Record<string, string> = {
  A: 'Licitación formal',
  B: 'Renovación / extensión',
  C: 'Propuesta directa',
  D: 'Consultoría a medida',
};

const ETAPA_LABEL: Record<string, string> = {
  RECIBIDA:           'Recibida',
  CLASIFICADA:        'Clasificada',
  EN_PROPUESTA:       'En propuesta',
  PROPUESTA_ENVIADA:  'Propuesta enviada',
  EN_NEGOCIACION:     'En negociación',
  CERRADA:            'Cerrada',
  DESCARTADA:         'Descartada',
};

function formatFecha(iso: string): string {
  const [, m, d] = iso.split('-');
  const meses = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(d)} ${meses[parseInt(m)]}`;
}

// ── confirmacion — A1 clasificación ──────────────────────────────────────────
function CtxClasificacion({ ctx }: { ctx: Record<string, unknown> }) {
  const tipo      = ctx.tipo as string | undefined;
  const cliente   = ctx.cliente as string | undefined;
  const confianza = ctx.confianza as number | undefined;
  const requisitos = ctx.requisitos_clave as string[] | undefined;
  const plazos    = ctx.plazos as Record<string, string> | undefined;

  const plazosParts: string[] = [];
  if (plazos?.entrega_propuesta) plazosParts.push(`Entrega: ${formatFecha(plazos.entrega_propuesta)}`);
  if (plazos?.inicio_servicio)   plazosParts.push(`Inicio: ${formatFecha(plazos.inicio_servicio)}`);

  return (
    <div className="HitlCtx">
      <div className="HitlCtx-header">
        {tipo && <span className="HitlCtx-tipo">{TIPO_LABEL[tipo] ?? tipo}</span>}
        {confianza != null && <span className="HitlCtx-badge">{Math.round(confianza * 100)}%</span>}
      </div>
      {cliente && <div className="HitlCtx-cliente">{cliente}</div>}
      {requisitos && requisitos.length > 0 && (
        <div className="HitlCtx-meta">
          <span className="HitlCtx-meta-label">Requisitos</span>
          {requisitos.join(' · ')}
        </div>
      )}
      {plazosParts.length > 0 && (
        <div className="HitlCtx-meta">{plazosParts.join('  ·  ')}</div>
      )}
    </div>
  );
}

// ── entidad_duplicada — A1 entity resolution ─────────────────────────────────
function CtxEntidad({ ctx }: { ctx: Record<string, unknown> }) {
  const extraido = ctx.nombre_extraido as string | undefined;
  const canonico = ctx.nombre_canonico as string | undefined;
  const score    = ctx.score_similitud as number | undefined;

  if (!extraido && !canonico) return null;
  return (
    <div className="HitlCtx">
      <div className="HitlCtx-entidad">
        {extraido && <span className="HitlCtx-entidad-original">{extraido}</span>}
        {canonico && (
          <>
            <span className="HitlCtx-entidad-arrow">→</span>
            <span className="HitlCtx-entidad-canonico">{canonico}</span>
          </>
        )}
        {score != null && (
          <span className="HitlCtx-entidad-score">{Math.round(score * 100)}% similitud</span>
        )}
      </div>
    </div>
  );
}

// ── seleccion_multiple — A7 lista de candidatos ───────────────────────────────
interface Candidato {
  id: string;
  cliente: string;
  descripcion: string;
  etapa: string;
  tipo_actual?: string;
}

function CtxSeleccion({ ctx }: { ctx: Record<string, unknown> }) {
  const resultados = ctx.resultados as Candidato[] | undefined;
  if (!resultados?.length) return null;

  return (
    <div className="HitlCtx HitlCtx--lista">
      {resultados.map((r, i) => (
        <div key={r.id} className="HitlCtx-lista-item">
          <span className="HitlCtx-lista-num">{i + 1}</span>
          <div className="HitlCtx-lista-body">
            <div className="HitlCtx-lista-desc">{r.descripcion}</div>
            <div className="HitlCtx-lista-meta">
              {r.cliente}
              {r.tipo_actual && <> · {TIPO_LABEL[r.tipo_actual] ?? r.tipo_actual}</>}
              {r.etapa && <> · {ETAPA_LABEL[r.etapa] ?? r.etapa}</>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── confirmar_creacion — A7 propone crear oportunidad nueva ──────────────────
function CtxConfirmarCreacion({ ctx }: { ctx: Record<string, unknown> }) {
  const cliente = ctx.cliente as string | undefined;
  const desc    = ctx.descripcion_parcial as string | undefined;

  if (!cliente && !desc) return null;
  return (
    <div className="HitlCtx">
      {cliente && (
        <div className="HitlCtx-header">
          <span className="HitlCtx-tipo">{cliente}</span>
        </div>
      )}
      {desc && <div className="HitlCtx-cliente">{desc}</div>}
    </div>
  );
}

// ── datos_incompletos — campo faltante ────────────────────────────────────────
function CtxDatosIncompletos({ ctx }: { ctx: Record<string, unknown> }) {
  const campo = ctx.campo_faltante as string | undefined;
  const desc  = ctx.descripcion_parcial as string | undefined;

  if (!campo && !desc) return null;

  const CAMPO_LABEL: Record<string, string> = {
    cliente:     'Cliente',
    descripcion: 'Descripción',
    tipo:        'Tipo de oportunidad',
  };

  return (
    <div className="HitlCtx">
      {campo && (
        <div className="HitlCtx-meta">
          <span className="HitlCtx-meta-label">Falta</span>
          {CAMPO_LABEL[campo] ?? campo}
        </div>
      )}
      {desc && <div className="HitlCtx-cliente">{desc}</div>}
    </div>
  );
}

// ── Selector ──────────────────────────────────────────────────────────────────
export function HitlContexto({ contexto, hitl_tipo }: Props) {
  if (hitl_tipo === 'entidad_duplicada')  return <CtxEntidad ctx={contexto} />;
  if (hitl_tipo === 'seleccion_multiple') return <CtxSeleccion ctx={contexto} />;
  if (hitl_tipo === 'confirmar_creacion') return <CtxConfirmarCreacion ctx={contexto} />;
  if (hitl_tipo === 'datos_incompletos')  return <CtxDatosIncompletos ctx={contexto} />;
  return <CtxClasificacion ctx={contexto} />;
}
