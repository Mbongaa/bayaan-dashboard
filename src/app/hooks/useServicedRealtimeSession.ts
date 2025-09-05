import { useCallback, useRef } from 'react';
import { RealtimeAgent } from '@openai/agents/realtime';
import { useWebRTCService } from './useWebRTCService';
import { useEvent } from '../contexts/EventContext';
import { useHandleSessionHistory } from './useHandleSessionHistory';
import { SessionStatus } from '../types';

export interface ServicedRealtimeSessionCallbacks {
  onConnectionChange?: (status: SessionStatus) => void;
  onAgentHandoff?: (agentName: string) => void;
}

export interface ServicedConnectOptions {
  getEphemeralKey: () => Promise<string>;
  initialAgents: RealtimeAgent[];
  audioElement?: HTMLAudioElement;
  extraContext?: Record<string, any>;
  outputGuardrails?: any[];
  codec?: string;
}

/**
 * Service-based Realtime Session Hook
 * 
 * This version uses the WebRTC Service instead of managing sessions directly.
 * Provides the same interface as useRealtimeSession but with better resource management.
 */
export function useServicedRealtimeSession(callbacks: ServicedRealtimeSessionCallbacks = {}) {
  const { logClientEvent, logServerEvent } = useEvent();
  const historyHandlers = useHandleSessionHistory().current;

  // Handle transport events from the service
  const handleTransportEvent = useCallback((event: any) => {
    switch (event.type) {
      case "conversation.item.input_audio_transcription.completed": {
        historyHandlers.handleTranscriptionCompleted(event);
        break;
      }
      case "response.audio_transcript.done": {
        historyHandlers.handleTranscriptionCompleted(event);
        break;
      }
      case "response.audio_transcript.delta": {
        historyHandlers.handleTranscriptionDelta(event);
        break;
      }
      default: {
        logServerEvent(event);
        break;
      } 
    }
  }, [historyHandlers, logServerEvent]);

  // Handle agent handoffs from the service
  const handleAgentHandoff = useCallback((agentName: string) => {
    callbacks.onAgentHandoff?.(agentName);
  }, [callbacks.onAgentHandoff]);

  // Handle status changes from the service
  const handleStatusChange = useCallback((status: SessionStatus) => {
    logClientEvent({}, status);
    callbacks.onConnectionChange?.(status);
  }, [callbacks.onConnectionChange, logClientEvent]);

  // Handle errors from the service
  const handleError = useCallback((error: any) => {
    logServerEvent({
      type: "error",
      message: error.message || error,
    });
  }, [logServerEvent]);

  // Use WebRTC service with callbacks
  const webrtcService = useWebRTCService({
    onStatusChange: handleStatusChange,
    onAgentHandoff: handleAgentHandoff,
    onTransportEvent: handleTransportEvent,
    onError: handleError
  });

  const codecParamRef = useRef<string>(
    (typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('codec') ?? 'opus')
      : 'opus')
      .toLowerCase(),
  );

  // Connect wrapper that matches original interface
  const connect = useCallback(async ({
    getEphemeralKey,
    initialAgents,
    audioElement,
    extraContext,
    outputGuardrails,
  }: ServicedConnectOptions) => {
    if (webrtcService.isConnected) {
      console.warn('[useServicedRealtimeSession] Already connected');
      return;
    }

    try {
      await webrtcService.connect({
        getEphemeralKey,
        initialAgents,
        audioElement,
        extraContext,
        outputGuardrails,
        codec: codecParamRef.current
      });
    } catch (error) {
      console.error('[useServicedRealtimeSession] Connect failed:', error);
      throw error;
    }
  }, [webrtcService]);

  // Set up session event handlers when session becomes available
  const sessionRef = useRef(webrtcService.session);
  sessionRef.current = webrtcService.session;

  // Set up additional session event handlers
  const setupSessionEventHandlers = useCallback(() => {
    if (!sessionRef.current) return;

    const session = sessionRef.current;

    // Remove existing listeners if any
    session.removeAllListeners();

    // Add history event handlers
    session.on("agent_handoff", (item: any) => {
      const history = item.context.history;
      const lastMessage = history[history.length - 1];
      const agentName = lastMessage.name.split("transfer_to_")[1];
      handleAgentHandoff(agentName);
    });

    session.on("agent_tool_start", historyHandlers.handleAgentToolStart);
    session.on("agent_tool_end", historyHandlers.handleAgentToolEnd);
    session.on("history_updated", historyHandlers.handleHistoryUpdated);
    session.on("history_added", historyHandlers.handleHistoryAdded);
    session.on("guardrail_tripped", historyHandlers.handleGuardrailTripped);

    // Transport events
    session.on("transport_event", handleTransportEvent);

    // Error handling
    session.on("error", (...args: any[]) => {
      handleError({
        type: "error",
        message: args[0],
      });
    });

    console.log('[useServicedRealtimeSession] Session event handlers set up');
  }, [historyHandlers, handleAgentHandoff, handleTransportEvent, handleError]);

  // Set up session handlers when session changes
  useCallback(() => {
    if (webrtcService.session && webrtcService.isConnected) {
      setupSessionEventHandlers();
    }
  }, [webrtcService.session, webrtcService.isConnected, setupSessionEventHandlers])();

  return {
    status: webrtcService.status,
    connect,
    disconnect: webrtcService.disconnect,
    sendUserText: webrtcService.sendUserText,
    sendEvent: webrtcService.sendEvent,
    mute: webrtcService.mute,
    pushToTalkStart: webrtcService.pushToTalkStart,
    pushToTalkStop: webrtcService.pushToTalkStop,
    interrupt: webrtcService.interrupt,
    sessionRef
  } as const;
}