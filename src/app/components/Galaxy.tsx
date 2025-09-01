import React, { useState } from 'react';
import { useGalaxyRenderer } from '../hooks/useGalaxyRenderer';
import { SessionStatus } from '../types';
import './Galaxy.css';

interface GalaxyProps {
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

const Galaxy = React.memo(function Galaxy({
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
}: GalaxyProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Use the custom WebGL hook with sessionStatus for smooth transitions
  useGalaxyRenderer(container, {
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
  });

  return <div ref={setContainer} className="galaxy-container" {...rest} />;
});

export default Galaxy;