import { useEffect, useRef, useCallback } from 'react';
import { foundationServices } from '../services/FoundationServices';
import { WebGLContextConfig, WebGLContextState } from '../services/WebGLContextService';

export interface UseWebGLServiceOptions extends WebGLContextConfig {
  /**
   * Auto-mount the context when container ref is available
   */
  autoMount?: boolean;
  
  /**
   * Auto-unmount when component unmounts
   */
  autoUnmount?: boolean;
}

export interface UseWebGLServiceReturn {
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
}

/**
 * React hook for integrating with WebGL Service
 * 
 * Provides a clean interface for React components to use persistent
 * WebGL contexts without owning them directly.
 * 
 * @param contextId - Unique identifier for the WebGL context
 * @param options - Configuration options
 */
export function useWebGLService(
  contextId: string,
  options: UseWebGLServiceOptions = {}
): UseWebGLServiceReturn {
  const {
    autoMount = true,
    autoUnmount = true,
    ...webglConfig
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<WebGLContextState | null>(null);
  const isMountedRef = useRef<boolean>(false);

  // Get or create WebGL context
  useEffect(() => {
    const context = foundationServices.webgl.getContext(contextId, webglConfig);
    contextRef.current = context;
    
    if (!context) {
      console.error(`[useWebGLService] Failed to get context: ${contextId}`);
      return;
    }

    console.log(`[useWebGLService] Got context: ${contextId}`);

    // Force re-render to update component state
    // This is needed because the context might be created before the component is ready
    const forceUpdate = () => {
      // Trigger a state update to ensure component re-renders with context
      if (contextRef.current && !isMountedRef.current && containerRef.current) {
        const success = foundationServices.webgl.mountContext(contextId, containerRef.current);
        if (success) {
          isMountedRef.current = true;
          console.log(`[useWebGLService] Force-mounted context: ${contextId}`);
        }
      }
    };

    // Use a small timeout to ensure DOM is ready
    const timeoutId = setTimeout(forceUpdate, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [contextId]);

  // Auto-mount when container is available
  useEffect(() => {
    if (autoMount && containerRef.current && contextRef.current && !isMountedRef.current) {
      const success = foundationServices.webgl.mountContext(contextId, containerRef.current);
      if (success) {
        isMountedRef.current = true;
        console.log(`[useWebGLService] Auto-mounted context: ${contextId}`);
      }
    }
  }, [contextId, autoMount]);

  // Auto-unmount on cleanup
  useEffect(() => {
    return () => {
      if (autoUnmount && isMountedRef.current) {
        foundationServices.webgl.unmountContext(contextId);
        isMountedRef.current = false;
        console.log(`[useWebGLService] Auto-unmounted context: ${contextId}`);
      }
    };
  }, [contextId, autoUnmount]);

  // Manual mount function
  const mount = useCallback((element: HTMLElement): boolean => {
    const success = foundationServices.webgl.mountContext(contextId, element);
    if (success) {
      isMountedRef.current = true;
    }
    return success;
  }, [contextId]);

  // Manual unmount function
  const unmount = useCallback((): boolean => {
    const success = foundationServices.webgl.unmountContext(contextId);
    if (success) {
      isMountedRef.current = false;
    }
    return success;
  }, [contextId]);

  return {
    context: contextRef.current,
    mount,
    unmount,
    isMounted: isMountedRef.current,
    isLost: contextRef.current?.isLost ?? false,
    containerRef
  };
}