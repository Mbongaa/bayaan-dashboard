"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Audio3DOrb from "./Audio3DOrb";
import StandalonePTTIcon from "./StandalonePTTIcon";
import { useWebRTCAudioSession } from "@/app/hooks/useWebRTCAudioSession";
import { useMicrophoneAnalysis } from "@/app/hooks/useMicrophoneAnalysis";
import { SessionStatus } from "@/app/types";

interface AudioVisualizationSectionProps {
  intensity?: number;
  className?: string;
  // PTT Props
  isPTTActive: boolean;
  isRecordingActive: boolean;
  onToggleRecording: () => void;
  isDarkMode: boolean;
}

const AudioVisualizationSection: React.FC<AudioVisualizationSectionProps> = ({
  intensity = 3.5,
  className = "w-full h-full",
  isPTTActive,
  isRecordingActive,
  onToggleRecording,
  isDarkMode,
}) => {
  // Get real conversation state from the same hook as the orb
  const { currentVolume, sessionStatus, conversationState } = useWebRTCAudioSession('alloy');
  
  // Get user's microphone volume for actual speech visualization
  const { microphoneVolume, isMicrophoneActive } = useMicrophoneAnalysis(sessionStatus);
  
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Find the portal target element in the transcript area
  useEffect(() => {
    const targetElement = document.getElementById('ptt-icon-portal');
    setPortalTarget(targetElement);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* 3D Audio Orb - Background */}
      <Audio3DOrb
        intensity={intensity}
        className={className}
      />
      
      {/* PTT Icon - Rendered via Portal in transcript area */}
      {portalTarget && createPortal(
        <StandalonePTTIcon
          sessionStatus={sessionStatus as SessionStatus}
          isPTTActive={isPTTActive}
          isRecordingActive={isRecordingActive}
          volumeLevel={microphoneVolume} // Use actual user microphone volume!
          onToggleRecording={onToggleRecording}
          isDarkMode={isDarkMode}
          conversationState={conversationState}
        />,
        portalTarget
      )}
    </div>
  );
};

export default AudioVisualizationSection;