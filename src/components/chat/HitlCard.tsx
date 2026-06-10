import { useState } from 'react';

interface Props {
  opciones: string[];
  hitl_tipo: string;
  onSelect: (valor: string) => void;
}

// Modos según hitl_tipo:
//   datos_incompletos | sin opciones → solo input de texto libre
//   validacion_campo                 → botones + input (opción "corregir" requiere valor)
//   seleccion_multiple               → botones + input libre como alternativa (no complemento)
//   resto                            → solo botones
function resolverModo(hitl_tipo: string, opciones: string[]): 'botones' | 'botones_input' | 'botones_o_input' | 'input' {
  if (!opciones.length || hitl_tipo === 'datos_incompletos') return 'input';
  if (hitl_tipo === 'validacion_campo') return 'botones_input';
  if (hitl_tipo === 'seleccion_multiple') return 'botones_o_input';
  return 'botones';
}

export function HitlCard({ opciones, hitl_tipo, onSelect }: Props) {
  const modo = resolverModo(hitl_tipo, opciones);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [inputValor, setInputValor] = useState('');
  const [enviado, setEnviado] = useState(false);

  function handleBoton(i: number) {
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
    // botones_o_input: input libre es alternativa directa (no requiere botón seleccionado)
    // botones_input: combina botón seleccionado + valor como JSON
    const payload = (modo === 'botones_input' && seleccionado !== null)
      ? JSON.stringify({ decision: opciones[seleccionado], valor: inputValor.trim() })
      : inputValor.trim();
    onSelect(payload);
  }

  const esperandoInput = modo === 'botones_input' && seleccionado !== null && opciones[seleccionado]?.toLowerCase() === 'corregir' && !enviado;
  const mostrarInput = modo === 'input' || modo === 'botones_o_input' || esperandoInput;

  return (
    <div className="hitl-card">
      <div className="hitl-card__header">
        <span className="hitl-card__icon">⚡</span>
        <span className="hitl-card__titulo">Acción requerida</span>
      </div>

      {opciones.length > 0 && (
        <div className="hitl-card__opciones">
          {opciones.map((opcion, i) => (
            <button
              key={i}
              className={[
                'hitl-card__opcion',
                seleccionado === i ? 'hitl-card__opcion--activa' : '',
                enviado && seleccionado !== i ? 'hitl-card__opcion--deshabilitada' : '',
              ].join(' ').trim()}
              onClick={() => handleBoton(i)}
              disabled={enviado || (seleccionado !== null && seleccionado !== i && modo !== 'botones_input')}
            >
              <span className="hitl-card__opcion-texto">{opcion}</span>
              <span className="hitl-card__opcion-chevron">
                {enviado && seleccionado === i ? '✓' : '›'}
              </span>
            </button>
          ))}
        </div>
      )}

      {mostrarInput && (
        <div className="hitl-card__input-area">
          <input
            className="hitl-card__input"
            type="text"
            placeholder={esperandoInput ? 'Ingresa el valor corregido...' : modo === 'botones_o_input' ? 'O escribe una búsqueda diferente...' : 'Escribe tu respuesta...'}
            value={inputValor}
            onChange={e => setInputValor(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEnviarInput()}
            disabled={enviado}
            autoFocus
          />
          <button
            className="hitl-card__input-enviar"
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
