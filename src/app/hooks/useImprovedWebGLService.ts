import { useEffect, useRef, useCallback, useState } from 'react';
import { foundationServices } from '../services/FoundationServices';
import { WebGLContextConfig, WebGLContextState } from '../services/WebGLContextService';

export interface UseImprovedWebGLServiceOptions extends WebGLContextConfig {
  /**
   * Auto-mount the context when container ref is available
   */
  autoMount?: boolean;
  
  /**
   * Auto-unmount when component unmounts
   */
  autoUnmount?: boolean;

  /**
   * Canvas sizing mode
   */
  canvasSizing?: 'container' | 'viewport' | 'fixed';

  /**
   * Fixed dimensions (only used if canvasSizing is 'fixed')
   */
  fixedWidth?: number;
  fixedHeight?: number;
}

export interface UseImprovedWebGLServiceReturn {
  /**
   * WebGL context state (null if not available)
   */
  context: WebGLContextState | null;
  
  /**
   * Mount the WebGL canvas to a container element
   */
  mount: (element: HTMLElement) => boolean;
  
  /**
   * Unmount the WebGL canvas from its container
   */
  unmount: () => boolean;
  
  /**
   * Check if context is available and mounted
   */
  isMounted: boolean;
  
  /**
   * Check if context is lost
   */
  isLost: boolean;
  
  /**
   * Container ref for auto-mounting
   */
  containerRef: React.RefObject<HTMLDivElement>;

  /**
   * Force re-mount (useful for debugging)
   */
  forceRemount: () => void;
}

/**
 * Improved WebGL Service Hook
 * 
 * A more robust version that handles React lifecycle properly and provides
 * better canvas mounting and sizing control.
 */
export function useImprovedWebGLService(
  contextId: string,
  options: UseImprovedWebGLServiceOptions = {}
): UseImprovedWebGLServiceReturn {
  const {
    autoMount = true,
    autoUnmount = true,
    canvasSizing = 'container',
    fixedWidth = 800,
    fixedHeight = 600,
    ...webglConfig
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<WebGLContextState | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const mountAttemptedRef = useRef<boolean>(false);

  // Get or create WebGL context
  useEffect(() => {
    const webglContext = foundationServices.webgl.getContext(contextId, webglConfig);
    setContext(webglContext);
    
    if (!webglContext) {
      console.error(`[useImprovedWebGLService] Failed to get context: ${contextId}`);
      return;
    }

    console.log(`[useImprovedWebGLService] Got context: ${contextId}`);
  }, [contextId]);

  // Setup canvas sizing
  const setupCanvasSize = useCallback((canvas: HTMLCanvasElement, container: HTMLElement) => {
    switch (canvasSizing) {
      case 'container': {
        const containerRect = container.getBoundingClientRect();
        canvas.width = containerRect.width || 800;
        canvas.height = containerRect.height || 600;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        break;
      }
      case 'viewport': {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        break;
      }
      case 'fixed': {
        canvas.width = fixedWidth;
        canvas.height = fixedHeight;
        canvas.style.width = `${fixedWidth}px`;
        canvas.style.height = `${fixedHeight}px`;
        break;
      }
    }
  }, [canvasSizing, fixedWidth, fixedHeight]);

  // Auto-mount when container and context are both ready
  useEffect(() => {
    if (!autoMount || !containerRef.current || !context || isMounted || mountAttemptedRef.current) {
      return;
    }

    mountAttemptedRef.current = true;

    // Small delay to ensure DOM is stable
    const timeoutId = setTimeout(() => {
      if (containerRef.current && context && !isMounted) {
        const success = foundationServices.webgl.mountContext(contextId, containerRef.current);
        
        if (success && context.canvas) {
          setupCanvasSize(context.canvas, containerRef.current);
          setIsMounted(true);
          console.log(`[useImprovedWebGLService] Auto-mounted context: ${contextId}`);

          // Setup resize observer for container-based sizing
          if (canvasSizing === 'container') {
            const resizeObserver = new ResizeObserver(() => {
              if (context.canvas && containerRef.current) {
                setupCanvasSize(context.canvas, containerRef.current);
              }
            });
            
            resizeObserver.observe(containerRef.current);
            
            // Store cleanup function
            const cleanup = () => resizeObserver.disconnect();
            (containerRef.current as any).__webglCleanup = cleanup;
          }
        } else {
          mountAttemptedRef.current = false; // Allow retry
        }
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [autoMount, context, isMounted, contextId, setupCanvasSize, canvasSizing]);

  // Auto-unmount on cleanup
  useEffect(() => {
    return () => {
      if (autoUnmount && isMounted) {
        // Clean up resize observer
        if (containerRef.current && (containerRef.current as any).__webglCleanup) {
          (containerRef.current as any).__webglCleanup();
        }
        
        foundationServices.webgl.unmountContext(contextId);
        console.log(`[useImprovedWebGLService] Auto-unmounted context: ${contextId}`);
      }
    };
  }, [contextId, autoUnmount, isMounted]);

  // Manual mount function
  const mount = useCallback((element: HTMLElement): boolean => {
    const success = foundationServices.webgl.mountContext(contextId, element);
    
    if (success && context && context.canvas) {
      setupCanvasSize(context.canvas, element);
      setIsMounted(true);
    }
    
    return success;
  }, [contextId, context, setupCanvasSize]);

  // Manual unmount function
  const unmount = useCallback((): boolean => {
    const success = foundationServices.webgl.unmountContext(contextId);
    
    if (success) {
      setIsMounted(false);
      mountAttemptedRef.current = false;
    }
    
    return success;
  }, [contextId]);

  // Force remount function
  const forceRemount = useCallback(() => {
    if (isMounted) {
      unmount();
    }
    
    mountAttemptedRef.current = false;
    
    // Trigger remount on next tick
    setTimeout(() => {
      if (containerRef.current && context && !isMounted) {
        const success = foundationServices.webgl.mountContext(contextId, containerRef.current);
        
        if (success && context.canvas) {
          setupCanvasSize(context.canvas, containerRef.current);
          setIsMounted(true);
          console.log(`[useImprovedWebGLService] Force remounted context: ${contextId}`);
        }
      }
    }, 100);
  }, [contextId, context, isMounted, unmount, setupCanvasSize]);

  return {
    context,
    mount,
    unmount,
    isMounted,
    isLost: context?.isLost ?? false,
    containerRef,
    forceRemount
  };
}