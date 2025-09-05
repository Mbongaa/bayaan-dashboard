import { EventBus, globalEventBus } from './EventBus';
import { WebGLContextService } from './WebGLContextService';
import { WebRTCService } from './WebRTCService';

/**
 * Foundation Services Container
 * 
 * Centralizes all persistent services that must survive React re-renders.
 * This is the core of the service layer architecture that isolates
 * foundation resources from UI components.
 */
export class FoundationServices {
  public readonly eventBus: EventBus;
  public readonly webgl: WebGLContextService;
  public readonly webrtc: WebRTCService;

  private static _instance: FoundationServices | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.eventBus = globalEventBus;
    this.webgl = new WebGLContextService(this.eventBus);
    this.webrtc = new WebRTCService(this.eventBus);
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): FoundationServices {
    if (!FoundationServices._instance) {
      FoundationServices._instance = new FoundationServices();
    }
    return FoundationServices._instance;
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[FoundationServices] Already initialized');
      return;
    }

    try {
      console.log('[FoundationServices] Initializing foundation services...');
      
      // WebGL service is automatically initialized in constructor
      // Add any additional service initialization here

      this.isInitialized = true;
      
      this.eventBus.emit('foundation:initialized');
      console.log('[FoundationServices] Foundation services initialized successfully');
      
    } catch (error) {
      console.error('[FoundationServices] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Shutdown all services and clean up resources
   */
  shutdown(): void {
    console.log('[FoundationServices] Shutting down foundation services...');
    
    this.webrtc.shutdown();
    this.webgl.shutdown();
    this.eventBus.clear();
    
    this.isInitialized = false;
    FoundationServices._instance = null;
    
    console.log('[FoundationServices] Foundation services shutdown complete');
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    isInitialized: boolean;
    webgl: ReturnType<WebGLContextService['getStats']>;
    webrtc: {
      status: ReturnType<WebRTCService['getStatus']>;
      hasSession: boolean;
    };
    eventBus: {
      totalListeners: number;
    };
  } {
    return {
      isInitialized: this.isInitialized,
      webgl: this.webgl.getStats(),
      webrtc: {
        status: this.webrtc.getStatus(),
        hasSession: !!this.webrtc.getSession()
      },
      eventBus: {
        totalListeners: this.eventBus.getListenerCount()
      }
    };
  }
}

// Export singleton instance for convenience
export const foundationServices = FoundationServices.getInstance();