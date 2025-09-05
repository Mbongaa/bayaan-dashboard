"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const MiniOrb: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    initMiniOrb();
    
    // Listen for theme changes to update colors
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateOrbColors();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  const getThemeColors = () => {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      wireframe: computedStyle.getPropertyValue('--orb-wireframe').trim() || '#ffffff',
      ambientLight: computedStyle.getPropertyValue('--orb-ambient-light').trim() || '#ffffff',
    };
  };

  const initMiniOrb = () => {
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 100);
    camera.position.set(0, 0, 15);
    camera.lookAt(scene.position);

    scene.add(camera);
    sceneRef.current = scene;
    groupRef.current = group;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      precision: 'highp'
    });
    const outElement = containerRef.current;
    if (outElement) {
      outElement.innerHTML = "";
      outElement.appendChild(renderer.domElement);
      
      // Render at higher resolution for thinner lines, then scale down
      renderer.setSize(80, 80);
      renderer.domElement.style.width = '55x';
      renderer.domElement.style.height = '55px';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.transform = 'scale(0.5)';
      renderer.domElement.style.transformOrigin = 'center';
    }

    rendererRef.current = renderer;

    // Get theme-aware colors
    const themeColors = getThemeColors();
    const wireframeColor = new THREE.Color(themeColors.wireframe);

    // Create octahedron with subdivision for ~18 faces (less dense than icosahedron)
    const octahedronGeometry = new THREE.OctahedronGeometry(6, 1);
    
    // Create edges geometry for visible wireframe lines
    const edgesGeometry = new THREE.EdgesGeometry(octahedronGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: wireframeColor,
      linewidth: 1, // Note: linewidth > 1 might not work on all platforms
    });

    const wireframeLines = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    wireframeLines.position.set(0, 0, 0);

    group.add(wireframeLines);

    // No complex lighting needed for MeshBasicMaterial
    scene.add(group);

    render();
  };

  const render = () => {
    if (
      !groupRef.current ||
      !cameraRef.current ||
      !rendererRef.current ||
      !sceneRef.current
    ) {
      return;
    }

    // Match main orb's neutral state spin speed
    groupRef.current.rotation.y += 0.02;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    requestAnimationFrame(render);
  };

  const updateOrbColors = () => {
    if (!sceneRef.current) return;
    
    // Get current theme colors
    const themeColors = getThemeColors();
    const wireframeColor = new THREE.Color(themeColors.wireframe);
    
    // Update materials for LineSegments (wireframe)
    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
        child.material.color = wireframeColor;
      }
    });
  };

  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-center"
      style={{ width: '25px', height: '25px', minWidth: '25px', minHeight: '25px' }}
    />
  );
};

export default MiniOrb;