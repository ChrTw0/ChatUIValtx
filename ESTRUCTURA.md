# ChatUIValtx — Estructura del Proyecto

Frontend del sistema AgentValtx. Construido con Vite + React + TypeScript + ChatUI (Alibaba).
Se comunica con el backend en `http://localhost:8001/api/v1` via HTTP y SSE.

## Estructura de carpetas

```
src/
├── api/
│   ├── client.ts            # fetch base, BASE_URL, headers comunes
│   ├── chat.ts              # sendMessage(), openStream()
│   └── files.ts             # uploadFile()
│
├── types/
│   ├── api.ts               # SSEEvent, ChatMessage — contratos con el backend
│   └── ui.ts                # tipos internos de UI (MessageItem, HitlState, etc.)
│
├── hooks/
│   ├── useStream.ts         # manejo del SSE — abre, cierra, emite eventos
│   ├── useHitl.ts           # estado HITL — opciones pendientes, resolver
│   └── useChat.ts           # orquesta los hooks — único punto de entrada para UI
│
├── components/
│   ├── common/
│   │   └── AgentStatusBubble.tsx  # estado inline del agente durante procesamiento
│   ├── chat/
│   │   ├── ChatApp.tsx            # shell principal con <Chat> de ChatUI
│   │   ├── MessageRenderer.tsx    # switch por tipo de mensaje (OCP — extensible)
│   │   └── HitlCard.tsx           # card "Acción Requerida" con opciones tipo lista
│   └── layout/
│       └── AppShell.tsx           # wrapper de layout global
│
├── pages/
│   ├── ChatPage.tsx         # página principal — monta ChatApp
│   └── NotFoundPage.tsx     # 404
│
├── router/
│   └── index.tsx            # rutas con react-router-dom
│
├── constants/
│   └── index.ts             # SESSION_ID_KEY, AGENT_LABELS, etc.
│
├── utils/
│   └── session.ts           # generar/leer ejecutivo_id desde localStorage
│
├── App.tsx
├── main.tsx
└── index.css
```

## Principios SOLID aplicados

- **SRP** — cada hook tiene una sola razón de cambiar (`useStream` no sabe de HITL, `useHitl` no sabe de SSE)
- **OCP** — `MessageRenderer` es un switch extensible sin tocar `ChatApp`; nuevos tipos de mensaje = nuevo case
- **DIP** — `useChat` depende de abstracciones (`useStream`, `useHitl`), no de implementaciones concretas
- **ISP** — `api/chat.ts` y `api/files.ts` separados — quien sube archivos no importa el chat

## Endpoints del backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/chat` | Enviar mensaje / responder HITL |
| GET | `/chat/stream/{session_id}` | SSE stream de eventos |
| POST | `/files` | Subir archivo adjunto |

## Eventos SSE

| tipo | descripción |
|------|-------------|
| `pensando` | El orquestador está procesando |
| `agente_llamado` | Se delegó a un agente especializado |
| `hitl` | El agente necesita decisión del ejecutivo |
| `respuesta` | Resultado final |
| `error` | Error en el procesamiento |
| `fin` | Stream cerrado |

## Variables de entorno

```env
VITE_API_URL=http://localhost:8001/api/v1
```

---

## Implementaciones futuras a evaluar

### Panel Borrador de Propuesta (split-view izquierdo)
Mostrar en tiempo real el documento PTE generado por el agente, con edición manual y botón guardar/sincronizar.
- **Requiere backend:** SSE que envíe el documento por chunks (`tipo: "documento_chunk"`), endpoint PUT para guardar cambios
- **Requiere frontend:** renderer markdown editable (ej. `@uiw/react-md-editor`), estado de documento en `useDocument` hook, layout split-view con resizer
- **Complejidad:** Alta — es prácticamente una segunda aplicación dentro del mismo layout
- **Trigger:** Cuando los agentes generen propuestas de forma consistente y el equipo quiera editarlas sin salir del chat

### Panel Estado de Coordinación con Áreas
Checklist en tiempo real del estado de aprobaciones internas (Control de Gestión, SDM, RRHH).
- **Requiere backend:** Agente coordinador que emita eventos de estado por área, tabla de aprobaciones en PostgreSQL
- **Complejidad:** Media-alta — requiere modelar flujo de aprobaciones multi-actor
- **Trigger:** Cuando el flujo de validación interna esté definido formalmente

### Indicadores de Oportunidad (KPIs por sesión)
Panel lateral con Clasificación Comercial, Margen de Ganancia, Esfuerzo estimado, Cambios manuales.
- **Requiere backend:** SSE evento `tipo: "indicadores"` con payload de métricas por `oportunidad_id`
- **Requiere frontend:** `useIndicadores` hook, componente `KpiPanel` reutilizable
- **Complejidad:** Baja — si el backend envía los datos, el componente es simple
- **Trigger:** Cuando Agent 1 clasifique y calcule margen de forma confiable

### Información Comercial de Respaldo (RAG citations)
Mostrar los fragmentos de documentos históricos que usó el agente como base para su respuesta.
- **Requiere backend:** SSE evento `tipo: "fuentes"` con lista de `{titulo, fragmento, score}`
- **Requiere frontend:** Componente `SourcesPanel` o bubble tipo "cita" en el chat
- **Complejidad:** Baja en frontend, media en backend (exponer retrieval results)
- **Trigger:** Cuando el RAG esté calibrado con los 80-90 clientes reales indexados
