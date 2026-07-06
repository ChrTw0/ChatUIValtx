import { useState } from 'react';
import { HitlContexto } from './HitlContexto';
import './HitlCard.styles.css';

interface Props {
  opciones: string[];
  hitl_tipo: string;
  contexto?: Record<string, unknown>;
  onSelect: (valor: string) => void;
}

function resolverModo(hitl_tipo: string, opciones: string[]): 'botones' | 'botones_input' | 'botones_o_input' | 'input' | 'multi_select' {
  if (!opciones.length || hitl_tipo === 'datos_incompletos') return 'input';
  if (hitl_tipo === 'dependencias') return 'multi_select';
  if (hitl_tipo === 'validacion_campo') return 'botones_input';
  if (hitl_tipo === 'seleccion_multiple') return 'botones_o_input';
  return 'botones';
}

export function HitlCard({ opciones, hitl_tipo, contexto, onSelect }: Props) {
  const modo = resolverModo(hitl_tipo, opciones);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [inputValor, setInputValor] = useState('');
  const [enviado, setEnviado] = useState(false);

  // --- Multi-select (dependencias) ---
  function handleCheckbox(i: number) {
    if (enviado) return;
    const opcion = opciones[i];
    if (opcion === 'Ninguna') {
      // Ninguna limpia el resto y se selecciona sola
      setSeleccionados(new Set([i]));
      return;
    }
    setSeleccionados(prev => {
      const next = new Set(prev);
      // Deseleccionar "Ninguna" si había
      const iNinguna = opciones.indexOf('Ninguna');
      if (iNinguna >= 0) next.delete(iNinguna);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function handleConfirmarMulti() {
    if (enviado) return;
    const nombres = Array.from(seleccionados).map(i => opciones[i]);
    let payload: string;
    if (nombres.includes('Ninguna')) {
      payload = 'Ninguna';
    } else if (nombres.length === 1) {
      payload = nombres[0];
    } else {
      payload = nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
    }
    setEnviado(true);
    onSelect(payload);
  }

  // --- Single-select ---
  function handleCapsule(i: number) {
    if (enviado) return;
    const opcion = opciones[i];
    if (modo === 'botones_input' && opcion.toLowerCase() === 'corregir') {
      setSeleccionado(i);
      return;
    }
    setSeleccionado(i);
    setEnviado(true);
    onSelect(opcion);
  }

  function handleEnviarInput() {
    if (enviado || !inputValor.trim()) return;
    setEnviado(true);
    const payload = (modo === 'botones_input' && seleccionado !== null)
      ? JSON.stringify({ decision: opciones[seleccionado], valor: inputValor.trim() })
      : inputValor.trim();
    onSelect(payload);
  }

  const esperandoInput = modo === 'botones_input' && seleccionado !== null && opciones[seleccionado]?.toLowerCase() === 'corregir' && !enviado;
  const mostrarInput   = modo === 'input' || modo === 'botones_o_input' || esperandoInput;

  // --- Render multi-select ---
  if (modo === 'multi_select') {
    return (
      <div className="HitlCard">
        {contexto && <HitlContexto contexto={contexto} hitl_tipo={hitl_tipo} />}
        <div className="HitlCard-capsules">
          {opciones.map((opcion, i) => (
            <button
              key={i}
              style={{ animationDelay: `${0.12 + i * 0.07}s` }}
              className={[
                'HitlCard-capsule',
                seleccionados.has(i) ? 'HitlCard-capsule--selected' : '',
                enviado && !seleccionados.has(i) ? 'HitlCard-capsule--dismissed' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleCheckbox(i)}
              disabled={enviado}
            >
              {opcion}
            </button>
          ))}
        </div>
        <div className="HitlCard-input-area">
          <button
            className="HitlCard-input-send"
            onClick={handleConfirmarMulti}
            disabled={enviado || seleccionados.size === 0}
            style={{ flex: 1 }}
          >
            {seleccionados.size === 0 ? 'Selecciona al menos una opción' : 'Confirmar selección'}
          </button>
        </div>
      </div>
    );
  }

  // --- Render single-select / input ---
  return (
    <div className="HitlCard">
      {contexto && <HitlContexto contexto={contexto} hitl_tipo={hitl_tipo} />}
      {opciones.length > 0 && (
        <div className="HitlCard-capsules">
          {opciones.map((opcion, i) => (
            <button
              key={i}
              style={{ animationDelay: `${0.12 + i * 0.07}s` }}
              className={[
                'HitlCard-capsule',
                seleccionado === i ? 'HitlCard-capsule--selected' : '',
                enviado && seleccionado !== i ? 'HitlCard-capsule--dismissed' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleCapsule(i)}
              disabled={enviado || (seleccionado !== null && seleccionado !== i && modo !== 'botones_input')}
            >
              {opcion}
            </button>
          ))}
        </div>
      )}

      {mostrarInput && (
        <div className="HitlCard-input-area">
          <input
            className="HitlCard-input"
            type="text"
            placeholder={
              esperandoInput             ? 'Ingresa el valor corregido...'
              : modo === 'botones_o_input' ? 'O escribe una búsqueda diferente...'
              : 'Escribe tu respuesta...'
            }
            value={inputValor}
            onChange={e => setInputValor(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEnviarInput()}
            disabled={enviado}
            autoFocus
          />
          <button
            className="HitlCard-input-send"
            onClick={handleEnviarInput}
            disabled={enviado || !inputValor.trim()}
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  );
}
