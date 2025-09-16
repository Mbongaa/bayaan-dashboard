"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useWebRTCAudioSession } from "@/app/foundation/hooks/useWebRTCAudioSession";
import { useMicrophoneAnalysis } from "@/app/foundation/hooks/useMicrophoneAnalysis";

interface PTTPortalProps {
  isPTTActive: boolean;
  isRecordingActive: boolean;
  onToggleRecording: () => void;
  isDarkMode: boolean;
}

const PTTPortal: React.FC<PTTPortalProps> = ({
  isPTTActive,
  isRecordingActive,
  onToggleRecording,
  isDarkMode,
}) => {
  const { sessionStatus, conversationState } = useWebRTCAudioSession('alloy');
  const { microphoneVolume } = useMicrophoneAnalysis(sessionStatus);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const targetElement = document.getElementById('ptt-icon-portal');
    setPortalTarget(targetElement);
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <div className="ptt-placeholder">
      {/* PTT Icon removed - StandalonePTTIcon was deleted */}
    </div>,
    portalTarget
  );
};

export default PTTPortal;