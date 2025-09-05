"use client";

import React from "react";
import Audio3DOrb from "./Audio3DOrb";

interface AudioVisualizationSectionProps {
  intensity?: number;
  className?: string;
  // Removed PTT props - now handled at App level
}

const AudioVisualizationSection: React.FC<AudioVisualizationSectionProps> = ({
  intensity = 3.5,
  className = "w-full h-full",
}) => {
  return (
    <div className="relative w-full h-full">
      {/* 3D Audio Orb - Background */}
      <Audio3DOrb
        intensity={intensity}
        className={className}
      />
    </div>
  );
};

export default AudioVisualizationSection;