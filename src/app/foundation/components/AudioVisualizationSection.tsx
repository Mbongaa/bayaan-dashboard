"use client";

import React from "react";
import Audio3DOrb from "./Audio3DOrb";

interface AudioVisualizationSectionProps {
  intensity?: number;
  className?: string;
  uiMode?: 'default' | 'compact' | 'hidden';
  // Removed PTT props - now handled at App level
}

const AudioVisualizationSection: React.FC<AudioVisualizationSectionProps> = ({
  intensity = 3.5,
  className = "w-full h-full",
  uiMode = 'default',
}) => {
  const isCompactMode = uiMode === 'compact';
  
  return (
    <div className={`
      relative w-full h-full transition-all duration-700 ease-out transform-gpu
      ${isCompactMode 
        ? 'scale-[0.3] translate-x-[43vw] translate-y-[-19vh]' 
        : 'scale-100 translate-x-0 translate-y-0'
      }
    `}>
      {/* 3D Audio Orb - Animates smoothly between positions */}
      <Audio3DOrb
        intensity={intensity}
        className={className}
      />
    </div>
  );
};

export default AudioVisualizationSection;