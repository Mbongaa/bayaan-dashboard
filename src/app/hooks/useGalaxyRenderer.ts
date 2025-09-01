import { useEffect, useRef, useCallback } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { SessionStatus } from '../types';

interface GalaxyConfig {
  focal: [number, number];
  rotation: [number, number];
  starSpeed: number;
  density: number;
  hueShift: number;
  disableAnimation: boolean;
  speed: number;
  mouseInteraction: boolean;
  glowIntensity: number;
  saturation: number;
  mouseRepulsion: boolean;
  repulsionStrength: number;
  twinkleIntensity: number;
  rotationSpeed: number;
  autoCenterRepulsion: number;
  transparent: boolean;
  sessionStatus?: SessionStatus;
}

interface WebGLResources {
  renderer: Renderer | null;
  program: Program | null;
  mesh: Mesh | null;
  animateId: number | null;
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

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
    vec2 centerUV = vec2(0.0, 0.0); // Center in UV space
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
    alpha = smoothstep(0.0, 0.3, alpha); // Enhance contrast
    alpha = min(alpha, 1.0); // Clamp to maximum 1.0
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

export function useGalaxyRenderer(container: HTMLElement | null, config: GalaxyConfig) {
  const resourcesRef = useRef<WebGLResources>({
    renderer: null,
    program: null,
    mesh: null,
    animateId: null
  });
  
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothMousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMouseActive = useRef(0.0);
  const smoothMouseActive = useRef(0.0);
  
  // Smooth speed transition for connecting state
  const targetSpeedRef = useRef(config.speed);
  const currentSpeedRef = useRef(config.speed);

  // Initialize WebGL context only when container or transparency changes
  useEffect(() => {
    if (!container) return;

    // Clean up existing resources
    cleanupWebGL();

    const renderer = new Renderer({
      alpha: config.transparent,
      premultipliedAlpha: false
    });
    const gl = renderer.gl;

    if (config.transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.clearColor(0, 0, 0, 1);
    }

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uFocal: { value: new Float32Array(config.focal) },
        uRotation: { value: new Float32Array(config.rotation) },
        uStarSpeed: { value: config.starSpeed },
        uDensity: { value: config.density },
        uHueShift: { value: config.hueShift },
        uSpeed: { value: config.speed },
        uMouse: { value: new Float32Array([smoothMousePos.current.x, smoothMousePos.current.y]) },
        uGlowIntensity: { value: config.glowIntensity },
        uSaturation: { value: config.saturation },
        uMouseRepulsion: { value: config.mouseRepulsion },
        uTwinkleIntensity: { value: config.twinkleIntensity },
        uRotationSpeed: { value: config.rotationSpeed },
        uRepulsionStrength: { value: config.repulsionStrength },
        uMouseActiveFactor: { value: 0.0 },
        uAutoCenterRepulsion: { value: config.autoCenterRepulsion },
        uTransparent: { value: config.transparent }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    // Store resources
    resourcesRef.current = { renderer, program, mesh, animateId: null };

    // Setup resize handler
    const handleResize = () => {
      const scale = 1;
      renderer.setSize(container.offsetWidth * scale, container.offsetHeight * scale);
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height
        );
      }
    };

    window.addEventListener('resize', handleResize, false);
    handleResize();

    container.appendChild(gl.canvas);

    // Start animation immediately after WebGL setup
    if (!config.disableAnimation) {
      startAnimation();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupWebGL();
    };
  }, [container, config.transparent]); // Only recreate on container or transparency change

  // Handle sessionStatus changes for smooth speed transitions
  useEffect(() => {
    if (config.sessionStatus === 'CONNECTING') {
      targetSpeedRef.current = 1.0; // Boost to 1.0 during connecting
    } else {
      targetSpeedRef.current = config.speed; // Return to base speed
    }
  }, [config.sessionStatus, config.speed]);

  // Update uniforms when config changes (without recreating WebGL context)
  useEffect(() => {
    const { program } = resourcesRef.current;
    if (!program) return;

    program.uniforms.uFocal.value = new Float32Array(config.focal);
    program.uniforms.uRotation.value = new Float32Array(config.rotation);
    program.uniforms.uStarSpeed.value = config.starSpeed;
    program.uniforms.uDensity.value = config.density;
    program.uniforms.uHueShift.value = config.hueShift;
    // Note: uSpeed is updated in animation loop for smooth transitions
    program.uniforms.uGlowIntensity.value = config.glowIntensity;
    program.uniforms.uSaturation.value = config.saturation;
    program.uniforms.uMouseRepulsion.value = config.mouseRepulsion;
    program.uniforms.uTwinkleIntensity.value = config.twinkleIntensity;
    program.uniforms.uRotationSpeed.value = config.rotationSpeed;
    program.uniforms.uRepulsionStrength.value = config.repulsionStrength;
    program.uniforms.uAutoCenterRepulsion.value = config.autoCenterRepulsion;
    program.uniforms.uTransparent.value = config.transparent;
  }, [
    config.focal,
    config.rotation,
    config.starSpeed,
    config.density,
    config.hueShift,
    // Removed config.speed from dependencies to avoid reinitialization
    config.glowIntensity,
    config.saturation,
    config.mouseRepulsion,
    config.twinkleIntensity,
    config.rotationSpeed,
    config.repulsionStrength,
    config.autoCenterRepulsion
  ]);

  // Handle animation state changes
  useEffect(() => {
    if (resourcesRef.current.renderer) {
      if (!config.disableAnimation) {
        startAnimation();
      } else {
        stopAnimation();
      }
    }
  }, [config.disableAnimation]);

  // Setup mouse interaction
  useEffect(() => {
    if (!container || !config.mouseInteraction) return;

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
  }, [container, config.mouseInteraction]);

  const startAnimation = useCallback(() => {
    if (resourcesRef.current.animateId) return; // Already running

    const update = (t: number) => {
      const { renderer, program, mesh } = resourcesRef.current;
      if (!renderer || !program || !mesh) return;

      resourcesRef.current.animateId = requestAnimationFrame(update);

      // Smooth speed interpolation for connecting state
      const speedLerpFactor = 0.08;
      const speedDiff = targetSpeedRef.current - currentSpeedRef.current;
      if (Math.abs(speedDiff) > 0.001) {
        currentSpeedRef.current += speedDiff * speedLerpFactor;
      }

      if (!config.disableAnimation) {
        program.uniforms.uTime.value = t * 0.001;
        program.uniforms.uStarSpeed.value = (t * 0.001 * config.starSpeed) / 10.0;
        // Use smoothly interpolated speed instead of config.speed
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

    resourcesRef.current.animateId = requestAnimationFrame(update);
  }, []);

  const stopAnimation = useCallback(() => {
    if (resourcesRef.current.animateId) {
      cancelAnimationFrame(resourcesRef.current.animateId);
      resourcesRef.current.animateId = null;
    }
  }, []);

  const cleanupWebGL = useCallback(() => {
    stopAnimation();
    
    const { renderer } = resourcesRef.current;
    if (renderer) {
      const canvas = renderer.gl.canvas;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }

    resourcesRef.current = {
      renderer: null,
      program: null,
      mesh: null,
      animateId: null
    };
  }, []);

  return {
    isInitialized: !!resourcesRef.current.renderer,
    program: resourcesRef.current.program,
    cleanup: cleanupWebGL
  };
}