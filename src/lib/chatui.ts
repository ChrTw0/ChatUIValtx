// Shim para @chatui/core — resuelve el problema de CJS default export con Vite/esbuild
// El módulo expone sus componentes como named exports en CJS, pero esbuild los envuelve
// de forma inconsistente. Importamos todo como namespace y extraemos manualmente.
import * as mod from '@chatui/core';

type AnyFn = (...args: any[]) => any;
type Mod = typeof mod & { default?: typeof mod };

const m = mod as Mod;

export const Chat          = (m.default ?? m) as typeof mod['default'];
export const Bubble        = (m.Bubble        ?? (m.default as any)?.Bubble)        as AnyFn;
export const useMessages   = (m.useMessages   ?? (m.default as any)?.useMessages)   as typeof mod.useMessages;
export const useQuickReplies = (m.useQuickReplies ?? (m.default as any)?.useQuickReplies) as typeof mod.useQuickReplies;
