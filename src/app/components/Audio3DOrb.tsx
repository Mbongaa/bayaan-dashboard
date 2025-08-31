"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";
import { useWebRTCAudioSession, ConversationState } from "@/app/hooks/useWebRTCAudioSession";

interface Audio3DOrbProps {
  intensity?: number;
  className?: string;
}

const Audio3DOrb: React.FC<Audio3DOrbProps> = ({ 
  intensity = 3,
  className: _ = "" 
}) => {
  const { currentVolume, isSessionActive, conversationState, handleStartStopClick } = useWebRTCAudioSession('alloy');
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const ballRef = useRef<THREE.Mesh | null>(null);
  const originalPositionsRef = useRef<Float32Array | null>(null);
  const previousPositionsRef = useRef<Float32Array | null>(null);
  const shrinkFactorRef = useRef<number>(1);
  const targetShrinkFactor = useRef<number>(1);
  const targetVolume = useRef<number>(0);
  const currentSmoothedVolume = useRef<number>(0);
  const spinSpeedRef = useRef<number>(0.005); // Base spin speed
  const targetSpinSpeed = useRef<number>(0.005);
  const noise = createNoise3D();

  useEffect(() => {
    initViz();
    window.addEventListener("resize", onWindowResize);
    return () => {
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  useEffect(() => {
    if (isSessionActive && ballRef.current) {
      updateBallMorph(ballRef.current, currentVolume, conversationState);
    } else if (
      !isSessionActive &&
      ballRef.current &&
      originalPositionsRef.current
    ) {
      resetBallMorph(ballRef.current, originalPositionsRef.current);
    }
  }, [currentVolume, isSessionActive, conversationState]);

  // Debug logging for conversation state changes
  useEffect(() => {
    console.log('[Audio3DOrb] Conversation state changed to:', conversationState);
  }, [conversationState]);

  const initViz = () => {
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    const camera = new THREE.PerspectiveCamera(
      20,
      1,
      1,
      100,
    );
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);
 
    scene.add(camera);
    sceneRef.current = scene;
    groupRef.current = group;
    cameraRef.current = camera;
 
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const outElement = containerRef.current;
    if (outElement) {
      outElement.innerHTML = ""; // Clear any existing renderer
      outElement.appendChild(renderer.domElement);
      
      // Set renderer size to fit container dimensions properly
      const containerWidth = outElement.clientWidth;
      const containerHeight = outElement.clientHeight;
      const size = Math.min(containerWidth, containerHeight);
      
      renderer.setSize(size, size);
      
      // Style the canvas element to maintain aspect ratio and center
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.objectFit = 'contain';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.margin = 'auto';
    }
 
    rendererRef.current = renderer;
 
    const icosahedronGeometry = new THREE.IcosahedronGeometry(10, 8);
    const lambertMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      wireframe: true,
    });
 
    const ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);
    ballRef.current = ball;
 
    // Store the original positions of the vertices
    originalPositionsRef.current = new Float32Array(
      ball.geometry.attributes.position.array
    );
    
    // Initialize previous positions for damping
    previousPositionsRef.current = new Float32Array(
      ball.geometry.attributes.position.array
    );
 
    group.add(ball);
 
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
 
    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    spotLight.lookAt(ball.position);
    spotLight.castShadow = true;
    scene.add(spotLight);
 
    scene.add(group);
 
    render();
  };

  const render = () => {
    if (
      !groupRef.current ||
      !ballRef.current ||
      !cameraRef.current ||
      !rendererRef.current ||
      !sceneRef.current
    ) {
      return;
    }
 
    // Dynamic spin speed based on conversation state
    groupRef.current.rotation.y += spinSpeedRef.current;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    requestAnimationFrame(render);
  };

  const onWindowResize = () => {
    if (!cameraRef.current || !rendererRef.current) return;
 
    const outElement = containerRef.current;
    if (outElement) {
      const containerWidth = outElement.clientWidth;
      const containerHeight = outElement.clientHeight;
      const size = Math.min(containerWidth, containerHeight);
      
      rendererRef.current.setSize(size, size);
      
      cameraRef.current.aspect = 1;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const updateBallMorph = (mesh: THREE.Mesh, volume: number, state: ConversationState) => {
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute("position");
    
    // Handle conversation state-based behavior
    const isListening = state === 'user_speaking';
    const isAgentSpeaking = state === 'agent_speaking';
    const isIdle = state === 'idle';
    
    // Set target shrink factor
    if (isListening) {
      targetShrinkFactor.current = 0.7; // Shrink to 70% when listening
      targetSpinSpeed.current = 0.02; // Spin faster when listening
    } else {
      targetShrinkFactor.current = 1.0; // Normal size
      targetSpinSpeed.current = 0.005; // Normal spin speed
    }
    
    // Smooth transitions
    const shrinkLerpSpeed = 0.06;
    const spinLerpSpeed = 0.1;
    shrinkFactorRef.current += (targetShrinkFactor.current - shrinkFactorRef.current) * shrinkLerpSpeed;
    spinSpeedRef.current += (targetSpinSpeed.current - spinSpeedRef.current) * spinLerpSpeed;
    
    // Debug logging every 100 frames
    if (Math.random() < 0.01) {
      console.log('[Audio3DOrb] State:', state, 'shrinkFactor:', shrinkFactorRef.current.toFixed(2), 'spinSpeed:', spinSpeedRef.current.toFixed(3));
    }
    
    // Volume processing (only used when not listening)
    let processedVolume = 0;
    if (!isListening) {
      // Smooth volume interpolation for natural movement
      targetVolume.current = volume;
      const volumeLerpSpeed = 0.08; // Slow interpolation for smooth transitions
      currentSmoothedVolume.current += (targetVolume.current - currentSmoothedVolume.current) * volumeLerpSpeed;
      const smoothVolume = currentSmoothedVolume.current;
      
      // Enhanced volume curve for more dramatic growth
      const enhancedVolume = Math.pow(smoothVolume * 1.5, 0.7);
      processedVolume = Math.min(enhancedVolume, 1.2);
    }
 
    for (let i = 0; i < positionAttribute.count; i++) {
      // Use original positions for consistent morphing
      const originalX = originalPositionsRef.current![i * 3];
      const originalY = originalPositionsRef.current![i * 3 + 1]; 
      const originalZ = originalPositionsRef.current![i * 3 + 2];
      
      const vertex = new THREE.Vector3(originalX, originalY, originalZ);
 
      const offset = 10; // Base radius
      const amp = 0.3; // Amplitude for noise
      const time = window.performance.now();
      vertex.normalize();
      const rf = 0.00002; // Time factor for movement
      
      // Calculate target distance with enhanced growth or shrinking
      let targetDistance;
      
      if (isListening) {
        // Listening mode: Just shrink to 60% - no morphing, just spinning
        targetDistance = offset * shrinkFactorRef.current;
      } else {
        // Speaking/idle mode: Enhanced growth with audio response
        targetDistance =
          offset * shrinkFactorRef.current +
          processedVolume * 2.5 * intensity * shrinkFactorRef.current +
          noise(
            vertex.x + time * rf * 1.2,
            vertex.y + time * rf * 1.4,
            vertex.z + time * rf * 1.6,
          ) *
            amp *
            processedVolume * intensity * shrinkFactorRef.current;
      }
      
      vertex.multiplyScalar(targetDistance);
 
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
 
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  const resetBallMorph = (
    mesh: THREE.Mesh,
    originalPositions: Float32Array,
  ) => {
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute("position");
 
    for (let i = 0; i < positionAttribute.count; i++) {
      positionAttribute.setXYZ(
        i,
        originalPositions[i * 3],
        originalPositions[i * 3 + 1],
        originalPositions[i * 3 + 2],
      );
    }
 
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <div
        ref={containerRef}
        className="hover:cursor-pointer w-full h-full flex items-center justify-center"
        onClick={handleStartStopClick}
      ></div>
    </div>
  );
};

export default Audio3DOrb;