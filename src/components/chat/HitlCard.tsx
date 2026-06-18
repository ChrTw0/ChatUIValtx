import { useState } from 'react';
import { HitlContexto } from './HitlContexto';
import './HitlCard.styles.css';

interface Props {
  opciones: string[];
  hitl_tipo: string;
  contexto?: Record<string, unknown>;
  onSelect: (valor: string) => void;
}

function resolverModo(hitl_tipo: string, opciones: string[]): 'botones' | 'botones_input' | 'botones_o_input' | 'input' {
  if (!opciones.length || hitl_tipo === 'datos_incompletos') return 'input';
  if (hitl_tipo === 'validacion_campo') return 'botones_input';
  if (hitl_tipo === 'seleccion_multiple') return 'botones_o_input';
  return 'botones';
}

export function HitlCard({ opciones, hitl_tipo, contexto, onSelect }: Props) {
  const modo = resolverModo(hitl_tipo, opciones);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [inputValor, setInputValor] = useState('');
  const [enviado, setEnviado] = useState(false);

  function handleCapsule(i: number) {
    if (enviado) return;
    const opcion = opciones[i];
    if (modo === 'botones_input' && opcion.toLowerCase() === 'corregir') {
      setSeleccionado(i);
      return;
    }
    setSeleccionado(i);
    setEnviado(true);
    const valor = hitl_tipo === 'seleccion_multiple' ? String(i + 1) : opcion;
    onSelect(valor);
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
              esperandoInput           ? 'Ingresa el valor corregido...'
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
