import { useState, useRef, useEffect } from 'react';
import './DashboardMockup.css';

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

// ─── Datos ficticios ──────────────────────────────────────────────────────────

const kpis = [
  { label: 'Oportunidades activas', value: '12',    delta: '+2 esta semana', up: true,  alert: false, warn: false, spark: [8,9,10,9,11,10,12] },
  { label: 'Pipeline USD',          value: '$185K', delta: '+$12K',          up: true,  alert: false, warn: false, spark: [140,155,148,162,170,178,185] },
  { label: 'SLAs vencidos',         value: '3',     delta: '+1 desde ayer',  up: false, alert: true,  warn: false, spark: [1,1,2,1,2,3,3] },
  { label: 'Contratos críticos',    value: '2',     delta: 'vencen en <30d', up: false, alert: false, warn: true,  spark: [0,1,1,1,2,2,2] },
];

// ─── Tipos alineados con response shapes del backend (dashboard_plan.md) ──────

type Semaforo = 'rojo' | 'amarillo' | 'verde';

interface ContratoItem {
  contrato_id: number; lado: string; nombre: string; descripcion: string;
  dias_restantes: number; semaforo: Semaforo;
  cuota_usd?: number; cuota_pen?: number; moneda?: string;
  frecuencia_pago: string | null;
  fecha_fin: string;   // ISO date
  responsable: string;
}

interface CompromisoPendiente {
  id: number; oportunidad_id: string; cliente: string;
  tipo: string; descripcion: string; responsable: string;
  fecha_limite: string | null; vencido: boolean;
}

interface ActividadItem {
  id: number; tipo: string; titulo: string; actor: string;
  fecha_actividad: string; // ISO datetime
  oportunidad_id: string; etapa: string; cliente: string;
}

// alias para el módulo de recta temporal
type EstadoContrato = 'activo' | 'vencido' | 'futuro';
interface ContratoGantt {
  nombre: string; lado: string; responsable: string;
  monto: string; fin: Date; estado: EstadoContrato;
}

const TODAY_GANTT   = new Date(2026, 6, 6);
const TL_DAYS_PAST  = 200;
const TL_DAYS_FUT   = 500;
const TL_PPD        = 4;                                          // px por día
const TL_TODAY_X    = TL_DAYS_PAST * TL_PPD;                     // 800px
const TL_TOTAL_W    = (TL_DAYS_PAST + TL_DAYS_FUT) * TL_PPD;    // 2800px
const TL_LINE_Y     = 46;
const TL_SVG_H      = 88;

// constantes Gantt (solo para toX/overlapZone — ya no se usan en el render)
const PX_PER_DAY  = TL_PPD;
const LABEL_W     = 108;
const ROW_H       = 30;
const RANGE_START = new Date(TODAY_GANTT); RANGE_START.setDate(TODAY_GANTT.getDate() - 90);
const RANGE_DAYS  = 300;
const TRACK_W     = RANGE_DAYS * PX_PER_DAY;

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function toX(date: Date) {
  return daysBetween(RANGE_START, date) * PX_PER_DAY;
}
function fmtDate(d: Date) {
  return `${d.getDate().toString().padStart(2,'0')} ${MESES_ES[d.getMonth()]} ${d.getFullYear()}`;
}

// Mock alineado con GET /api/v1/dashboard/contratos-vencer
const contratosApi: ContratoItem[] = [
  { contrato_id: 12, lado: 'proveedor', nombre: 'Microsoft',  descripcion: 'Microsoft 365 E3',       dias_restantes: 18,  semaforo: 'rojo',     cuota_usd: 4200,  frecuencia_pago: null,       fecha_fin: '2026-07-24', responsable: 'JCP' },
  { contrato_id: 5,  lado: 'cliente',   nombre: 'PLUSPETROL', descripcion: 'Bolsa Horas Soporte',    dias_restantes: 62,  semaforo: 'amarillo', cuota_pen: 2695,  frecuencia_pago: 'mensual',  fecha_fin: '2026-09-06', responsable: 'JV'  },
  { contrato_id: 8,  lado: 'proveedor', nombre: 'AWS',        descripcion: 'AWS Cloud',              dias_restantes: 88,  semaforo: 'amarillo', cuota_usd: 1800,  frecuencia_pago: null,       fecha_fin: '2026-10-02', responsable: 'JCP' },
  { contrato_id: 3,  lado: 'cliente',   nombre: 'SEDAPAL',    descripcion: 'Mantenimiento Sistemas', dias_restantes: 120, semaforo: 'verde',    cuota_pen: 4500,  frecuencia_pago: 'mensual',  fecha_fin: '2026-11-03', responsable: 'MR'  },
];

// Contratos para recta temporal (incluye vencidos y futuros)
const contratos: ContratoGantt[] = [
  { nombre: 'Microsoft 365 E3',    lado: 'proveedor', responsable: 'JCP', monto: '$4,200',  fin: new Date(2026,6,24),  estado: 'activo'  },
  { nombre: 'PLUSPETROL — Soporte',lado: 'cliente',   responsable: 'JV',  monto: 'S/2,695', fin: new Date(2026,8,6),   estado: 'activo'  },
  { nombre: 'AWS Cloud',           lado: 'proveedor', responsable: 'JCP', monto: '$1,800',  fin: new Date(2026,9,2),   estado: 'activo'  },
  { nombre: 'SEDAPAL — Mantenim.', lado: 'cliente',   responsable: 'MR',  monto: 'S/4,500', fin: new Date(2026,10,3),  estado: 'activo'  },
  { nombre: 'INTERBANK — Consult.',lado: 'cliente',   responsable: 'MR',  monto: '$3,200',  fin: new Date(2026,2,1),   estado: 'vencido' },
  { nombre: 'PETROPERÚ — Licenc.', lado: 'proveedor', responsable: 'JCP', monto: '$2,100',  fin: new Date(2026,4,15),  estado: 'vencido' },
  { nombre: 'SEDAPAL — Renovación',lado: 'cliente',   responsable: 'JV',  monto: 'S/5,000', fin: new Date(2027,10,1),  estado: 'futuro'  },
];

// Mock alineado con GET /api/v1/dashboard/compromisos
const compromisos: CompromisoPendiente[] = [
  { id: 45, oportunidad_id: 'OPP-967A516E', cliente: 'PLUSPETROL', tipo: 'pendiente',   descripcion: 'Validar acceso RDP servidor PI Malvinas', responsable: 'JV',  fecha_limite: '2026-07-04', vencido: false },
  { id: 46, oportunidad_id: 'OPP-A12B3C4D', cliente: 'SEDAPAL',    tipo: 'compromiso',  descripcion: 'Coordinar demo técnica infraestructura',  responsable: 'JV',  fecha_limite: '2026-07-10', vencido: false },
  { id: 47, oportunidad_id: 'OPP-E56F7G8H', cliente: 'SEDAPAL',    tipo: 'pendiente',   descripcion: 'Preparar ambiente de pruebas pre-demo',   responsable: 'JCP', fecha_limite: '2026-07-15', vencido: false },
  { id: 48, oportunidad_id: 'OPP-I90J1K2L', cliente: 'INTERBANK',  tipo: 'compromiso',  descripcion: 'Revisar propuesta legal con área legal',  responsable: 'MR',  fecha_limite: '2026-07-12', vencido: false },
  { id: 41, oportunidad_id: 'OPP-I90J1K2L', cliente: 'INTERBANK',  tipo: 'pendiente',   descripcion: 'Enviar propuesta actualizada al cliente', responsable: 'MR',  fecha_limite: '2026-06-30', vencido: true  },
  { id: 42, oportunidad_id: 'OPP-M34N5O6P', cliente: 'PETROPERÚ',  tipo: 'compromiso',  descripcion: 'Confirmar fechas de kick-off del proyecto',responsable: 'JV',  fecha_limite: '2026-06-28', vencido: true  },
];

// Mock alineado con GET /api/v1/dashboard/actividad-reciente
const actividad: ActividadItem[] = [
  { id: 2265, tipo: 'reunion',   titulo: 'Reunión con Andrés Zolla',       actor: 'JV',  fecha_actividad: '2026-07-06T14:00:00Z', oportunidad_id: 'OPP-967A516E', etapa: 'EN_NEGOCIACION', cliente: 'PLUSPETROL' },
  { id: 2264, tipo: 'documento', titulo: 'PTE enviada v2',                  actor: 'JV',  fecha_actividad: '2026-07-06T11:00:00Z', oportunidad_id: 'OPP-A12B3C4D', etapa: 'PROPUESTA',      cliente: 'SEDAPAL'    },
  { id: 2260, tipo: 'nota',      titulo: 'Llamada de seguimiento pipeline', actor: 'MR',  fecha_actividad: '2026-07-05T16:30:00Z', oportunidad_id: 'OPP-I90J1K2L', etapa: 'PROSPECTO',      cliente: 'INTERBANK'  },
  { id: 2258, tipo: 'reunion',   titulo: 'Demo técnica completada',         actor: 'JCP', fecha_actividad: '2026-07-05T10:00:00Z', oportunidad_id: 'OPP-M34N5O6P', etapa: 'PROPUESTA',      cliente: 'PETROPERÚ'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function urgenciaColor(dias: number): string {
  if (dias <= 30) return '#dc2626';
  if (dias <= 90) return '#d97706';
  return '#16a34a';
}

function barColor(c: ContratoGantt): string {
  if (c.estado === 'vencido') return '#94a3b8';
  if (c.estado === 'futuro')  return '#7c3aed';
  return urgenciaColor(daysBetween(TODAY_GANTT, c.fin));
}

// jitter: desplaza cy del punto si otro punto está muy cerca en x
function calcJitter(positions: number[]): number[] {
  const THRESHOLD = 28; // px mínimos entre puntos para no jitterear
  const OFFSET    = 12; // px de desplazamiento vertical
  return positions.map((x, i) => {
    for (let j = 0; j < i; j++) {
      if (Math.abs(x - positions[j]) < THRESHOLD) return OFFSET;
    }
    return 0;
  });
}

function Chip({ lado }: { lado: string }) {
  const isCliente = lado === 'cliente';
  return (
    <span className={`DM-chip${isCliente ? ' DM-chip--cliente' : ' DM-chip--proveedor'}`}>
      {lado}
    </span>
  );
}

// ─── Módulo 1: KPI ────────────────────────────────────────────────────────────

function ModuloResumen() {
  return (
    <div className="DM-kpi-grid">
      {kpis.map(k => {
        const sparkColor = k.alert ? '#dc2626' : k.warn ? '#d97706' : '#16a34a';
        const deltaClass  = k.alert ? 'DM-kpi-delta--bad' : k.warn ? 'DM-kpi-delta--warn' : 'DM-kpi-delta--ok';
        return (
          <div key={k.label} className={`DM-kpi-card${k.alert ? ' DM-kpi-card--alert' : k.warn ? ' DM-kpi-card--warn' : ''}`}>
            <div className="DM-kpi-top">
              <span className="DM-kpi-val">{k.value}</span>
              <Sparkline values={k.spark} color={sparkColor} />
            </div>
            <div className="DM-kpi-label">{k.label}</div>
            <div className={`DM-kpi-delta ${deltaClass}`}>{k.delta}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Módulo 2: Contratos — recta temporal scrolleable ────────────────────────

// ticks cada ~30 días
function getTlTicks(): { x: number; label: string; isHoy: boolean }[] {
  const ticks: { x: number; label: string; isHoy: boolean }[] = [];
  for (let d = -TL_DAYS_PAST; d <= TL_DAYS_FUT; d += 30) {
    const dt = new Date(TODAY_GANTT);
    dt.setDate(TODAY_GANTT.getDate() + d);
    ticks.push({
      x:     TL_TODAY_X + d * TL_PPD,
      label: d === 0 ? 'hoy' : `${MESES_ES[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`,
      isHoy: d === 0,
    });
  }
  return ticks;
}

function ModuloContratos() {
  const [selected, setSelected] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ticks     = getTlTicks();

  const positions = contratos.map(c =>
    TL_TODAY_X + daysBetween(TODAY_GANTT, c.fin) * TL_PPD
  );
  const jitter = calcJitter(positions);

  useEffect(() => {
    if (scrollRef.current) {
      const w = scrollRef.current.clientWidth;
      scrollRef.current.scrollLeft = TL_TODAY_X - w * 0.33;
    }
  }, []);

  const sel = selected !== null ? contratos[selected] : null;

  return (
    <div className="DM-tl2-wrap">
      <div className="DM-tl2-scroll" ref={scrollRef}>
        <svg width={TL_TOTAL_W} height={TL_SVG_H}>

          {/* zonas de urgencia */}
          <rect x={TL_TODAY_X - 30 * TL_PPD} y={TL_LINE_Y - 10}
            width={30 * TL_PPD} height={20} fill="#dc262610" rx="2" />
          <rect x={TL_TODAY_X} y={TL_LINE_Y - 10}
            width={90 * TL_PPD} height={20} fill="#d9770608" rx="2" />

          {/* línea */}
          <line x1={0} y1={TL_LINE_Y} x2={TL_TOTAL_W} y2={TL_LINE_Y}
            stroke="var(--color-line-2)" strokeWidth="1" />

          {/* ticks */}
          {ticks.map(t => (
            <g key={t.x}>
              <line
                x1={t.x} y1={TL_LINE_Y - (t.isHoy ? 6 : 3)}
                x2={t.x} y2={TL_LINE_Y + (t.isHoy ? 6 : 3)}
                stroke={t.isHoy ? 'var(--brand-1, #ff6200)' : 'var(--color-line-2)'}
                strokeWidth={t.isHoy ? 1.5 : 1}
              />
              <text x={t.x} y={TL_LINE_Y + 18}
                textAnchor="middle" fontSize="8.5"
                fontWeight={t.isHoy ? '700' : '400'}
                fill={t.isHoy ? 'var(--brand-1, #ff6200)' : 'var(--color-text-3)'}
                fontFamily="system-ui" style={{ userSelect: 'none' }}
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* puntos */}
          {contratos.map((c, i) => {
            const x      = positions[i];
            const cy     = TL_LINE_Y - jitter[i];   // jitter desplaza hacia arriba si hay solapamiento
            const color  = barColor(c);
            const arriba = i % 2 === 0;
            const labelY = arriba ? cy - 14 : cy + 24;
            const connY1 = arriba ? cy - 8  : cy + 8;
            const connY2 = arriba ? cy - 1  : cy + 1;
            const isSel  = selected === i;
            const r      = isSel ? 7 : 5;

            return (
              <g key={c.nombre} style={{ cursor: 'pointer' }}
                onClick={() => setSelected(selected === i ? null : i)}>
                {/* conector al eje si hay jitter */}
                {jitter[i] > 0 && (
                  <line x1={x} y1={cy + r} x2={x} y2={TL_LINE_Y}
                    stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity=".3" />
                )}
                {/* conector etiqueta-punto */}
                <line x1={x} y1={connY1} x2={x} y2={connY2}
                  stroke={color} strokeWidth="1"
                  strokeDasharray="2 2" opacity={isSel ? '.8' : '.4'} />
                {/* etiqueta */}
                <text x={x} y={labelY}
                  textAnchor="middle" fontSize="8.5"
                  fontWeight={isSel ? '700' : '500'}
                  fill={isSel ? color : 'var(--color-text-2)'}
                  fontFamily="system-ui" style={{ userSelect: 'none' }}
                >
                  {c.nombre.split(' — ')[0].split(' ').slice(0, 2).join(' ')}
                </text>
                {/* punto */}
                <circle cx={x} cy={cy} r={r}
                  fill={isSel ? color : `${color}22`}
                  stroke={color} strokeWidth={isSel ? 0 : 1.5}
                />
                {isSel && <circle cx={x} cy={cy} r={2.5} fill="rgba(255,255,255,.85)" />}
              </g>
            );
          })}
        </svg>
      </div>

      {sel && (
        <div className="DM-gantt-detail" key={selected}>
          <div className="DM-gantt-detail-top">
            <span className="DM-gantt-detail-nombre">{sel.nombre}</span>
            <Chip lado={sel.lado} />
            <button className="DM-gantt-detail-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="DM-gantt-detail-meta">
            {([
              { k: 'inicio', v: fmtDate(sel.inicio), c: undefined },
              { k: 'fin',    v: fmtDate(sel.fin),    c: sel.estado === 'activo' ? barColor(sel) : undefined },
              { k: 'monto',  v: sel.monto,           c: undefined },
              { k: 'resp.',  v: sel.responsable,     c: undefined },
            ] as { k: string; v: string; c: string | undefined }[]).map((item, idx, arr) => (
              <>
                <span key={item.k} className="DM-gantt-detail-item">
                  <span className="DM-gantt-detail-key">{item.k}</span>
                  <span className="DM-gantt-detail-val" style={{ color: item.c }}>{item.v}</span>
                </span>
                {idx < arr.length - 1 && <span key={`s${idx}`} className="DM-gantt-detail-sep">·</span>}
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Módulo 3: Compromisos — agrupado por responsable ────────────────────────

function fmtFechaLimite(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2,'0')} ${MESES_ES[d.getMonth()]}`;
}

function ModuloCompromisos() {
  // groupBy responsable — puro display, el campo viene del backend
  const grupos = compromisos.reduce((acc, c) => {
    (acc[c.responsable] = acc[c.responsable] || []).push(c);
    return acc;
  }, {} as Record<string, CompromisoPendiente[]>);

  const totalVencidos = compromisos.filter(c => c.vencido).length;

  return (
    <div className="DM-comp-wrap">
      {/* header global */}
      <div className="DM-comp-summary">
        <span className="DM-comp-summary-total">{compromisos.length} pendientes</span>
        {totalVencidos > 0 && (
          <span className="DM-comp-summary-vencidos">{totalVencidos} vencidos</span>
        )}
      </div>

      {/* fila por responsable */}
      {Object.entries(grupos).map(([resp, items]) => (
        <div key={resp} className="DM-comp-row">
          <div className="DM-comp-avatar">{resp}</div>
          <div className="DM-comp-items">
            {items.map(item => (
              <div key={item.id}
                className={`DM-comp-item${item.vencido ? ' DM-comp-item--vencido' : ''}`}>
                <span className="DM-comp-cliente">{item.cliente}</span>
                <span className="DM-comp-desc">{item.descripcion}</span>
                <span className={`DM-comp-fecha${item.vencido ? ' DM-comp-fecha--vencido' : ''}`}>
                  {fmtFechaLimite(item.fecha_limite)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Módulo 4: Actividad — timeline proporcional al tiempo ───────────────────

const NOW_REF = new Date('2026-07-06T16:00:00Z'); // fijo para el mockup

function minutosDesdeFecha(iso: string): number {
  return Math.max(0, Math.round((NOW_REF.getTime() - new Date(iso).getTime()) / 60000));
}

function labelRelativo(min: number): string {
  if (min < 60)   return `${min}min`;
  if (min < 1440) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / 1440)}d`;
}

function ModuloActividad() {
  const items = actividad.map(a => ({
    ...a,
    minAtras: minutosDesdeFecha(a.fecha_actividad),
  }));

  // gap proporcional entre items consecutivos (px), acotado para no exceder el espacio
  const MAX_GAP = 40;
  const gaps = items.map((a, i) => {
    if (i === items.length - 1) return 0;
    const diff = items[i + 1].minAtras - a.minAtras;
    return Math.min(MAX_GAP, Math.max(8, Math.round(diff / 30)));
  });

  return (
    <div className="DM-act-timeline">
      {items.map((a, i) => {
        const cfg = tipoConfig[a.tipo] ?? tipoConfig.nota;
        return (
          <div key={a.id} className="DM-act-item">
            <div className="DM-act-left">
              <div className="DM-act-type" style={{ color: cfg.color, background: cfg.color + '1a' }}>
                <cfg.icon />
              </div>
              {i < items.length - 1 && (
                <div className="DM-act-connector" style={{ height: 10 + gaps[i] }} />
              )}
            </div>
            <div className="DM-act-content">
              <div className="DM-act-header">
                <span className="DM-act-titulo">{a.titulo}</span>
                <span className="DM-act-hace">{labelRelativo(a.minAtras)}</span>
              </div>
              <div className="DM-act-meta">
                <span className="DM-act-etapa"
                  style={{ background: `${etapaColor[a.etapa]}15`, color: etapaColor[a.etapa], border: `1px solid ${etapaColor[a.etapa]}30` }}>
                  {a.etapa.replace('_', ' ')}
                </span>
                <span className="DM-act-cliente">{a.cliente}</span>
                <span className="DM-act-actor">{a.actor}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const tabs = [
  { id: 'resumen',     label: 'Resumen' },
  { id: 'contratos',   label: 'Contratos' },
  { id: 'compromisos', label: 'Pendientes' },
  { id: 'actividad',   label: 'Actividad' },
] as const;
type TabId = typeof tabs[number]['id'];

// ─── Chat feed ────────────────────────────────────────────────────────────────

function ChatFeed() {
  return (
    <>
      <div className="DM-msgRow DM-msgRow--user">
        <div className="DM-bubble DM-bubble--user">muéstrame el dashboard</div>
      </div>
      <div className="DM-msgRow">
        <div className="DM-avatar">V</div>
        <div className="DM-bubble">Tenés <strong>3 SLAs vencidos</strong> y <strong>2 contratos críticos</strong>. Pipeline activo $185K.</div>
      </div>
      <div className="DM-msgRow DM-msgRow--user">
        <div className="DM-bubble DM-bubble--user">¿el contrato más urgente?</div>
      </div>
      <div className="DM-msgRow">
        <div className="DM-avatar">V</div>
        <div className="DM-bubble">Microsoft 365 E3 — vence en <strong>18 días</strong>. Responsable: JCP.</div>
      </div>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function DashboardMockup() {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<TabId>('resumen');

  return (
    <div className="DM-root">
      <div className="DM-shell">

        <div className="DM-navbar">
          <span className="DM-navbar-title">Valtx — Asistente Comercial</span>
          <button className="DM-hudTrigger" onClick={() => setOpen(true)}>
            Dashboard
            <kbd className="DM-kbd">⌘D</kbd>
          </button>
        </div>

        <div className="DM-feed"><ChatFeed /></div>

        <div className="DM-composer">
          <div className="DM-composer-input">Escribe un mensaje…</div>
          <button className="DM-composer-send">↑</button>
        </div>

        {open && (
          <div className="DM-overlay" onClick={() => setOpen(false)}>
            <div className="DM-hud" onClick={e => e.stopPropagation()}>

              <div className="DM-hud-header">
                <div className="DM-hud-titleArea">
                  <span className="DM-hud-statusdot" />
                  <span className="DM-hud-title">Dashboard comercial</span>
                </div>
                <button className="DM-hud-close" onClick={() => setOpen(false)}>✕</button>
              </div>

              <div className="DM-hud-tabbar">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    className={`DM-tabBtn${tab === t.id ? ' DM-tabBtn--active' : ''}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                    {tab === t.id && <span className="DM-tabBtn-underline" />}
                  </button>
                ))}
              </div>

              <div key={tab} className="DM-hud-body">
                {tab === 'resumen'     && <ModuloResumen />}
                {tab === 'contratos'   && <ModuloContratos />}
                {tab === 'compromisos' && <ModuloCompromisos />}
                {tab === 'actividad'   && <ModuloActividad />}
              </div>

            </div>
          </div>
        )}

      </div>

      <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>
        Haz click en "Dashboard" (navbar) para abrir el HUD
      </p>
    </div>
  );
}
