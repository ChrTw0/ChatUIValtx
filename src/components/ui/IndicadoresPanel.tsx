import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../../api/client';
import './IndicadoresPanel.styles.css';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconReunion() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1 6h12" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4 1v3M10 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconNota() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4.5 5h5M4.5 8h5M4.5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconDocumento() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M2 1h7l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9 1v3h3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4 7h6M4 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 72, h = 20;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastY = h - 2 - ((values[values.length - 1] - min) / range) * (h - 6);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', display: 'block', flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" opacity=".75" />
      <circle cx={w} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

function LoadingRow() {
  return <div className="IP-loading">Cargando…</div>;
}

function ErrorRow({ msg }: { msg: string }) {
  return <div className="IP-error">{msg}</div>;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ResumenData {
  oportunidades_activas: number;
  pipeline_usd: number;
  pipeline_pen: number;
  sla_vencidos: number;
  compromisos_vencidos: number;
  contratos_vencer_30d: number;
}

type Semaforo = 'rojo' | 'amarillo' | 'verde';

interface ContratoItem {
  contrato_id: number; lado: string; nombre: string; descripcion: string;
  dias_restantes: number; semaforo: Semaforo;
  cuota_usd?: number; cuota_pen?: number;
  frecuencia_pago: string | null;
  fecha_fin: string;
  responsable: string;
}

interface ContratosData { items: ContratoItem[] }

interface CompromisoPendiente {
  id: number; oportunidad_id: string; cliente: string;
  tipo: string; descripcion: string; responsable: string;
  fecha_limite: string | null; vencido: boolean;
}

interface CompromisosData { total: number; vencidos: number; items: CompromisoPendiente[] }

interface ActividadItem {
  id: number; tipo: string; titulo: string; actor: string;
  fecha_actividad: string;
  oportunidad_id: string; etapa: string; cliente: string;
}

interface ActividadData { actividades: ActividadItem[] }

type EstadoContrato = 'activo' | 'vencido' | 'futuro';
interface ContratoGantt {
  nombre: string; lado: string; responsable: string;
  monto: string; fin: Date; estado: EstadoContrato;
}

// ─── Constantes recta temporal ────────────────────────────────────────────────

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const TL_DAYS_PAST = 200;
const TL_DAYS_FUT  = 500;
const TL_PPD       = 4;
const TL_TODAY_X   = TL_DAYS_PAST * TL_PPD;
const TL_TOTAL_W   = (TL_DAYS_PAST + TL_DAYS_FUT) * TL_PPD;
const TL_LINE_Y    = 46;
const TL_SVG_H     = 88;

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function fmtDate(d: Date) {
  return `${d.getDate().toString().padStart(2,'0')} ${MESES_ES[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtFechaLimite(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2,'0')} ${MESES_ES[d.getMonth()]}`;
}

function urgenciaColor(dias: number): string {
  if (dias <= 30) return '#dc2626';
  if (dias <= 90) return '#d97706';
  return '#16a34a';
}

function calcJitter(positions: number[]): number[] {
  const THRESHOLD = 28;
  const OFFSET    = 12;
  return positions.map((x, i) => {
    for (let j = 0; j < i; j++) {
      if (Math.abs(x - positions[j]) < THRESHOLD) return OFFSET;
    }
    return 0;
  });
}

function contratoToGantt(c: ContratoItem, hoy: Date): ContratoGantt {
  const fin = new Date(c.fecha_fin);
  const estado: EstadoContrato = fin < hoy ? 'vencido' : c.dias_restantes > 365 ? 'futuro' : 'activo';
  const monto = c.cuota_usd != null
    ? `$${c.cuota_usd.toLocaleString('es-PE')}`
    : c.cuota_pen != null
    ? `S/${c.cuota_pen.toLocaleString('es-PE')}`
    : '—';
  return { nombre: `${c.nombre} — ${c.descripcion}`, lado: c.lado, responsable: c.responsable, monto, fin, estado };
}

function barColorGantt(c: ContratoGantt, hoy: Date): string {
  if (c.estado === 'vencido') return '#94a3b8';
  if (c.estado === 'futuro')  return '#7c3aed';
  return urgenciaColor(daysBetween(hoy, c.fin));
}

function Chip({ lado }: { lado: string }) {
  return (
    <span className={`IP-chip${lado === 'cliente' ? ' IP-chip--cliente' : ' IP-chip--proveedor'}`}>
      {lado}
    </span>
  );
}

// ─── Módulo 1: KPI ────────────────────────────────────────────────────────────

function ModuloResumen() {
  const [data, setData] = useState<ResumenData | null>(null);
  const [err, setErr]   = useState('');

  useEffect(() => {
    apiFetch('/indicadores/resumen')
      .then(r => r.json())
      .then(setData)
      .catch(() => setErr('No se pudo cargar el resumen'));
  }, []);

  if (err)   return <ErrorRow msg={err} />;
  if (!data) return <LoadingRow />;

  const kpis = [
    {
      label: 'Oportunidades activas',
      value: String(data.oportunidades_activas),
      delta: `Pipeline $${(data.pipeline_usd / 1000).toFixed(0)}K USD`,
      alert: false, warn: false,
      spark: [Math.max(0, data.oportunidades_activas - 4), Math.max(0, data.oportunidades_activas - 2), data.oportunidades_activas],
    },
    {
      label: 'Pipeline USD',
      value: `$${(data.pipeline_usd / 1000).toFixed(0)}K`,
      delta: `S/${(data.pipeline_pen / 1000).toFixed(0)}K PEN`,
      alert: false, warn: false,
      spark: [data.pipeline_usd * 0.8, data.pipeline_usd * 0.9, data.pipeline_usd],
    },
    {
      label: 'SLAs vencidos',
      value: String(data.sla_vencidos),
      delta: data.sla_vencidos > 0 ? 'Requieren atención' : 'Sin vencidos',
      alert: data.sla_vencidos > 0, warn: false,
      spark: [0, Math.max(0, data.sla_vencidos - 1), data.sla_vencidos],
    },
    {
      label: 'Contratos críticos',
      value: String(data.contratos_vencer_30d),
      delta: `${data.compromisos_vencidos} compromisos vencidos`,
      alert: false, warn: data.contratos_vencer_30d > 0,
      spark: [0, Math.max(0, data.contratos_vencer_30d - 1), data.contratos_vencer_30d],
    },
  ];

  return (
    <div className="IP-kpi-grid">
      {kpis.map(k => {
        const sparkColor = k.alert ? '#dc2626' : k.warn ? '#d97706' : '#16a34a';
        const deltaClass  = k.alert ? 'IP-kpi-delta--bad' : k.warn ? 'IP-kpi-delta--warn' : 'IP-kpi-delta--ok';
        return (
          <div key={k.label} className={`IP-kpi-card${k.alert ? ' IP-kpi-card--alert' : k.warn ? ' IP-kpi-card--warn' : ''}`}>
            <div className="IP-kpi-top">
              <span className="IP-kpi-val">{k.value}</span>
              <Sparkline values={k.spark} color={sparkColor} />
            </div>
            <div className="IP-kpi-label">{k.label}</div>
            <div className={`IP-kpi-delta ${deltaClass}`}>{k.delta}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Módulo 2: Contratos — recta temporal ────────────────────────────────────

function getTlTicks(hoy: Date): { x: number; label: string; isHoy: boolean }[] {
  const ticks: { x: number; label: string; isHoy: boolean }[] = [];
  for (let d = -TL_DAYS_PAST; d <= TL_DAYS_FUT; d += 30) {
    const dt = new Date(hoy);
    dt.setDate(hoy.getDate() + d);
    ticks.push({
      x:     TL_TODAY_X + d * TL_PPD,
      label: d === 0 ? 'hoy' : `${MESES_ES[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`,
      isHoy: d === 0,
    });
  }
  return ticks;
}

function ModuloContratos() {
  const [gantt, setGantt]       = useState<ContratoGantt[] | null>(null);
  const [raw, setRaw]           = useState<ContratoItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [err, setErr]           = useState('');
  const scrollRef               = useRef<HTMLDivElement>(null);
  const HOY = new Date(); HOY.setHours(0, 0, 0, 0);

  useEffect(() => {
    apiFetch('/indicadores/contratos-vencer?dias=500')
      .then(r => r.json())
      .then((d: ContratosData) => {
        setRaw(d.items);
        setGantt(d.items.map(c => contratoToGantt(c, HOY)));
      })
      .catch(() => setErr('No se pudo cargar contratos'));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const w = scrollRef.current.clientWidth;
      scrollRef.current.scrollLeft = TL_TODAY_X - w * 0.33;
    }
  }, [gantt]);

  if (err)    return <ErrorRow msg={err} />;
  if (!gantt) return <LoadingRow />;

  const ticks     = getTlTicks(HOY);
  const positions = gantt.map(c => TL_TODAY_X + daysBetween(HOY, c.fin) * TL_PPD);
  const jitter    = calcJitter(positions);
  const sel       = selected !== null ? gantt[selected] : null;
  const selRaw    = selected !== null ? raw[selected] : null;

  return (
    <div className="IP-tl-wrap">
      <div className="IP-tl-scroll" ref={scrollRef}>
        <svg width={TL_TOTAL_W} height={TL_SVG_H}>
          <rect x={TL_TODAY_X - 30 * TL_PPD} y={TL_LINE_Y - 10}
            width={30 * TL_PPD} height={20} fill="#dc262610" rx="2" />
          <rect x={TL_TODAY_X} y={TL_LINE_Y - 10}
            width={90 * TL_PPD} height={20} fill="#d9770608" rx="2" />
          <line x1={0} y1={TL_LINE_Y} x2={TL_TOTAL_W} y2={TL_LINE_Y}
            stroke="var(--color-line-2)" strokeWidth="1" />

          {ticks.map(t => (
            <g key={t.x}>
              <line
                x1={t.x} y1={TL_LINE_Y - (t.isHoy ? 6 : 3)}
                x2={t.x} y2={TL_LINE_Y + (t.isHoy ? 6 : 3)}
                stroke={t.isHoy ? 'var(--brand-1, #ff6200)' : 'var(--color-line-2)'}
                strokeWidth={t.isHoy ? 1.5 : 1}
              />
              <text x={t.x} y={TL_LINE_Y + 18} textAnchor="middle" fontSize="8.5"
                fontWeight={t.isHoy ? '700' : '400'}
                fill={t.isHoy ? 'var(--brand-1, #ff6200)' : 'var(--color-text-3)'}
                fontFamily="system-ui" style={{ userSelect: 'none' }}>
                {t.label}
              </text>
            </g>
          ))}

          {gantt.map((c, i) => {
            const x      = positions[i];
            const cy     = TL_LINE_Y - jitter[i];
            const color  = barColorGantt(c, HOY);
            const arriba = i % 2 === 0;
            const labelY = arriba ? cy - 14 : cy + 24;
            const connY1 = arriba ? cy - 8  : cy + 8;
            const connY2 = arriba ? cy - 1  : cy + 1;
            const isSel  = selected === i;
            const r      = isSel ? 7 : 5;
            return (
              <g key={c.nombre} style={{ cursor: 'pointer' }}
                onClick={() => setSelected(selected === i ? null : i)}>
                {jitter[i] > 0 && (
                  <line x1={x} y1={cy + r} x2={x} y2={TL_LINE_Y}
                    stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity=".3" />
                )}
                <line x1={x} y1={connY1} x2={x} y2={connY2}
                  stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity={isSel ? '.8' : '.4'} />
                <text x={x} y={labelY} textAnchor="middle" fontSize="8.5"
                  fontWeight={isSel ? '700' : '500'}
                  fill={isSel ? color : 'var(--color-text-2)'}
                  fontFamily="system-ui" style={{ userSelect: 'none' }}>
                  {c.nombre.split(' — ')[0].split(' ').slice(0, 2).join(' ')}
                </text>
                <circle cx={x} cy={cy} r={r}
                  fill={isSel ? color : `${color}22`}
                  stroke={color} strokeWidth={isSel ? 0 : 1.5} />
                {isSel && <circle cx={x} cy={cy} r={2.5} fill="rgba(255,255,255,.85)" />}
              </g>
            );
          })}
        </svg>
      </div>

      {sel && selRaw && (
        <div className="IP-detail" key={selected}>
          <div className="IP-detail-top">
            <span className="IP-detail-nombre">{sel.nombre}</span>
            <Chip lado={sel.lado} />
            <button className="IP-detail-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="IP-detail-meta">
            {([
              { k: 'fin',   v: fmtDate(sel.fin),               c: barColorGantt(sel, HOY) },
              { k: 'días',  v: String(selRaw.dias_restantes),   c: undefined },
              { k: 'monto', v: sel.monto,                       c: undefined },
              { k: 'resp.', v: sel.responsable,                 c: undefined },
            ] as { k: string; v: string; c: string | undefined }[]).map((item, idx, arr) => (
              <>
                <span key={item.k} className="IP-detail-item">
                  <span className="IP-detail-key">{item.k}</span>
                  <span className="IP-detail-val" style={{ color: item.c }}>{item.v}</span>
                </span>
                {idx < arr.length - 1 && <span key={`s${idx}`} className="IP-detail-sep">·</span>}
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Módulo 3: Compromisos ────────────────────────────────────────────────────

function ModuloCompromisos() {
  const [data, setData]       = useState<CompromisosData | null>(null);
  const [err, setErr]         = useState('');
  const [completing, setCompleting] = useState<number | null>(null);

  const load = () =>
    apiFetch('/indicadores/compromisos?vencidos_primero=true')
      .then(r => r.json())
      .then(setData)
      .catch(() => setErr('No se pudo cargar compromisos'));

  useEffect(() => { load(); }, []);

  const completar = async (id: number) => {
    setCompleting(id);
    try {
      await apiFetch(`/indicadores/compromisos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'completado' }),
      });
      await load();
    } catch {
      setErr('No se pudo completar el item');
    } finally {
      setCompleting(null);
    }
  };

  if (err)   return <ErrorRow msg={err} />;
  if (!data) return <LoadingRow />;

  const grupos = data.items.reduce((acc, c) => {
    (acc[c.responsable] = acc[c.responsable] || []).push(c);
    return acc;
  }, {} as Record<string, CompromisoPendiente[]>);

  return (
    <div className="IP-comp-wrap">
      <div className="IP-comp-summary">
        <span className="IP-comp-summary-total">{data.total} pendientes</span>
        {data.vencidos > 0 && (
          <span className="IP-comp-summary-vencidos">{data.vencidos} vencidos</span>
        )}
      </div>
      {Object.entries(grupos).map(([resp, items]) => (
        <div key={resp} className="IP-comp-row">
          <div className="IP-comp-avatar">{resp}</div>
          <div className="IP-comp-items">
            {items.map(item => (
              <div key={item.id}
                className={`IP-comp-item${item.vencido ? ' IP-comp-item--vencido' : ''}`}>
                <span className="IP-comp-cliente">{item.cliente}</span>
                <span className="IP-comp-desc">{item.descripcion}</span>
                <span className={`IP-comp-fecha${item.vencido ? ' IP-comp-fecha--vencido' : ''}`}>
                  {fmtFechaLimite(item.fecha_limite)}
                </span>
                <button
                  className="IP-comp-check"
                  title="Marcar como completado"
                  disabled={completing === item.id}
                  onClick={() => completar(item.id)}
                >
                  {completing === item.id ? '…' : '✓'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Módulo 4: Actividad ──────────────────────────────────────────────────────

const tipoConfig: Record<string, { icon: () => JSX.Element; color: string }> = {
  reunion:   { icon: IconReunion,   color: '#0891b2' },
  nota:      { icon: IconNota,      color: '#7c3aed' },
  documento: { icon: IconDocumento, color: '#1d4ed8' },
};

const etapaColor: Record<string, string> = {
  EN_NEGOCIACION: '#7c3aed',
  PROPUESTA:      '#0ea5e9',
  PROSPECTO:      '#64748b',
};

function labelRelativo(min: number): string {
  if (min < 60)   return `${min}min`;
  if (min < 1440) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / 1440)}d`;
}

function ModuloActividad() {
  const [data, setData] = useState<ActividadData | null>(null);
  const [err, setErr]   = useState('');

  useEffect(() => {
    apiFetch('/indicadores/actividad-reciente?limit=20')
      .then(r => r.json())
      .then(setData)
      .catch(() => setErr('No se pudo cargar actividad'));
  }, []);

  if (err)   return <ErrorRow msg={err} />;
  if (!data) return <LoadingRow />;

  const now = Date.now();
  const items = data.actividades.map(a => ({
    ...a,
    minAtras: Math.max(0, Math.round((now - new Date(a.fecha_actividad).getTime()) / 60000)),
  }));

  const MAX_GAP = 40;
  const gaps = items.map((a, i) => {
    if (i === items.length - 1) return 0;
    const diff = items[i + 1].minAtras - a.minAtras;
    return Math.min(MAX_GAP, Math.max(8, Math.round(diff / 30)));
  });

  return (
    <div className="IP-act-timeline">
      {items.map((a, i) => {
        const cfg = tipoConfig[a.tipo] ?? tipoConfig.nota;
        return (
          <div key={a.id} className="IP-act-item">
            <div className="IP-act-left">
              <div className="IP-act-type" style={{ color: cfg.color, background: cfg.color + '1a' }}>
                <cfg.icon />
              </div>
              {i < items.length - 1 && (
                <div className="IP-act-connector" style={{ height: 10 + gaps[i] }} />
              )}
            </div>
            <div className="IP-act-content">
              <div className="IP-act-header">
                <span className="IP-act-titulo">{a.titulo}</span>
                <span className="IP-act-hace">{labelRelativo(a.minAtras)}</span>
              </div>
              <div className="IP-act-meta">
                <span className="IP-act-etapa"
                  style={{
                    background: `${etapaColor[a.etapa] ?? '#64748b'}15`,
                    color: etapaColor[a.etapa] ?? '#64748b',
                    border: `1px solid ${etapaColor[a.etapa] ?? '#64748b'}30`,
                  }}>
                  {a.etapa?.replace('_', ' ') ?? '—'}
                </span>
                <span className="IP-act-cliente">{a.cliente}</span>
                <span className="IP-act-actor">{a.actor}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'resumen',     label: 'Resumen' },
  { id: 'contratos',   label: 'Contratos' },
  { id: 'compromisos', label: 'Pendientes' },
  { id: 'actividad',   label: 'Actividad' },
] as const;
type TabId = typeof TABS[number]['id'];

interface Props {
  onClose: () => void;
}

export function IndicadoresPanel({ onClose }: Props) {
  const [tab, setTab] = useState<TabId>('resumen');

  return (
    <div className="IP-overlay" onClick={onClose}>
      <div className="IP-hud" onClick={e => e.stopPropagation()}>

        <div className="IP-hud-header">
          <div className="IP-hud-titleArea">
            <span className="IP-hud-statusdot" />
            <span className="IP-hud-title">Indicadores comerciales</span>
          </div>
          <button className="IP-hud-close" onClick={onClose}>✕</button>
        </div>

        <div className="IP-hud-tabbar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`IP-tabBtn${tab === t.id ? ' IP-tabBtn--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {tab === t.id && <span className="IP-tabBtn-underline" />}
            </button>
          ))}
        </div>

        <div key={tab} className="IP-hud-body">
          {tab === 'resumen'     && <ModuloResumen />}
          {tab === 'contratos'   && <ModuloContratos />}
          {tab === 'compromisos' && <ModuloCompromisos />}
          {tab === 'actividad'   && <ModuloActividad />}
        </div>

      </div>
    </div>
  );
}
