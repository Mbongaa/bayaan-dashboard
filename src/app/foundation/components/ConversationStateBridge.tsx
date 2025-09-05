"use client";

import React from "react";
import { useWebRTCAudioSession } from "@/app/foundation/hooks/useWebRTCAudioSession";

interface ConversationStateBridgeProps {
  children: (conversationState: string, currentVolume: number) => React.ReactNode;
}

const ConversationStateBridge: React.FC<ConversationStateBridgeProps> = ({ children }) => {
  const { conversationState, currentVolume } = useWebRTCAudioSession('alloy');
  
  return (
    <>
      {children(conversationState, currentVolume)}
    </>
  );
};

export default ConversationStateBridge;