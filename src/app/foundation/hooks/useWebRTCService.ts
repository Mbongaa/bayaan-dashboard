import { useEffect, useRef, useState, useCallback } from 'react';
import { foundationServices } from '../services/FoundationServices';
import { 
  WebRTCConnectOptions, 
  WebRTCServiceCallbacks, 
  WebRTCServiceEvents 
} from '../services/WebRTCService';
import { SessionStatus } from '../../shared/types/types';
import { RealtimeSession } from '@openai/agents/realtime';

export interface UseWebRTCServiceOptions {
  /**
   * Auto-setup callbacks for common events
   */
  autoSetupCallbacks?: boolean;
  
  /**
   * Callback for status changes
   */
  onStatusChange?: (status: SessionStatus) => void;
  
  /**
   * Callback for agent handoffs
   */
  onAgentHandoff?: (agentName: string) => void;
  
  /**
   * Callback for transport events
   */
  onTransportEvent?: (event: any) => void;
  
  /**
   * Callback for errors
   */
  onError?: (error: any) => void;
}

export interface UseWebRTCServiceReturn {
  /**
   * Current session status
   */
  status: SessionStatus;
  
  /**
   * Current session reference
   */
  session: RealtimeSession | null;
  
  /**
   * Connect to WebRTC session
   */
  connect: (options: WebRTCConnectOptions) => Promise<void>;
  
  /**
   * Disconnect from WebRTC session
   */
  disconnect: () => void;
  
  /**
   * Send user text message
   */
  sendUserText: (text: string) => void;
  
  /**
   * Send event to session
   */
  sendEvent: (event: any) => void;
  
  /**
   * Interrupt current session
   */
  interrupt: () => void;
  
  /**
   * Mute/unmute session
   */
  mute: (muted: boolean) => void;
  
  /**
   * Push-to-talk start
   */
  pushToTalkStart: () => void;
  
  /**
   * Push-to-talk stop
   */
  pushToTalkStop: () => void;
  
  /**
   * Check if session is connected
   */
  isConnected: boolean;
}

/**
 * React hook for integrating with WebRTC Service
 * 
 * Provides a clean interface for React components to use persistent
 * WebRTC sessions without owning them directly.
 */
export function useWebRTCService(options: UseWebRTCServiceOptions = {}): UseWebRTCServiceReturn {
  const {
    autoSetupCallbacks = true,
    onStatusChange,
    onAgentHandoff,
    onTransportEvent,
    onError
  } = options;

  const [status, setStatus] = useState<SessionStatus>(foundationServices.webrtc.getStatus());
  const [session, setSession] = useState<RealtimeSession | null>(foundationServices.webrtc.getSession());
  
  const callbacksRef = useRef<WebRTCServiceCallbacks>({});
  const unsubscribeCallbacksRef = useRef<(() => void) | null>(null);
  const eventUnsubscribersRef = useRef<(() => void)[]>([]);

  // Set up callbacks with the service
  useEffect(() => {
    if (!autoSetupCallbacks) return;

    // Update callbacks reference
    callbacksRef.current = {
      onConnectionChange: (newStatus: SessionStatus) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      },
      onAgentHandoff: (agentName: string) => {
        onAgentHandoff?.(agentName);
      },
      onTransportEvent: (event: any) => {
        onTransportEvent?.(event);
      },
      onError: (error: any) => {
        onError?.(error);
      }
    };

    // Register callbacks with service
    const unsubscribe = foundationServices.webrtc.addCallbacks(callbacksRef.current);
    unsubscribeCallbacksRef.current = unsubscribe;

    return () => {
      if (unsubscribeCallbacksRef.current) {
        unsubscribeCallbacksRef.current();
        unsubscribeCallbacksRef.current = null;
      }
    };
  }, [autoSetupCallbacks, onStatusChange, onAgentHandoff, onTransportEvent, onError]);

  // Set up event bus listeners
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Listen for session connected events
    const unsubConnected = foundationServices.eventBus.on<WebRTCServiceEvents['session:connected']>(
      'session:connected', 
      ({ session: newSession }) => {
        setSession(newSession);
      }
    );
    unsubscribers.push(unsubConnected);

    // Listen for session disconnected events
    const unsubDisconnected = foundationServices.eventBus.on<WebRTCServiceEvents['session:disconnected']>(
      'session:disconnected', 
      () => {
        setSession(null);
      }
    );
    unsubscribers.push(unsubDisconnected);

    // Listen for status changes
    const unsubStatus = foundationServices.eventBus.on<WebRTCServiceEvents['session:status_changed']>(
      'session:status_changed',
      ({ status: newStatus }) => {
        setStatus(newStatus);
      }
    );
    unsubscribers.push(unsubStatus);

    eventUnsubscribersRef.current = unsubscribers;

    return () => {
      eventUnsubscribersRef.current.forEach(unsub => unsub());
      eventUnsubscribersRef.current = [];
    };
  }, []);

  // Service method wrappers
  const connect = useCallback(async (connectOptions: WebRTCConnectOptions): Promise<void> => {
    try {
      await foundationServices.webrtc.connect(connectOptions);
    } catch (error) {
      console.error('[useWebRTCService] Connect failed:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    foundationServices.webrtc.disconnect();
  }, []);

  const sendUserText = useCallback((text: string) => {
    foundationServices.webrtc.sendUserText(text);
  }, []);

  const sendEvent = useCallback((event: any) => {
    foundationServices.webrtc.sendEvent(event);
  }, []);

  const interrupt = useCallback(() => {
    foundationServices.webrtc.interrupt();
  }, []);

  const mute = useCallback((muted: boolean) => {
    foundationServices.webrtc.mute(muted);
  }, []);

  const pushToTalkStart = useCallback(() => {
    foundationServices.webrtc.pushToTalkStart();
  }, []);

  const pushToTalkStop = useCallback(() => {
    foundationServices.webrtc.pushToTalkStop();
  }, []);

  return {
    status,
    session,
    connect,
    disconnect,
    sendUserText,
    sendEvent,
    interrupt,
    mute,
    pushToTalkStart,
    pushToTalkStop,
    isConnected: status === 'CONNECTED'
  };
}