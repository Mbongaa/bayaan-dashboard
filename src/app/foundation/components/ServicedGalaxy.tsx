import React from 'react';
import { useServicedGalaxyRenderer } from '../hooks/useServicedGalaxyRenderer';
import { SessionStatus } from '../../shared/types/types';
import './Galaxy.css';

interface ServicedGalaxyProps {
  focal?: [number, number];
  rotation?: [number, number];
  starSpeed?: number;
  density?: number;
  hueShift?: number;
  disableAnimation?: boolean;
  speed?: number;
  mouseInteraction?: boolean;
  glowIntensity?: number;
  saturation?: number;
  mouseRepulsion?: boolean;
  repulsionStrength?: number;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  autoCenterRepulsion?: number;
  transparent?: boolean;
  sessionStatus?: SessionStatus;
  [key: string]: any;
}

/**
 * Service-based Galaxy Component
 * 
 * This version uses the WebGL Context Service instead of owning WebGL resources directly.
 * Key benefits:
 * - WebGL context survives React re-renders
 * - No resource recreation on props changes  
 * - Better performance and stability
 * - Follows service layer architecture pattern
 */
const ServicedGalaxy = React.memo(function ServicedGalaxy({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  glowIntensity = 0.3,
  saturation = 0.0,
  mouseRepulsion = true,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = true,
  sessionStatus = 'DISCONNECTED',
  ...rest
}: ServicedGalaxyProps) {
  
  // Use service-based renderer with unique context ID for Galaxy
  const { containerRef, isInitialized, isContextLost } = useServicedGalaxyRenderer(
    'galaxy-background', // Unique context ID
    {
      focal,
      rotation,
      starSpeed,
      density,
      hueShift,
      disableAnimation,
      speed,
      mouseInteraction,
      glowIntensity,
      saturation,
      mouseRepulsion,
      repulsionStrength,
      twinkleIntensity,
      rotationSpeed,
      autoCenterRepulsion,
      transparent,
      sessionStatus
    }
  );

  // Debug info (remove in production)
  React.useEffect(() => {
    console.log(`[ServicedGalaxy] Renderer initialized: ${isInitialized}, Context lost: ${isContextLost}`);
  }, [isInitialized, isContextLost]);

  return (
    <div 
      ref={containerRef} 
      className="galaxy-container" 
      {...rest}
      style={{
        ...rest.style,
        // Ensure container is properly sized
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    />
  );
});

export default ServicedGalaxy;