"use client";

import React from "react";
import Audio3DOrb from "./Audio3DOrb";

interface AudioVisualizationSectionProps {
  intensity?: number;
  className?: string;
  appMode?: 'voice' | 'workspace';
}

const AudioVisualizationSection: React.FC<AudioVisualizationSectionProps> = ({
  intensity = 3.5,
  className = "w-full h-full",
  appMode = 'voice',
}) => {
  const isWorkspaceMode = appMode === 'workspace';
  
  return (
    <div 
      className={`
        relative w-full h-full transition-all duration-1200 ease-in-out pointer-events-auto
        ${isWorkspaceMode 
          ? 'scale-[0.2] translate-x-[45vw] translate-y-[-25vh]' 
          : 'scale-100 translate-x-0 translate-y-0'
        }
      `} 
      style={{ willChange: 'transform' }}>
      {/* 3D Audio Orb - Animates smoothly between positions */}
      <Audio3DOrb
        intensity={intensity}
        className={className}
      />
    </div>
  );
};

export default AudioVisualizationSection;