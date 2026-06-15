# UX Candidatos — ChatUIValtx
> Propuestas de mejora de experiencia priorizadas. Basadas en análisis del backend real y research de tendencias 2025-2026.

---

## Mapa de API — Contratos SSE

### POST `/api/v1/chat`
**Request:**
```json
{
  "texto": "string",
  "ejecutivo_id": "string",
  "session_id": "string",
  "file_ids": ["string"],
  "respuesta_hitl": {
    "decision": "string",
    "valor": "unknown"
  }
}
```
**Response (202):**
```json
{ "mensaje": "Procesando tu solicitud...", "oportunidad_id": "string | null" }
```

---

### GET `/api/v1/chat/stream/{session_id}` — SSE
Todos los eventos llegan bajo `event: mensaje` excepto `fin` que llega como `event: fin`.

#### Tipo: `pensando`
```json
{ "tipo": "pensando", "agente": null, "datos": null, "mensaje": "Procesando tu solicitud..." }
```
- Cuándo: inmediato al recibir el mensaje, antes de cualquier procesamiento.
- Frontend actual: activa `typing=true` (3 puntos genéricos).
- **Dato desaprovechado:** no distingue qué fase del procesamiento.

---

#### Tipo: `agente_llamado`
```json
{ "tipo": "agente_llamado", "agente": "agent1_clasificador", "datos": null, "mensaje": null }
```
- Cuándo: después de que A0 decide qué agente invocar.
- `agente` puede ser: `agent1_clasificador`, `agent2_constructor_pte`, `agent3_monitor_costos`, `agent4_coordinador`, `agent5_intel_mercado`, `agent6_registro`, `agent7_gestor_oportunidades`.
- Frontend actual: almacena en variable local, se usa solo para trazabilidad silenciosa en burbuja.
- **Dato desaprovechado completamente en UI.**

---

#### Tipo: `respuesta`
```json
{
  "tipo": "respuesta",
  "agente": "agent2_constructor_pte",
  "datos": {
    "oportunidad_id": "OPP-XXXXXXXX",
    "cliente": "string",
    "version": 1,
    "completitud_pct": 45,
    "estado": "borrador",
    "contenido": {},
    "campos_incompletos": ["alcance_tecnico", "plazo_entrega"],
    "moneda": "USD",
    "margen_estimado": 0.28
  },
  "mensaje": "He generado el borrador inicial de la propuesta..."
}
```
- `datos` es `output_agente` completo del agente. Estructura varía por agente (ver sección siguiente).
- Frontend actual: solo lee `mensaje`. `datos` se descarta salvo cuando `datos.hitl_tipo === 'draft_listo'`.

---

#### Tipo: `hitl`
```json
{
  "tipo": "hitl",
  "agente": "agent1_clasificador",
  "datos": {
    "opciones": ["Confirmar como Licitación Formal", "Reclasificar", "Cancelar"],
    "contexto": { "oportunidad_id": "OPP-XXXXXXXX", "cliente": "string", ... },
    "hitl_tipo": "confirmacion | seleccion_multiple | alerta_critica | datos_incompletos"
  },
  "mensaje": "He clasificado el documento como Licitación Formal (tipo A)..."
}
```
- `mensaje`: narrativa previa al HITL (contexto para el ejecutivo).
- `datos.opciones`: lista de strings para quick replies.
- `datos.hitl_tipo`: tipo semántico del HITL.
- `datos.contexto`: datos del agente guardados para resolución posterior.

---

#### Tipo: `error`
```json
{ "tipo": "error", "agente": null, "datos": null, "mensaje": "Descripción del error" }
```

---

#### Tipo: `fin`
```json
{ "tipo": "fin" }
```
- Llega como `event: fin` (no `event: mensaje`).
- Frontend actual: cierra stream, `thinking=false`.

---

## Mapa de `datos` por agente en evento `respuesta`

### A1 — Clasificador
```json
{
  "oportunidad_id": "OPP-XXXXXXXX",
  "cliente": "string",
  "tipo": "A | B | C | D",
  "tipo_actual": "A | B | C | D",
  "etapa": "RECIBIDA | CLASIFICADA | ...",
  "confianza": 0.92,
  "requisitos_clave": ["string"],
  "plazos": { "entrega": "string", "propuesta": "string" },
  "precio_referencia": 50000,
  "descripcion": "string",
  "flags": ["monto_alto", "requiere_staffing"],
  "md_encontrado": "string | null"
}
```

### A2 — Constructor PTE (DraftData)
```json
{
  "oportunidad_id": "OPP-XXXXXXXX",
  "cliente": "string",
  "version": 1,
  "completitud_pct": 45,
  "estado": "borrador | revisado | aprobado | enviado",
  "contenido": {},
  "campos_incompletos": ["string"],
  "moneda": "USD | PEN",
  "margen_estimado": 0.28,
  "cold_start": false,
  "campo_completado": "string | null",
  "fuentes_rag": [{ "cliente_fuente": "string", "similitud_score": 0.87 }]
}
```

### A3 — Monitor Costos
```json
{
  "proveedor_id": "string",
  "variacion_pct": 0.15,
  "supera_umbral": true,
  "alertas_propagadas": 3,
  "alerta": { "tipo": "precio_critico", "mensaje": "string" }
}
```

### A4 — Coordinador
```json
{
  "areas_mapeadas": ["legal", "ti", "financiero"],
  "num_dependencias": 3,
  "dependencias_bloqueadas": 0,
  "dependencias_completadas": 1,
  "alerta": { "tipo": "dependencia_bloqueada", "area": "string", "motivo": "string" }
}
```

### A5 — Intel Mercado
```json
{
  "resumen_ejecutivo": "string",
  "confianza": 0.75,
  "ventajas": ["string"],
  "brechas_criticas": ["string"],
  "brechas_menores": ["string"],
  "competidores_probables": ["string"],
  "rango_precio_competitivo": "string",
  "licitaciones_similares_ganadas": 3,
  "licitaciones_similares_perdidas": 1
}
```

### A7 — Gestor Oportunidades (búsqueda)
```json
{
  "candidatos": [
    { "id": "OPP-XXXXXXXX", "cliente": "string", "descripcion": "string", "etapa": "string", "tipo_actual": "string" }
  ],
  "total": 5,
  "query": "string"
}
```

### A7 — Gestor Oportunidades (analytics)
```json
{
  "tipo": "pipeline_activo | oportunidades_cliente | ...",
  "total": 47,
  "total_pagina": 50,
  "offset": 0,
  "tiene_mas": true,
  "datos": [{}],
  "filtros_aplicados": {}
}
```

---

## Gaps de UX identificados

| Gap | Dónde ocurre | Duración típica | Impacto |
|-----|-------------|-----------------|---------|
| Silencio post-envío | Entre POST /chat y primer SSE | 200–500ms | Alto — usuario no sabe si envió |
| Typing genérico | Entre `pensando` y `agente_llamado` | 1–3s | Alto — caja negra total |
| Pasos ocultos | Post-clasificación A1→A4→A2 encadenados | 5–12s | Alto — parece colgado |
| Output descartado | `datos` en `respuesta` ignorado al 90% | — | Medio — riqueza perdida |
| Estado oportunidad | Etapa/flags cambian internamente, no se emiten | — | Medio — usuario no ve avance |

---

## Candidatos UX a implementar

---

### UX-01 — Cursor parpadeante durante streaming
**Prioridad:** Alta | **Costo:** Muy bajo (CSS puro, 30 min) | **Requiere backend:** No

**Problema:** No hay señal visual de que el texto sigue llegando. El usuario no distingue "respuesta terminó" de "respuesta en curso".

**Solución:** Mostrar `▋` al final del texto mientras `isStreaming === true`. Desaparece al recibir `fin`.

```css
.streaming-cursor::after {
  content: "▋";
  animation: blink 1s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }
```

**Implementación:** Flag `isStreaming` en `useChat.ts` — `true` entre `pensando` y `fin`. Pasar como prop a `Bubble.tsx`.

---

### UX-02 — Skeleton instantáneo post-envío
**Prioridad:** Alta | **Costo:** Bajo (CSS + lógica, 45 min) | **Requiere backend:** No

**Problema:** Entre el envío y el primer SSE hay 200–500ms de silencio. El input se deshabilita pero no hay confirmación visual de que algo ocurrió.

**Solución:** Al hacer enviar, la burbuja bot aparece inmediatamente como shimmer antes del primer SSE. Al llegar `pensando`, transiciona al typing indicator. Al llegar texto real, fade-in del contenido.

```css
.bubble-skeleton {
  background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 18px 18px 18px 4px;
}
.bubble-skeleton-line { height: 14px; border-radius: 4px; margin: 5px 0; }
.bubble-skeleton-line:nth-child(1) { width: 80%; }
.bubble-skeleton-line:nth-child(2) { width: 95%; }
.bubble-skeleton-line:nth-child(3) { width: 60%; }
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Estados del ciclo:** `idle` → `skeleton` (post-envío) → `typing` (post-pensando) → `streaming` (post-respuesta parcial) → `done`.

---

### UX-03 — Indicador de agente activo
**Prioridad:** Alta | **Costo:** Bajo (motion + evento existente, 1h) | **Requiere backend:** No

**Problema:** El evento `agente_llamado` ya existe en el SSE pero se descarta visualmente. El usuario ve tres puntos genéricos durante 5–12 segundos sin saber qué procesa el sistema.

**Solución:** Reemplazar el typing indicator genérico por una pill animada con el nombre legible del agente activo. Muta en tiempo real si A0 encadena agentes.

```tsx
// Mapa semántico — sin hardcodear nombres de negocio en el componente
const AGENTE_LABEL: Record<string, string> = {
  agent1_clasificador:          "Analizando documento...",
  agent2_constructor_pte:       "Generando propuesta...",
  agent3_monitor_costos:        "Revisando cotización...",
  agent4_coordinador:           "Mapeando dependencias...",
  agent5_intel_mercado:         "Investigando mercado...",
  agent6_registro:              "Registrando...",
  agent7_gestor_oportunidades:  "Buscando oportunidad...",
}
```

```tsx
// motion/react — AnimatePresence con spring
// initial: opacity 0, y 8, scale 0.95
// animate: opacity 1, y 0, scale 1
// exit: opacity 0, scale 0.9
// transition: spring stiffness 300 damping 22
```

**Dependencias:** `npm install motion`

---

### UX-04 — Spring en entrada de burbujas
**Prioridad:** Media | **Costo:** Bajo (motion layout, 1h) | **Requiere backend:** No

**Problema:** Los mensajes aparecen sin transición. Los anteriores se desplazan de forma abrupta cuando llega uno nuevo.

**Solución:** Cada burbuja nueva entra con spring physics. Las burbujas anteriores se empujan suavemente hacia arriba con `layout` automático de motion.

```tsx
// motion.div con:
// layout (reflow automático al llegar nuevo mensaje)
// initial: opacity 0, y 16, scale 0.97
// animate: opacity 1, y 0, scale 1
// transition: spring stiffness 260 damping 20
// AnimatePresence initial={false} (no animar el primer render)
```

**Timing functions de referencia:**
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);   /* entradas premium */
--ease-spring:   /* motion spring stiffness 260 damping 20 */
```

**Dependencias:** `motion` (ya incluida en UX-03)

---

### UX-05 — Micro-eventos de estado (timeline discreto)
**Prioridad:** Media | **Costo:** Medio (2–3h + nuevo evento SSE backend) | **Requiere backend:** Sí — nuevo evento `estado_actualizado`

**Problema:** Cuando el sistema avanza la etapa de una oportunidad (RECIBIDA→CLASIFICADA, etc.), el usuario no lo ve. El cambio ocurre internamente y solo se narra en texto.

**Solución:** Líneas de estado discretas entre burbujas — no burbujas completas, sino pills de sistema con ícono + texto corto. Aparecen con animación suave y no interrumpen el flujo conversacional.

```tsx
// Ejemplos de eventos de sistema:
// "Oportunidad avanzó a CLASIFICADA"
// "Draft v1 generado — 45% completo"
// "3 dependencias mapeadas: Legal, TI, Financiero"
```

```tsx
// motion.div
// initial: opacity 0, scale 0.8, y 10
// animate: opacity 1, scale 1, y 0
// exit: opacity 0, scale 0.9, y -5
// transition: spring stiffness 300 damping 22
```

**Nuevo evento SSE a emitir desde backend (chat.py):**
```json
{ "tipo": "estado_actualizado", "agente": "agent6_registro", "datos": { "campo": "etapa", "valor": "CLASIFICADA", "label": "Oportunidad avanzada a Clasificada" }, "mensaje": null }
```

---

### UX-06 — Streaming de texto con animación token
**Prioridad:** Media | **Costo:** Bajo (flowtoken, 1h) | **Requiere backend:** No

**Problema:** El texto aparece letra por letra de forma cruda. No hay diferenciación visual entre "texto llegando" y "texto completo".

**Solución:** Animar cada palabra con `blurIn` — aparece de borrosa a nítida, efecto premium usado en interfaces AI modernas.

```tsx
import { AnimatedMarkdown } from 'flowtoken';
// sep="word", animation="blurIn", animationDuration="0.3s"
// Reemplaza ReactMarkdown en Bubble.tsx cuando isStreaming===true
// Al terminar streaming, transicionar a ReactMarkdown estático
```

**Dependencias:** `npm install flowtoken`

---

### UX-07 — Bubble tipo tabla para analytics
**Prioridad:** Alta (datos de A7 analytics) | **Costo:** Alto (3–4h) | **Requiere backend:** No

**Problema:** A7 analytics devuelve listas de 20–50 oportunidades. A0 las narra como texto markdown — ilegible para más de 5 items.

**Solución:** Nuevo tipo de bubble `tabla` que renderiza datos estructurados del `datos` del evento `respuesta`. El ejecutivo puede escanear, ordenar y hacer clic en una fila para seleccionar esa oportunidad.

**Activación:** Cuando `datos.tipo` existe (analytics) y `datos.datos` es array con más de 3 items → renderizar como tabla en lugar de texto.

**Datos disponibles sin cambio de backend:**
```json
// Ya viene en datos del evento respuesta cuando agente es agent7
{
  "tipo": "pipeline_activo",
  "total": 47,
  "tiene_mas": true,
  "datos": [{ "cliente": "...", "etapa": "...", "ejecutivo_id": "...", "monto_actual": 50000 }],
  "filtros_aplicados": {}
}
```

---

### UX-08 — Chain-of-thought para flujos multi-agente
**Prioridad:** Baja–Media | **Costo:** Alto (4–5h + cambios backend) | **Requiere backend:** Sí

**Problema:** En flujos como post-clasificación (A1→A4→A2), el usuario ve una sola respuesta final sin saber qué procesó el sistema en los 8–12 segundos previos.

**Solución:** Acordeón colapsable que muestra los pasos del razonamiento. Cerrado por defecto, expandible on-demand. Patrón de `prompt-kit` / `shadcn/ai`.

**Requiere:** Nuevo evento SSE `paso_completado` desde backend por cada agente en cadena.

**Dependencias:** `npx shadcn add "https://prompt-kit.com/c/chain-of-thought.json"`

---

---

## UX-09 — Panel contextual dinámico (control remoto)
**Prioridad:** Alta | **Costo:** Alto (progresivo por fases) | **Requiere backend:** No para primeros tipos

El chat es el control remoto. El panel derecho es el instrumento. No existe un componente genérico — cada tipo de respuesta tiene su propia identidad visual, comportamiento y modo de interacción. La forma comunica el significado antes de que el usuario lea una sola línea.

### Principio de diseño
No hay "card con título y texto". Cada componente tiene su propio **verbo visual**:
- A1 **escanea**
- A2 **construye**
- A3 **alerta**
- A4 **monitorea**
- A5 **analiza**
- A7 **detecta / reporta** (según sub-tipo)

### Comportamiento del panel
Estado `dormante` → franja delgada en el borde derecho, casi invisible.
Estado `activo` → se expande con reveal animado al recibir datos estructurados.
No se "cierra" — colapsa a dormante cuando el chat vuelve a texto puro.
La transición dormante↔activo ES la señal de que el sistema respondió.

**Reveal de entrada — HUD scan:**
```css
@keyframes hud-reveal {
  0%   { clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); opacity: 0.3; }
  60%  { clip-path: polygon(0 0, 100% 0, 100% 75%, 0 75%); opacity: 0.8; }
  100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity: 1; }
}
```

**Scan line al activarse** — una línea que baja una sola vez:
```css
@keyframes scan {
  from { top: 0; opacity: 1; }
  to   { top: 100%; opacity: 0; }
}
.scan-line {
  background: linear-gradient(90deg, transparent, var(--hud-primary), transparent);
  box-shadow: 0 0 8px var(--hud-primary);
  animation: scan 0.6s ease-out forwards;
}
```

**Esquinas HUD** — no border-radius circular:
```css
.hud-card {
  clip-path: polygon(12px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 12px);
  border: 1px solid var(--hud-border);
  background: var(--hud-bg);
  backdrop-filter: blur(12px);
}
```

**Paleta HUD:**
```css
:root {
  --hud-primary:  #63B3ED;               /* azul eléctrico — datos activos */
  --hud-success:  #68D391;               /* verde — confirmado */
  --hud-warning:  #F6AD55;               /* ámbar — pendiente / HITL */
  --hud-critical: #FC8181;               /* rojo — alerta / bloqueado */
  --hud-bg:       rgba(10, 15, 30, 0.90);
  --hud-border:   rgba(99, 179, 237, 0.25);
  --hud-glow:     0 0 12px rgba(99, 179, 237, 0.4);
}
```

---

### Identidades visuales por tipo de respuesta

---

#### COMP-01 — A1 Scanner de clasificación
**Verbo:** escanea / decodifica
**Activación:** evento `respuesta` con `agente === 'agent1_clasificador'`
**Datos:** `tipo`, `confianza`, `cliente`, `requisitos_clave[]`, `flags[]`

**Experiencia:** Anillos concéntricos que se cierran sobre el documento mientras sube la confianza. El tipo A/B/C/D se revela al final como si decodificara — no aparece de golpe sino letra por letra con efecto de resolución. Los requisitos clave emergen como tags uno a uno en stagger de 80ms. Los flags con color según criticidad pulsan una vez al aparecer.

```
Animación entrada: rings closing (CSS transform scale + opacity)
Tipo reveal: typewriter char por char, 60ms/char
Confianza: número que cuenta desde 0 hasta el valor real
Stagger tags: 80ms entre cada requisito_clave
```

---

#### COMP-02 — A2 Draft vivo
**Verbo:** construye / completa
**Activación:** evento `respuesta` con `agente === 'agent2_constructor_pte'`
**Datos:** `completitud_pct`, `campos_incompletos[]`, `version`, `moneda`, `margen_estimado`

**Experiencia:** Una barra de progreso circular (no lineal) que se anima hasta el % real. Las secciones del draft se muestran como bloques — las completas con texto, las incompletas como líneas vacías que *pulsan* en `--hud-warning` pidiendo atención. El margen estimado aparece como indicador de medidor (gauge). Al completar un campo, la barra sube y ese bloque transiciona de vacío a lleno.

```
Barra: arc SVG animado de 0 a completitud_pct, spring stiffness 80 damping 15
Campos incompletos: pulse animation 2s ease-in-out infinite en --hud-warning
Nuevo campo completado: flash verde + barra incrementa con spring
```

---

#### COMP-03 — A3 Alerta de precio
**Verbo:** alerta / pulsa
**Activación:** evento `respuesta` con `agente === 'agent3_monitor_costos'`
**Datos:** `proveedor_id`, `variacion_pct`, `supera_umbral`, `alertas_propagadas`

**Experiencia:** Si `supera_umbral === false` — panel minimalista, color neutro, sin drama. Si `supera_umbral === true` — el panel entra con un flash de `--hud-critical`, el porcentaje de variación late como un pulso cardíaco una vez, y el número de oportunidades afectadas aparece con contador animado. No es alarmista — es preciso e inmediato.

```
Sin umbral: fade-in suave, color --hud-primary
Con umbral: flash crítico inicial (opacity 0→1→0.7→1 en 300ms), pulse en variacion_pct
Contador afectadas: count-up de 0 al valor real, 40ms/unidad
```

---

#### COMP-04 — A4 Monitor de dependencias
**Verbo:** monitorea / semáforos
**Activación:** evento `respuesta` con `agente === 'agent4_coordinador'`
**Datos:** `areas_mapeadas[]`, `num_dependencias`, `dependencias_bloqueadas`, `dependencias_completadas`

**Experiencia:** Cada área como un nodo circular con color de estado. No es una lista — es un sistema de nodos conectados por líneas tenues. Los nodos caen en stagger desde arriba. El color comunica el estado sin texto: verde completado, ámbar pendiente, rojo bloqueado. Los nodos bloqueados pulsan en `--hud-critical`. Al hover, el nodo expande con detalle.

```
Entrada: nodos caen con spring stiffness 260 damping 20, stagger 100ms
Estado pendiente: pulse 2s infinite en --hud-warning a 40% opacity
Estado bloqueado: pulse 1.5s infinite en --hud-critical, más agresivo
Hover: scale 1.15 + tooltip con detalle, spring stiffness 400 damping 17
```

---

#### COMP-05 — A5 Radar de inteligencia
**Verbo:** analiza / mapea
**Activación:** evento `respuesta` con `agente === 'agent5_intel_mercado'`
**Datos:** `ventajas[]`, `brechas_criticas[]`, `competidores_probables[]`, `confianza`, `rango_precio_competitivo`

**Experiencia:** Spider/radar chart que dibuja sus ejes uno a uno mientras llega el contenido. Cada eje representa una dimensión competitiva. Los competidores aparecen como nodos en red fuera del radar, con tamaño proporcional a su frecuencia. La confianza del análisis es el glow del borde del radar — alta confianza, más luminoso. El resumen ejecutivo aparece debajo con `blurIn` word por word.

```
Radar: ejes se dibujan en secuencia, área rellena con fill animado
Competidores: nodos con size proporcional, entran con scale 0→1 en stagger
Confianza → glow: map(0-1) a box-shadow blur 4px→20px
Resumen: flowtoken blurIn, sep="word"
```

---

#### COMP-06 — A7 Targeting (buscar oportunidad)
**Verbo:** rastrea / detecta
**Activación:** evento `respuesta` con `agente === 'agent7_gestor_oportunidades'` y `datos.candidatos`
**Datos:** `candidatos[]`, `total`, `query`

**Experiencia:** Reticle (mira de targeting) que aparece y se cierra sobre el primer candidato. Si hay múltiples candidatos, aparecen como señales en un campo — puntos que se estabilizan en sus posiciones con spring. El seleccionado queda con el reticle, los demás se atenúan. Al elegir uno, el reticle hace lock-on (animación de cierre) y el resto desaparece.

```
Reticle: 4 arcos SVG que se cierran con rotation + scale, spring stiffness 200 damping 18
Candidatos múltiples: scatter → settle, posición aleatoria → posición en grid, spring
Lock-on: flash verde + reticle pulsa 1 vez
```

---

#### COMP-07 — A7 Pipeline activo
**Verbo:** reporta / energía viva
**Activación:** `datos.tipo === 'pipeline_activo'`
**Datos:** `datos[]` con cliente, etapa, ejecutivo_id, monto_actual; `total`, `tiene_mas`

**Experiencia:** Filas que entran desde el lateral derecho como señales captadas, en stagger de 30ms. El monto no es texto — es una barra horizontal proporcional al máximo del set. La etapa es un indicador de posición en pipeline (RECIBIDA→CLASIFICADA→EN_PROPUESTA→...), no un label. Al hover en una fila, se expande con micro-detalle. Si `tiene_mas`, una fila final pulsa indicando más datos disponibles.

```
Entrada filas: translateX(20px)→0 + opacity 0→1, stagger 30ms, spring stiffness 280 damping 22
Barras monto: width 0→% relativo, spring stiffness 100 damping 15, delay proporcional al index
Etapa: dot en posición del pipeline (5 posiciones), no texto
tiene_mas: última fila con pulse infinito en --hud-warning
```

---

#### COMP-08 — A7 Timeline de oportunidad
**Verbo:** narra el tiempo
**Activación:** `datos.tipo === 'timeline'`
**Datos:** `datos[]` con timestamp, tipo, descripcion, actor

**Experiencia:** Línea vertical central que se llena de abajo hacia arriba como energía fluyendo. Cada evento es un nodo en la línea — al entrar al viewport (scroll-linked) el nodo aparece con spring y la línea crece hasta él. Las fechas son relativas ("hace 3 días") que al hover muestran la absoluta. Al click en un nodo, la card se expande verticalmente con AnimatePresence. Los tipos de evento tienen íconos distintos (reunión, documento, cambio de etapa, draft).

```
Línea fill: scaleY 0→1 en scroll, transform-origin bottom
Nodos: scale 0→1 + line grows al entrar viewport (useInView)
Fecha tooltip: opacity 0→1 en hover, spring stiffness 300 damping 22
Card expand: height auto con AnimatePresence, spring stiffness 200 damping 25
```

---

#### COMP-09 — A7 Win rate
**Verbo:** mide
**Activación:** `datos.tipo === 'win_rate_ejecutivos' | 'win_rate_lineas' | 'win_rate_servicios'`
**Datos:** `datos[]` con nombre y tasa

**Experiencia:** Gauges circulares — uno por ejecutivo/línea/servicio. El arco SVG se anima desde 0 hasta el valor real. El número cuenta hacia arriba en sync con el arco. Color del gauge muta según el valor: bajo → rojo, medio → ámbar, alto → verde. No hay tabla — los gauges se ordenan de mayor a menor y tienen tamaño levemente proporcional al valor.

```
Arc: SVG stroke-dashoffset animado de circunferencia→valor, spring stiffness 80 damping 12
Counter: requestAnimationFrame count-up sincronizado con el arc
Color: interpolación CSS entre --hud-critical y --hud-success según valor
Tamaño: scale proporcional, gauges top rankeados levemente más grandes
```

---

#### COMP-10 — A7 Oportunidades estancadas
**Verbo:** calienta / urgencia
**Activación:** `datos.tipo === 'oportunidades_estancadas'`
**Datos:** `datos[]` con cliente, dias_sin_movimiento, ejecutivo_id

**Experiencia:** Heatmap de intensidad — no lista. Cada oportunidad es un bloque cuyo color va de azul frío (pocos días) a rojo intenso (muchos días). Los bloques más críticos tienen un pulse de glow lento. Al hover, la temperatura del bloque se traduce en texto: "Sin actividad por 67 días". El bloque más crítico ocupa el primer lugar visualmente por tamaño ligeramente mayor.

```
Color: interpolación HSL, hue 200 (azul) → hue 0 (rojo) mapeado a dias_sin_movimiento
Glow crítico: box-shadow pulsante en --hud-critical para dias > 60
Hover: scale 1.05 + tooltip con contexto, spring stiffness 350 damping 20
```

---

#### COMP-11 — A7 Competidores
**Verbo:** mapea rivales
**Activación:** `datos.tipo === 'competidores'`
**Datos:** `datos[]` con competidor, total_apariciones, veces_perdimos, veces_ganamos

**Experiencia:** Red de nodos force-directed — cada competidor es un nodo cuyo tamaño es proporcional a `total_apariciones`. El color del nodo indica el ratio ganado/perdido contra ellos: verde si ganamos más veces, rojo si perdemos más. Los nodos flotan con física suave (D3 force o CSS spring). Al hover, el nodo se expande con detalle win/lose.

```
Layout: D3 force simulation o CSS custom properties con spring
Tamaño nodo: map(apariciones) a radius 20px–60px
Color: interpolación según ratio veces_ganamos/total
Aparición: nodos entran con scale 0→1 en stagger 60ms, posición se estabiliza con force
```

---

#### COMP-12 — A7 Resumen sector
**Verbo:** territorializa
**Activación:** `datos.tipo === 'resumen_sector'`
**Datos:** `datos[]` con sector, adjudicadas, activas, monto_usd

**Experiencia:** Treemap o mosaico de territorios — cada sector como un bloque de área proporcional al monto contratado. Dentro de cada bloque, un indicador pequeño de adjudicadas vs activas. Los bloques se construyen con animación de grow desde el centro. El sector con mayor monto ocupa más espacio visualmente de forma inmediata y obvia.

```
Layout: treemap calculado en JS, bloques con position absolute
Entrada: scale 0→1 desde center de cada bloque, stagger por tamaño desc
Label: aparece con fadeIn después de que el bloque está al 70% de su tamaño
```

---

#### COMP-13 — HITL como conversación
**Verbo:** pregunta / espera respuesta
**Activación:** evento `hitl`
**Datos:** `opciones[]`, `hitl_tipo`, `mensaje`

**Experiencia:** No es un formulario ni botones genéricos. La narrativa previa (el `mensaje`) se muestra primero en el bubble normal. Luego las opciones aparecen como elementos flotantes debajo — no botones rectangulares sino cápsulas con spring que entran en stagger desde abajo. La opción seleccionada hace un lock (escala, glow breve) y las demás se desvanecen. El sistema queda visualmente "esperando" con un indicador de pulso hasta que se responde.

```
Cápsulas opciones: translateY(12px)→0 + opacity 0→1, stagger 60ms, spring stiffness 320 damping 24
Selección: scale 0.95→1.05→1 + flash en --hud-success, 200ms
No seleccionadas: opacity 1→0.2→0, 300ms
Espera: dot pulse en el bubble, 1.5s infinite
```

---

#### COMP-14 — Micro-evento de estado (sistema)
**Verbo:** registra / avanza
**Activación:** eventos de cambio interno (etapa, flags) — requiere nuevo SSE `estado_actualizado`
**Datos:** `campo`, `valor`, `label`

**Experiencia:** No es una burbuja — es una línea de sistema discreta entre burbujas. Aparece como texto pequeño centrado con un ícono de estado y la fecha. Color según tipo: verde para avances, ámbar para cambios, rojo para alertas. Entra con fade-in y se queda permanentemente en el historial como registro. No interrumpe el flujo — es parte del timeline.

```
Posición: centrado entre burbujas, font-size 11px, opacity 0.7
Entrada: opacity 0→0.7 en 400ms, ease-out
Ícono: checkmark (avance), arrow (cambio), warning (alerta)
Color línea lateral: 2px border-left en color del tipo
```

---

## Lenguaje visual y motion design

### Timing functions de referencia
```css
:root {
  --ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);    /* entradas premium */
  --ease-in-expo:     cubic-bezier(0.7, 0, 0.84, 0);    /* salidas */
  --ease-spring-sm:   /* motion spring stiffness 320 damping 24 — elementos pequeños */
  --ease-spring-md:   /* motion spring stiffness 260 damping 20 — burbujas */
  --ease-spring-lg:   /* motion spring stiffness 200 damping 25 — paneles */
  --ease-spring-data: /* motion spring stiffness 80  damping 12 — datos/gauges */
}
```

### Reglas de motion
- Elementos pequeños (pills, tags, dots): spring stiffness alta (300–400), damping alta (20–25) — snappy
- Burbujas de chat: spring stiffness media (260), damping media (20) — fluido
- Paneles y secciones: spring stiffness baja (80–200), damping media (15–25) — pesado y elegante
- Datos y gauges: spring stiffness muy baja (80–100), damping baja (12–15) — cinético

### Fuente recomendada para elementos HUD
`Orbitron` (Google Fonts) para labels de estado, porcentajes y IDs. Sistema para texto narrativo. La combinación comunica: datos del sistema vs lenguaje humano.

---

## Roadmap sugerido

| Fase | Candidatos | Semana estimada |
|------|-----------|-----------------|
| **1 — Percepción inmediata** | UX-01 (cursor), UX-02 (skeleton), UX-03 (agente pill) | 1 |
| **2 — Fluidez visual** | UX-04 (spring bubbles), UX-06 (streaming animado) | 1–2 |
| **3 — Datos estructurados** | UX-07 (bubble tabla) | 2–3 |
| **4 — Transparencia sistema** | UX-05 (micro-eventos), UX-08 (chain-of-thought) | 3–4 |

---

## Dependencias a instalar

```bash
# Fase 1-2 (sin backend)
npm install motion flowtoken

# Fase 3 (sin backend)
# CSS/TSX puro

# Fase 4 (con cambios backend)
npx shadcn add "https://prompt-kit.com/c/chain-of-thought.json"
```

---

## Notas técnicas

- `motion` reemplaza `framer-motion` — misma API, nuevo nombre desde v11.
- `flowtoken` requiere que el contenido se actualice chunk a chunk (ya funciona así con SSE).
- Glassmorphism requiere fondo con contenido detrás — evaluar si el diseño actual lo soporta.
- `prefers-reduced-motion` debe respetarse en todas las animaciones.
- Spring config recomendada: `stiffness 260 damping 20` para burbujas, `stiffness 300 damping 22` para pills/notificaciones.
