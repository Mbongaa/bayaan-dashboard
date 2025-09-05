import { EventBus } from './EventBus';

/**
 * WebGL Context Configuration
 */
export interface WebGLContextConfig {
  alpha?: boolean;
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  antialias?: boolean;
}

/**
 * WebGL Context State
 */
export interface WebGLContextState {
  id: string;
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  isLost: boolean;
  mountedElement: HTMLElement | null;
  config: WebGLContextConfig;
  createdAt: number;
  lastUsed: number;
}

/**
 * WebGL Context Service Events
 */
export interface WebGLServiceEvents {
  'context:created': { contextId: string };
  'context:destroyed': { contextId: string };
  'context:lost': { contextId: string };
  'context:restored': { contextId: string };
  'context:mounted': { contextId: string; element: HTMLElement };
  'context:unmounted': { contextId: string };
}

/**
 * Centralized WebGL Context Service
 * 
 * Manages WebGL contexts independently of React component lifecycles.
 * Provides persistent contexts that survive component re-renders and unmounts.
 */
export class WebGLContextService {
  private contexts: Map<string, WebGLContextState> = new Map();
  private eventBus: EventBus;
  private cleanupInterval: number | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.startCleanupTimer();
  }

  /**
   * Get or create a WebGL context
   */
  getContext(
    contextId: string, 
    config: WebGLContextConfig = {}
  ): WebGLContextState | null {
    // Return existing context if available
    const existing = this.contexts.get(contextId);
    if (existing && !existing.isLost) {
      existing.lastUsed = Date.now();
      return existing;
    }

    // Create new context
    return this.createContext(contextId, config);
  }

  /**
   * Mount a context to a DOM element
   */
  mountContext(contextId: string, element: HTMLElement): boolean {
    const context = this.contexts.get(contextId);
    if (!context || context.isLost) {
      console.error(`Cannot mount context "${contextId}": context not found or lost`);
      return false;
    }

    // Unmount from previous element if needed
    if (context.mountedElement && context.mountedElement !== element) {
      this.unmountContext(contextId);
    }

    // Mount to new element
    context.mountedElement = element;
    element.innerHTML = ''; // Clear existing content
    element.appendChild(context.canvas);

    this.eventBus.emit<WebGLServiceEvents['context:mounted']>('context:mounted', {
      contextId,
      element
    });

    return true;
  }

  /**
   * Unmount a context from its DOM element
   */
  unmountContext(contextId: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context || !context.mountedElement) {
      return false;
    }

    // Remove canvas from DOM
    if (context.canvas.parentNode) {
      context.canvas.parentNode.removeChild(context.canvas);
    }

    context.mountedElement = null;

    this.eventBus.emit<WebGLServiceEvents['context:unmounted']>('context:unmounted', {
      contextId
    });

    return true;
  }

  /**
   * Destroy a context and clean up resources
   */
  destroyContext(contextId: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    // Unmount first
    this.unmountContext(contextId);

    // Lose WebGL context to free GPU resources
    const loseContext = context.gl.getExtension('WEBGL_lose_context');
    if (loseContext) {
      loseContext.loseContext();
    }

    // Remove from tracking
    this.contexts.delete(contextId);

    this.eventBus.emit<WebGLServiceEvents['context:destroyed']>('context:destroyed', {
      contextId
    });

    return true;
  }

  /**
   * Get all active context IDs
   */
  getActiveContextIds(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * Get context statistics for debugging
   */
  getStats(): {
    totalContexts: number;
    mountedContexts: number;
    lostContexts: number;
    oldestContext: number | null;
    newestContext: number | null;
  } {
    const contexts = Array.from(this.contexts.values());
    const now = Date.now();
    
    return {
      totalContexts: contexts.length,
      mountedContexts: contexts.filter(c => c.mountedElement).length,
      lostContexts: contexts.filter(c => c.isLost).length,
      oldestContext: contexts.length > 0 ? Math.min(...contexts.map(c => now - c.createdAt)) : null,
      newestContext: contexts.length > 0 ? Math.max(...contexts.map(c => now - c.createdAt)) : null
    };
  }

  /**
   * Clean up unused contexts (garbage collection)
   */
  cleanup(maxAge: number = 5 * 60 * 1000): void { // 5 minutes default
    const now = Date.now();
    const contextsToDestroy: string[] = [];

    this.contexts.forEach((context, contextId) => {
      // Destroy contexts that are lost or too old and unmounted
      if (context.isLost || (!context.mountedElement && (now - context.lastUsed) > maxAge)) {
        contextsToDestroy.push(contextId);
      }
    });

    contextsToDestroy.forEach(contextId => {
      console.log(`[WebGLContextService] Cleaning up unused context: ${contextId}`);
      this.destroyContext(contextId);
    });
  }

  /**
   * Shutdown service and clean up all contexts
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Destroy all contexts
    const contextIds = Array.from(this.contexts.keys());
    contextIds.forEach(contextId => this.destroyContext(contextId));
    
    console.log('[WebGLContextService] Service shutdown complete');
  }

  /**
   * Create a new WebGL context
   */
  private createContext(
    contextId: string, 
    config: WebGLContextConfig
  ): WebGLContextState | null {
    try {
      const canvas = document.createElement('canvas');
      
      // Set up WebGL context options
      const contextOptions = {
        alpha: config.alpha ?? true,
        premultipliedAlpha: config.premultipliedAlpha ?? false,
        preserveDrawingBuffer: config.preserveDrawingBuffer ?? false,
        powerPreference: config.powerPreference ?? 'default',
        antialias: config.antialias ?? true
      };

      // Try WebGL2 first, fallback to WebGL1
      const gl = (canvas.getContext('webgl2', contextOptions) || 
                  canvas.getContext('webgl', contextOptions)) as WebGL2RenderingContext | WebGLRenderingContext | null;

      if (!gl) {
        console.error(`[WebGLContextService] Failed to create WebGL context: ${contextId}`);
        return null;
      }

      const contextState: WebGLContextState = {
        id: contextId,
        canvas,
        gl,
        isLost: false,
        mountedElement: null,
        config,
        createdAt: Date.now(),
        lastUsed: Date.now()
      };

      // Set up context loss/restore handlers
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        contextState.isLost = true;
        console.warn(`[WebGLContextService] Context lost: ${contextId}`);
        
        this.eventBus.emit<WebGLServiceEvents['context:lost']>('context:lost', {
          contextId
        });
      });

      canvas.addEventListener('webglcontextrestored', () => {
        contextState.isLost = false;
        console.log(`[WebGLContextService] Context restored: ${contextId}`);
        
        this.eventBus.emit<WebGLServiceEvents['context:restored']>('context:restored', {
          contextId
        });
      });

      // Store context
      this.contexts.set(contextId, contextState);

      this.eventBus.emit<WebGLServiceEvents['context:created']>('context:created', {
        contextId
      });

      console.log(`[WebGLContextService] Created context: ${contextId}`);
      return contextState;

    } catch (error) {
      console.error(`[WebGLContextService] Error creating context "${contextId}":`, error);
      return null;
    }
  }

  /**
   * Start periodic cleanup of unused contexts
   */
  private startCleanupTimer(): void {
    if (typeof window !== 'undefined') {
      this.cleanupInterval = window.setInterval(() => {
        this.cleanup();
      }, 60000); // Clean up every minute
    }
  }
}