import React, { useEffect, useRef, useCallback } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useImprovedWebGLService } from '../hooks/useImprovedWebGLService';
import { SessionStatus } from '../types';
import './Galaxy.css';

interface ImprovedServicedGalaxyProps {
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

// Same shaders as original
const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;
varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5; 
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star(gv - offset - pad, flareSize);
      vec3 color = base;

      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;
      
      col += star * size * color;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  vec2 mouseNorm = uMouse - vec2(0.5);
  
  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;

  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}`;

/**
 * Improved Service-based Galaxy Component
 * 
 * This version uses the improved WebGL service with better lifecycle management
 * and proper canvas mounting/sizing.
 */
const ImprovedServicedGalaxy = React.memo(function ImprovedServicedGalaxy({
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
}: ImprovedServicedGalaxyProps) {
  
  // Use improved WebGL service with container sizing
  const webglService = useImprovedWebGLService('galaxy-background-improved', {
    alpha: transparent,
    premultipliedAlpha: false,
    antialias: true,
    canvasSizing: 'container'
  });

  // OGL renderer resources
  const rendererRef = useRef<Renderer | null>(null);
  const programRef = useRef<Program | null>(null);
  const meshRef = useRef<Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  
  // Mouse and animation state
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothMousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMouseActive = useRef(0.0);
  const smoothMouseActive = useRef(0.0);
  const targetSpeedRef = useRef(speed);
  const currentSpeedRef = useRef(speed);

  // Initialize OGL renderer when WebGL context is mounted
  useEffect(() => {
    if (!webglService.context || !webglService.isMounted) {
      cleanupRenderer();
      return;
    }

    const { gl, canvas } = webglService.context;
    
    try {
      // Create OGL renderer and let it handle the canvas/context setup
      // Note: This approach still benefits from service layer for lifecycle management
      const renderer = new Renderer({ 
        canvas: canvas,
        alpha: transparent,
        premultipliedAlpha: false,
        width: canvas.width || 800,
        height: canvas.height || 600
      });

      // Ensure canvas fills the container
      const container = webglService.context?.mountedElement;
      if (container && canvas) {
        const containerRect = container.getBoundingClientRect();
        canvas.width = containerRect.width || window.innerWidth;
        canvas.height = containerRect.height || window.innerHeight;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        
        // Update renderer size
        renderer.setSize(canvas.width, canvas.height);
      }
      
      const rendererGL = renderer.gl;

      const geometry = new Triangle(rendererGL);
      const program = new Program(rendererGL, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new Color(canvas.width, canvas.height, canvas.width / canvas.height) },
          uFocal: { value: new Float32Array(focal) },
          uRotation: { value: new Float32Array(rotation) },
          uStarSpeed: { value: starSpeed },
          uDensity: { value: density },
          uHueShift: { value: hueShift },
          uSpeed: { value: speed },
          uMouse: { value: new Float32Array([smoothMousePos.current.x, smoothMousePos.current.y]) },
          uGlowIntensity: { value: glowIntensity },
          uSaturation: { value: saturation },
          uMouseRepulsion: { value: mouseRepulsion },
          uTwinkleIntensity: { value: twinkleIntensity },
          uRotationSpeed: { value: rotationSpeed },
          uRepulsionStrength: { value: repulsionStrength },
          uMouseActiveFactor: { value: 0.0 },
          uAutoCenterRepulsion: { value: autoCenterRepulsion },
          uTransparent: { value: transparent }
        }
      });

      const mesh = new Mesh(rendererGL, { geometry, program });

      // Store resources
      rendererRef.current = renderer;
      programRef.current = program;
      meshRef.current = mesh;

      // Setup resize handler for proper canvas sizing
      const handleResize = () => {
        const container = webglService.context?.mountedElement;
        if (!container || !canvas) return;

        const containerRect = container.getBoundingClientRect();
        const newWidth = containerRect.width || window.innerWidth;
        const newHeight = containerRect.height || window.innerHeight;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        renderer.setSize(newWidth, newHeight);
        
        if (program) {
          program.uniforms.uResolution.value = new Color(newWidth, newHeight, newWidth / newHeight);
        }
      };

      window.addEventListener('resize', handleResize, false);

      // Start animation
      if (!disableAnimation) {
        startAnimation();
      }

      console.log(`[ImprovedServicedGalaxy] Initialized renderer for context: galaxy-background-improved`);

      return () => {
        window.removeEventListener('resize', handleResize);
      };

    } catch (error) {
      console.error('[ImprovedServicedGalaxy] Failed to initialize renderer:', error);
    }

    return cleanupRenderer;
  }, [webglService.context, webglService.isMounted, transparent]);

  // Handle sessionStatus changes for smooth speed transitions
  useEffect(() => {
    if (sessionStatus === 'CONNECTING') {
      targetSpeedRef.current = 1.0;
    } else {
      targetSpeedRef.current = speed;
    }
  }, [sessionStatus, speed]);

  // Update uniforms when props change
  useEffect(() => {
    if (!programRef.current) return;

    const program = programRef.current;
    program.uniforms.uFocal.value = new Float32Array(focal);
    program.uniforms.uRotation.value = new Float32Array(rotation);
    program.uniforms.uStarSpeed.value = starSpeed;
    program.uniforms.uDensity.value = density;
    program.uniforms.uHueShift.value = hueShift;
    program.uniforms.uGlowIntensity.value = glowIntensity;
    program.uniforms.uSaturation.value = saturation;
    program.uniforms.uMouseRepulsion.value = mouseRepulsion;
    program.uniforms.uTwinkleIntensity.value = twinkleIntensity;
    program.uniforms.uRotationSpeed.value = rotationSpeed;
    program.uniforms.uRepulsionStrength.value = repulsionStrength;
    program.uniforms.uAutoCenterRepulsion.value = autoCenterRepulsion;
    program.uniforms.uTransparent.value = transparent;
  }, [focal, rotation, starSpeed, density, hueShift, glowIntensity, saturation, mouseRepulsion, twinkleIntensity, rotationSpeed, repulsionStrength, autoCenterRepulsion, transparent]);

  // Handle animation state changes
  useEffect(() => {
    if (rendererRef.current) {
      if (!disableAnimation) {
        startAnimation();
      } else {
        stopAnimation();
      }
    }
  }, [disableAnimation]);

  // Setup mouse interaction
  useEffect(() => {
    const container = webglService.context?.mountedElement;
    if (!container || !mouseInteraction) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetMousePos.current = { x, y };
      targetMouseActive.current = 1.0;
    };

    const handleMouseLeave = () => {
      targetMouseActive.current = 0.0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [webglService.context?.mountedElement, mouseInteraction]);

  const startAnimation = useCallback(() => {
    if (animationIdRef.current) return; // Already running

    const update = (t: number) => {
      const renderer = rendererRef.current;
      const program = programRef.current;
      const mesh = meshRef.current;
      
      if (!renderer || !program || !mesh) return;

      animationIdRef.current = requestAnimationFrame(update);

      // Smooth speed interpolation
      const speedLerpFactor = 0.08;
      const speedDiff = targetSpeedRef.current - currentSpeedRef.current;
      if (Math.abs(speedDiff) > 0.001) {
        currentSpeedRef.current += speedDiff * speedLerpFactor;
      }

      if (!disableAnimation) {
        program.uniforms.uTime.value = t * 0.001;
        program.uniforms.uStarSpeed.value = (t * 0.001 * starSpeed) / 10.0;
        program.uniforms.uSpeed.value = currentSpeedRef.current;
      }

      // Smooth mouse interpolation
      const lerpFactor = 0.05;
      smoothMousePos.current.x += (targetMousePos.current.x - smoothMousePos.current.x) * lerpFactor;
      smoothMousePos.current.y += (targetMousePos.current.y - smoothMousePos.current.y) * lerpFactor;
      smoothMouseActive.current += (targetMouseActive.current - smoothMouseActive.current) * lerpFactor;

      program.uniforms.uMouse.value[0] = smoothMousePos.current.x;
      program.uniforms.uMouse.value[1] = smoothMousePos.current.y;
      program.uniforms.uMouseActiveFactor.value = smoothMouseActive.current;

      renderer.render({ scene: mesh });
    };

    animationIdRef.current = requestAnimationFrame(update);
  }, [disableAnimation, starSpeed]);

  const stopAnimation = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, []);

  const cleanupRenderer = useCallback(() => {
    stopAnimation();
    
    // Reset renderer references but don't destroy WebGL context
    // (that's managed by the service)
    rendererRef.current = null;
    programRef.current = null;
    meshRef.current = null;
  }, [stopAnimation]);

  // Debug info
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ImprovedServicedGalaxy] Context:`, {
        exists: !!webglService.context,
        mounted: webglService.isMounted,
        lost: webglService.isLost,
        canvas: !!webglService.context?.canvas,
        mountedElement: !!webglService.context?.mountedElement,
        renderer: !!rendererRef.current,
        program: !!programRef.current,
        mesh: !!meshRef.current
      });
    }
  }, [webglService.context, webglService.isMounted, webglService.isLost, rendererRef.current, programRef.current, meshRef.current]);

  return (
    <div 
      ref={webglService.containerRef} 
      className="galaxy-container" 
      {...rest}
      style={{
        ...rest.style,
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    />
  );
});

export default ImprovedServicedGalaxy;