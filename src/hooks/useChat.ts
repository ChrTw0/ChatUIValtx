import { useRef, useState } from 'react';
import { useMessages, useQuickReplies } from '@chatui/core';
import { sendMessage } from '../api/chat';
import { uploadFile } from '../api/files';
import { useStream } from './useStream';
import { useHitl } from './useHitl';
import { getOrCreateSessionId } from '../utils/session';
import { EJECUTIVO_ID } from '../constants';
import type { SSEEvent, HitlData, DraftData } from '../types/api';
import type { ThinkingFase } from '../types/ui';
import type { QuickReplyItemProps } from '@chatui/core';

export function useChat(onDraft?: (draft: DraftData) => void) {
  const { messages, appendMsg, updateMsg } = useMessages([]);
  const { quickReplies, replace: setQuickReplies, visible: qrVisible, setVisible: setQrVisible } = useQuickReplies([]);

  const [thinking, setThinking]       = useState(false);
  const [pendingFiles, setPending]     = useState<string[]>([]);
  const [thinkingFase, setThinkingFase] = useState<ThinkingFase>({ tipo: 'idle' });

  // ref para el guard interno (evita closure stale en el handler SSE)
  const thinkingRef = useRef(false);
  const sessionId   = useRef(getOrCreateSessionId());
  const { connect } = useStream();
  const { hitl, activar: activarHitl, resolver: resolverHitl } = useHitl();

  function stopThinking() {
    thinkingRef.current = false;
    setThinking(false);
    setThinkingFase({ tipo: 'idle' });
  }

  async function enviar(texto: string, hitlDecision?: string) {
    if (thinkingRef.current) return;
    const t = texto.trim();
    if (!t && !hitlDecision && !pendingFiles.length) return;

    resolverHitl();
    setQuickReplies([]);
    setQrVisible(false);
    thinkingRef.current = true;
    setThinking(true);
    setThinkingFase({ tipo: 'skeleton' });

    appendMsg({ type: 'text', content: { text: t || hitlDecision || '' }, position: 'right' });
    const botId = appendMsg({ type: 'text', content: { text: '' }, position: 'left' });
    let botMsgSet = false;
    let prevTraceId: string | undefined;

    try {
      await sendMessage({
        texto: t,
        ejecutivo_id: EJECUTIVO_ID,
        session_id: sessionId.current,
        file_ids: pendingFiles.length ? [...pendingFiles] : undefined,
        respuesta_hitl: hitlDecision ? { decision: hitlDecision } : undefined,
      });
      setPending([]);
    } catch {
      updateMsg(botId, { type: 'text', content: { text: 'Error al enviar.' }, position: 'left' });
      stopThinking();
      return;
    }

    let agente: string | null = null;

    connect(sessionId.current, (e: SSEEvent) => {
      if (e.tipo === 'pensando') {
        setThinkingFase({ tipo: 'typing' });
      }

      if (e.tipo === 'agente_llamado' && e.agente) {
        agente = e.agente;
        setThinkingFase({ tipo: 'pill', agente: e.agente });

        // marca la traza anterior como done y agrega la nueva
        if (prevTraceId) {
          updateMsg(prevTraceId, {
            type: 'trace',
            content: { agente: agente ?? '', done: true },
            position: 'left',
          });
        }
        prevTraceId = appendMsg({
          type: 'trace',
          content: { agente: e.agente, done: false },
          position: 'left',
        });
      }

      if (e.tipo === 'respuesta' && e.mensaje) {
        if (prevTraceId) {
          updateMsg(prevTraceId, {
            type: 'trace',
            content: { agente: agente ?? '', done: true },
            position: 'left',
          });
        }
        updateMsg(botId, { type: 'text', content: { text: e.mensaje, agente }, position: 'left' });
        botMsgSet = true;
        stopThinking();
      }

      if (e.tipo === 'error' && e.mensaje) {
        updateMsg(botId, { type: 'text', content: { text: e.mensaje }, position: 'left' });
        stopThinking();
      }

      if (e.tipo === 'hitl' && e.datos) {
        const d = e.datos as HitlData;

        if (d.hitl_tipo === 'draft_listo' && onDraft) {
          const draft = d.contexto as unknown as DraftData;
          onDraft(draft);
          updateMsg(botId, { type: 'draft', content: { draft }, position: 'left' });
          stopThinking();
          return;
        }

        if (prevTraceId) {
          updateMsg(prevTraceId, {
            type: 'trace',
            content: { agente: agente ?? '', done: true },
            position: 'left',
          });
        }

        // HITL inline: el botId se convierte en burbuja con cápsulas embebidas
        if (!botMsgSet) {
          updateMsg(botId, {
            type: 'hitl',
            content: { text: e.mensaje ?? d.hitl_tipo, opciones: d.opciones, hitl_tipo: d.hitl_tipo },
            position: 'left',
          });
        }
        stopThinking();

        // QuickReplies como fallback (oculto)
        activarHitl(e.mensaje ?? d.hitl_tipo, d.opciones, d.contexto);
        setQuickReplies(d.opciones.map((op, i) => ({ name: op, code: String(i + 1) } as QuickReplyItemProps)));
      }

      if (e.tipo === 'fin') {
        stopThinking();
      }
    }, stopThinking);
  }

  async function adjuntar(file: File) {
    try {
      const id = await uploadFile(file, EJECUTIVO_ID);
      setPending(prev => [...prev, id]);
      appendMsg({ type: 'text', content: { text: file.name }, position: 'right' });
    } catch {
      appendMsg({ type: 'text', content: { text: `No se pudo subir ${file.name}` }, position: 'right' });
    }
  }

  return {
    messages,
    thinking,
    thinkingFase,
    quickReplies,
    qrVisible,
    hitl,
    enviar,
    adjuntar,
  };
}
