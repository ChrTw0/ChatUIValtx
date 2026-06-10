import { useRef, useState } from 'react';
import { useMessages, useQuickReplies } from '@chatui/core';
import { sendMessage } from '../api/chat';
import { uploadFile } from '../api/files';
import { useStream } from './useStream';
import { useHitl } from './useHitl';
import { getOrCreateSessionId } from '../utils/session';
import { EJECUTIVO_ID } from '../constants';
import type { SSEEvent, HitlData, DraftData } from '../types/api';
import type { QuickReplyItemProps } from '@chatui/core';

export function useChat(onDraft?: (draft: DraftData) => void) {
  const { messages, appendMsg, updateMsg } = useMessages([]);
  const { quickReplies, replace: setQuickReplies, visible: qrVisible, setVisible: setQrVisible } = useQuickReplies([]);
  const [typing, setTyping]         = useState(false);
  const [pendingFiles, setPending]  = useState<string[]>([]);

  const sessionId  = useRef(getOrCreateSessionId());
  const thinking   = useRef(false);
  const { connect }                                             = useStream();
  const { hitl, activar: activarHitl, resolver: resolverHitl } = useHitl();

  async function enviar(texto: string, hitlDecision?: string) {
    if (thinking.current) return;
    const t = texto.trim();
    if (!t && !hitlDecision && !pendingFiles.length) return;

    resolverHitl();
    setQuickReplies([]);
    setQrVisible(false);
    thinking.current = true;
    setTyping(true);

    appendMsg({ type: 'text', content: { text: t || hitlDecision || '' }, position: 'right' });
    const botId = appendMsg({ type: 'text', content: { text: '' }, position: 'left' });

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
      thinking.current = false;
      setTyping(false);
      return;
    }

    let agente: string | null = null;

    connect(sessionId.current, (e: SSEEvent) => {
      if (e.tipo === 'agente_llamado') {
        agente = e.agente ?? null;
      }
      if (e.tipo === 'respuesta' && e.mensaje) {
        updateMsg(botId, { type: 'text', content: { text: e.mensaje, agente }, position: 'left' });
        setTyping(false);
      }
      if (e.tipo === 'error' && e.mensaje) {
        updateMsg(botId, { type: 'text', content: { text: e.mensaje }, position: 'left' });
        setTyping(false);
      }
      if (e.tipo === 'hitl' && e.datos) {
        const d = e.datos as HitlData;
        // Draft generado por A2 — mostrar card en chat y notificar al panel
        if (d.hitl_tipo === 'draft_listo' && onDraft) {
          const draft = d.contexto as unknown as DraftData;
          onDraft(draft);
          updateMsg(botId, { type: 'draft', content: { draft }, position: 'left' });
          setTyping(false);
          return;
        }
        activarHitl(e.mensaje ?? d.hitl_tipo, d.opciones, d.contexto);
        setQuickReplies(d.opciones.map((op, i) => ({ name: op, code: String(i + 1) } as QuickReplyItemProps)));
        setQrVisible(true);
      }
      if (e.tipo === 'fin') {
        thinking.current = false;
        setTyping(false);
      }
    }, () => { thinking.current = false; setTyping(false); });
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
    typing,
    quickReplies,
    qrVisible,
    hitl,
    enviar,
    adjuntar,
    isThinking: thinking,
  };
}
