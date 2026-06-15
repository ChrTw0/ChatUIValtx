# Plan: Draft Panel — Side Panel Dockable

## Contexto y decisiones tomadas

### Por qué este diseño
- Investigación de patrones japoneses/coreanos/chinos confirmó: el patrón correcto para un documento secundario en un chat es **side panel dockable** (no modal, no card inline)
- Referencia: Claude Artifacts, GitHub Copilot, MS Teams threads — el chat es primario, el documento es secundario
- Principio japonés 引き算 (sustracción): quitar el DraftCard del flujo del chat, el chat queda limpio
- El DraftCard actual (barra + lista de campos) fue eliminado — redundaba con lo que el bot ya dice en texto

---

## Arquitectura de layout

```
flex-row parent (.chat-layout)
├── .chat-area   { flex: 1; transition: all 300ms ease; }
└── .draft-panel { width: 0 → 420px; overflow: hidden; transition: all 300ms ease; }
```

- Sin overlay ni backdrop — el panel es persistente
- El chat se estrecha simultáneamente con el panel al abrir
- Mobile fallback: panel ocupa 100% (modal-like, sin comprimir chat)

---

## Trigger de apertura

- Botón compacto en el header del chat: `📄 Borrador PTE v2` (visible solo cuando hay draft activo en sesión)
- Aparece cuando el SSE `respuesta` trae `datos.completitud_pct` + `datos.oportunidad_id`
- Estado guardado en `useChat` o contexto de sesión: `draftActivo: { oportunidad_id, version, completitud_pct }`

---

## Animaciones y micro-interacciones

| Momento | Animación | Duración |
|---|---|---|
| Panel abre | `translateX(100%) → translateX(0)` + chat se estrecha | 300ms `cubic-bezier(0.4, 0, 0.2, 1)` |
| Panel cierra | `translateX(0) → translateX(100%)` + chat se expande | 300ms |
| Campo en edición | Border `#3b82f6` con box-shadow suave | 150ms |
| Campo guardado | Flash verde breve en el campo | 200ms |
| Barra completitud | Anima width al nuevo valor | 400ms ease |
| Botón "Guardar y continuar" | spinner → éxito → cierra edición | según respuesta backend |
| Badge de etapa EN_PROPUESTA | Color cambia de gris a verde | 300ms + toast en chat |

---

## Estructura del panel

```
┌─────────────────────────────────┐
│ [X]  Borrador PTE v2  ·  BBVA  │  ← header fijo
│ ████████░░░░░░░░ 30% completo  │  ← barra animada
├─────────────────────────────────┤
│                                 │
│ alcance_tecnico                 │  ← campos completos (read)
│ ─────────────────────           │
│ entregables         [Editar]   │  ← campos [COMPLETAR] con botón
│ garantias_sla       [Editar]   │
│ desglose_costos     [Editar]   │
│ plazo_ejecucion     [Editar]   │
│ equipo_propuesto    [Editar]   │
│ condiciones...      [Editar]   │
│                                 │
├─────────────────────────────────┤
│ [Cancelar]  [Guardar y continuar chat] │  ← sticky footer, visible solo al editar
└─────────────────────────────────┘
```

---

## Flujo de edición

1. Usuario abre panel → ve campos completos e incompletos
2. Click en `[Editar]` de un campo → textarea inline se expande, campo se ilumina
3. Usuario escribe el valor
4. Click `[Guardar y continuar chat]`:
   - Frontend llama API `POST /chat` con texto construido: `"Completar campo {campo}: {valor}"`
   - Backend: A0 → A2 `completar_seccion` → guarda en DB, recalcula completitud
   - Si completitud ≥ 80% y deps resueltas → A6 dispara EN_PROPUESTA
   - SSE respuesta llega al chat con el estado actualizado
   - Panel actualiza barra de completitud + marca campo como completo
5. Click `[Cancelar]` → descarta cambios sin guardar, restaura estado previo

---

## Botones y estados del panel

| Estado | Botones visibles |
|---|---|
| Ningún campo en edición | Solo `[X cerrar]` en header |
| Campo en edición | `[Cancelar edición]` (ghost) + `[Guardar y continuar]` (primary) en footer sticky |
| Guardando (spinner) | Botones deshabilitados |
| Guardado exitoso | Flash verde en campo + barra actualiza |

---

## Datos que necesita el panel

Del SSE `respuesta` cuando A2 responde:
```json
{
  "oportunidad_id": "SYN-BBVA-...",
  "version": 2,
  "estado": "borrador",
  "completitud_pct": 30.0,
  "campos_incompletos": ["entregables", "garantias_sla", ...]
}
```

Para el contenido completo de cada campo → llamar `GET /api/v1/drafts/{oportunidad_id}` al abrir el panel (ya existe el endpoint).

---

## Archivos a crear/modificar

### Frontend (ChatUIValtx)
| Archivo | Cambio |
|---|---|
| `src/components/chat/DraftPanel.tsx` | Nuevo componente — panel lateral |
| `src/components/chat/ChatApp.tsx` | Agregar `.chat-layout` flex wrapper + montar DraftPanel |
| `src/hooks/useChat.ts` | Estado `draftActivo` + handler para abrir/cerrar panel |
| `src/hooks/useDraftPanel.ts` | Nuevo hook — lógica de edición, guardado, estado campos |
| `src/api/drafts.ts` | Ya existe `getDraft()` — suficiente |
| `src/index.css` | Estilos `.draft-panel`, `.chat-layout`, `.draft-panel__field`, animaciones |

### Backend (AgentValtx)
No se requieren cambios — el flujo usa `POST /api/v1/chat` con texto natural → A0 → A2 `completar_seccion`. Ya funciona.

---

## Lo que NO se hace ahora

- Sin edición de campos tipo rich text / markdown editor
- Sin preview del draft como documento formateado (siguiente iteración)
- Sin guardar múltiples campos en batch (se guarda de a uno por ahora)
- Sin drag-to-resize del panel

---

## Estado actual del DraftCard (reemplazado)

El `DraftCard.tsx` y sus estilos CSS se mantienen en el código pero **no se renderiza** — el `useChat.ts` ya no agrega mensajes tipo `'draft'`. Puede eliminarse en cleanup posterior.

> Nota: Los estilos CSS del DraftCard se agregaron en esta sesión y están en `index.css` — limpiar en próxima sesión de cleanup.
