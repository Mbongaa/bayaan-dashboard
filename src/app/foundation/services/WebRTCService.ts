import {
  RealtimeSession,
  RealtimeAgent,
  OpenAIRealtimeWebRTC,
} from '@openai/agents/realtime';
import { audioFormatForCodec, applyCodecPreferences } from '../../shared/lib/codecUtils';
import { SessionStatus } from '../../shared/types/types';
import { EventBus } from './EventBus';

/**
 * WebRTC Service Events
 */
export interface WebRTCServiceEvents {
  'session:status_changed': { status: SessionStatus };
  'session:agent_handoff': { agentName: string };
  'session:transport_event': { event: any };
  'session:error': { error: any };
  'session:connected': { session: RealtimeSession };
  'session:disconnected': Record<string, never>;
}

/**
 * WebRTC Connect Options
 */
export interface WebRTCConnectOptions {
  getEphemeralKey: () => Promise<string>;
  initialAgents: RealtimeAgent[];
  audioElement?: HTMLAudioElement;
  extraContext?: Record<string, any>;
  outputGuardrails?: any[];
  codec?: string;
}

/**
 * WebRTC Service Callbacks
 */
export interface WebRTCServiceCallbacks {
  onConnectionChange?: (status: SessionStatus) => void;
  onAgentHandoff?: (agentName: string) => void;
  onTransportEvent?: (event: any) => void;
  onError?: (error: any) => void;
}

/**
 * WebRTC Session Service
 * 
 * Manages WebRTC sessions independently of React component lifecycles.
 * Provides persistent connection management that survives component re-renders.
 */
export class WebRTCService {
  private session: RealtimeSession | null = null;
  private status: SessionStatus = 'DISCONNECTED';
  private eventBus: EventBus;
  private callbacks: Set<WebRTCServiceCallbacks> = new Set();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Get current session status
   */
  getStatus(): SessionStatus {
    return this.status;
  }

  /**
   * Get current session reference
   */
  getSession(): RealtimeSession | null {
    return this.session;
  }

  /**
   * Add callbacks for session events
   */
  addCallbacks(callbacks: WebRTCServiceCallbacks): () => void {
    this.callbacks.add(callbacks);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callbacks);
    };
  }

  /**
   * Connect to WebRTC session
   */
  async connect(options: WebRTCConnectOptions): Promise<void> {
    if (this.session) {
      console.warn('[WebRTCService] Already connected');
      return;
    }

    try {
      this.updateStatus('CONNECTING');

      const ek = await options.getEphemeralKey();
      const rootAgent = options.initialAgents[0];

      // Get codec configuration
      const codecParam = options.codec || 'opus';
      const audioFormat = audioFormatForCodec(codecParam);

      // Create session
      this.session = new RealtimeSession(rootAgent, {
        transport: new OpenAIRealtimeWebRTC({
          audioElement: options.audioElement,
          changePeerConnection: async (pc: RTCPeerConnection) => {
            applyCodecPreferences(pc, codecParam);
            return pc;
          },
        }),
        model: 'gpt-realtime',
        config: {
          inputAudioFormat: audioFormat,
          outputAudioFormat: audioFormat,
          inputAudioTranscription: {
            model: 'gpt-4o-mini-transcribe',
          },
        },
        outputGuardrails: options.outputGuardrails ?? [],
        context: options.extraContext ?? {},
      });

      // Set up event handlers
      this.setupSessionEventHandlers();

      // Connect
      await this.session.connect({ apiKey: ek });
      
      this.updateStatus('CONNECTED');
      this.eventBus.emit<WebRTCServiceEvents['session:connected']>('session:connected', {
        session: this.session
      });

      console.log('[WebRTCService] Connected successfully');

    } catch (error) {
      console.error('[WebRTCService] Connection failed:', error);
      this.updateStatus('DISCONNECTED');
      this.session = null;
      
      this.eventBus.emit<WebRTCServiceEvents['session:error']>('session:error', { error });
      this.notifyCallbacks('onError', error);
      
      throw error;
    }
  }

  /**
   * Disconnect from WebRTC session
   */
  disconnect(): void {
    if (!this.session) {
      console.warn('[WebRTCService] No session to disconnect');
      return;
    }

    try {
      this.session.close();
      this.session = null;
      
      this.updateStatus('DISCONNECTED');
      this.eventBus.emit<WebRTCServiceEvents['session:disconnected']>('session:disconnected', {} as Record<string, never>);
      
      console.log('[WebRTCService] Disconnected successfully');
      
    } catch (error) {
      console.error('[WebRTCService] Disconnect failed:', error);
      this.eventBus.emit<WebRTCServiceEvents['session:error']>('session:error', { error });
      this.notifyCallbacks('onError', error);
    }
  }

  /**
   * Send user text message
   */
  sendUserText(text: string): void {
    if (!this.session) {
      throw new Error('[WebRTCService] No active session');
    }
    
    this.session.sendMessage(text);
  }

  /**
   * Send event to session
   */
  sendEvent(event: any): void {
    if (!this.session) {
      throw new Error('[WebRTCService] No active session');
    }
    
    this.session.transport.sendEvent(event);
  }

  /**
   * Interrupt current session
   */
  interrupt(): void {
    if (!this.session) {
      console.warn('[WebRTCService] No session to interrupt');
      return;
    }
    
    this.session.interrupt();
  }

  /**
   * Mute/unmute session
   */
  mute(muted: boolean): void {
    if (!this.session) {
      console.warn('[WebRTCService] No session to mute');
      return;
    }
    
    this.session.mute(muted);
  }

  /**
   * Push-to-talk start
   */
  pushToTalkStart(): void {
    if (!this.session) {
      console.warn('[WebRTCService] No session for PTT');
      return;
    }
    
    this.session.transport.sendEvent({ type: 'input_audio_buffer.clear' } as any);
  }

  /**
   * Push-to-talk stop
   */
  pushToTalkStop(): void {
    if (!this.session) {
      console.warn('[WebRTCService] No session for PTT');
      return;
    }
    
    this.session.transport.sendEvent({ type: 'input_audio_buffer.commit' } as any);
    this.session.transport.sendEvent({ type: 'response.create' } as any);
  }

  /**
   * Clean up service resources
   */
  shutdown(): void {
    if (this.session) {
      this.disconnect();
    }
    
    this.callbacks.clear();
    console.log('[WebRTCService] Service shutdown complete');
  }

  /**
   * Update session status and notify listeners
   */
  private updateStatus(newStatus: SessionStatus): void {
    const oldStatus = this.status;
    this.status = newStatus;
    
    if (oldStatus !== newStatus) {
      this.eventBus.emit<WebRTCServiceEvents['session:status_changed']>('session:status_changed', {
        status: newStatus
      });
      
      this.notifyCallbacks('onConnectionChange', newStatus);
      
      console.log(`[WebRTCService] Status changed: ${oldStatus} -> ${newStatus}`);
    }
  }

  /**
   * Set up event handlers for the session
   */
  private setupSessionEventHandlers(): void {
    if (!this.session) return;

    // Error handling
    this.session.on('error', (...args: any[]) => {
      const error = {
        type: 'error',
        message: args[0],
      };
      
      this.eventBus.emit<WebRTCServiceEvents['session:error']>('session:error', { error });
      this.notifyCallbacks('onError', error);
    });

    // Agent handoff
    this.session.on('agent_handoff', (item: any) => {
      const history = item.context.history;
      const lastMessage = history[history.length - 1];
      const agentName = lastMessage.name.split("transfer_to_")[1];
      
      this.eventBus.emit<WebRTCServiceEvents['session:agent_handoff']>('session:agent_handoff', {
        agentName
      });
      
      this.notifyCallbacks('onAgentHandoff', agentName);
    });

    // Transport events
    this.session.on('transport_event', (event: any) => {
      this.eventBus.emit<WebRTCServiceEvents['session:transport_event']>('session:transport_event', {
        event
      });
      
      this.notifyCallbacks('onTransportEvent', event);
    });

    // Forward other session events through the event bus
    const eventTypes = [
      'agent_tool_start',
      'agent_tool_end', 
      'history_updated',
      'history_added',
      'guardrail_tripped'
    ];

    eventTypes.forEach(eventType => {
      this.session!.on(eventType as any, (data: any) => {
        this.eventBus.emit(`session:${eventType}`, data);
      });
    });
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks(method: keyof WebRTCServiceCallbacks, ...args: any[]): void {
    this.callbacks.forEach(callback => {
      const fn = callback[method];
      if (fn) {
        try {
          (fn as any)(...args);
        } catch (error) {
          console.error(`[WebRTCService] Callback error for ${method}:`, error);
        }
      }
    });
  }
}