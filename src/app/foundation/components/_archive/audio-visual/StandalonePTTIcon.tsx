"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Mic, Square } from "lucide-react";
import ReactSiriwave, { IReactSiriwaveProps } from 'react-siriwave';
import { SessionStatus } from "@/app/shared/types/types";
import { ConversationState } from "@/app/foundation/hooks/useWebRTCAudioSession";

interface StandalonePTTIconProps {
  sessionStatus: SessionStatus;
  isPTTActive: boolean;
  isRecordingActive: boolean;
  volumeLevel: number;
  onToggleRecording: () => void;
  isDarkMode: boolean;
  conversationState: ConversationState;
  onExpandChatbox?: () => void;
}

const StandalonePTTIcon: React.FC<StandalonePTTIconProps> = ({
  sessionStatus,
  isPTTActive,
  isRecordingActive,
  volumeLevel,
  onToggleRecording,
  isDarkMode,
  conversationState,
  onExpandChatbox,
}) => {
  const [siriWaveConfig, setSiriWaveConfig] = useState<IReactSiriwaveProps>({
    theme: "ios9",
    ratio: 1.5,
    speed: 0.2,
    amplitude: 1,
    frequency: 6,
    color: isDarkMode ? '#ef4444' : '#dc2626',
    cover: true, // Use cover mode to fill container
    width: 800, // Large width, but cover mode will make it responsive
    height: 48,
    autostart: true,
    pixelDepth: 2,
    lerpSpeed: 0.1,
  });

  const isConnected = sessionStatus === "CONNECTED";
  const isManualMode = isPTTActive; // True = manual PTT control, False = automatic listening feedback
  
  // Dynamic behavior based on mode - now uses real conversation state from useWebRTCAudioSession
  const isShowingActiveState = isManualMode 
    ? isRecordingActive // Manual mode: show active when user is manually recording
    : conversationState === 'user_speaking'; // Automatic mode: show active when system detects user speaking

  
  const isClickable = isManualMode && isConnected; // Only clickable in manual mode when connected

  useEffect(() => {
    // Unified white color for all modes
    const baseColor = '#ffffff'; // White for all modes
    
    setSiriWaveConfig(prevConfig => ({
      ...prevConfig,
      color: baseColor,
      amplitude: isShowingActiveState ? Math.max(volumeLevel * 120, 4.0) : 0,
      speed: isShowingActiveState ? Math.max(volumeLevel * 12, 0.15) : 0,
      frequency: isShowingActiveState ? Math.max(volumeLevel * 15, 1.0) : 0,
    }));
  }, [volumeLevel, isShowingActiveState, isDarkMode, isManualMode]);

  const iconVariants: Variants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: !isConnected ? 0.6 : 1, // Dimmed when disconnected, full opacity when connected
      transition: { 
        type: "spring" as const, 
        stiffness: 200, 
        damping: 15 
      }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: { duration: 0.2 }
    },
    hover: { 
      scale: !isConnected ? 1.05 : 1.1, // Smaller hover effect when disabled
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  const expandedVariants: Variants = {
    initial: { 
      opacity: 0, 
      scale: 0.9
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut" as const
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.3 }
    }
  };

  // Icon is now always visible - behavior changes based on mode

  return (
    <div 
      className="relative flex justify-start items-center w-full min-w-0"
      onMouseEnter={() => {
        // Trigger chatbox expansion directly
        const expandFn = (window as any).globalExpandChatbox || onExpandChatbox;
        if (expandFn) expandFn();
      }}
    >
      <AnimatePresence mode="wait">
        {!isShowingActiveState ? (
          // Collapsed State - Elegant PTT Icon
          <motion.button
            key="ptt-icon"
            onClick={isClickable ? onToggleRecording : undefined}
            disabled={!isClickable}
            className={`
              group relative rounded-full transition-colors h-8 w-8 flex items-center justify-center
              ${!isConnected 
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                : isManualMode
                  ? 'text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#515151] cursor-pointer'
                  : 'text-foreground dark:text-white cursor-default'
              }
            `}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover={isClickable ? "hover" : {}}
            whileTap={isClickable ? "tap" : {}}
          >
            <Mic 
              size={20} 
              className="transition-colors" 
            />
          </motion.button>
        ) : (
          // Recording State - Expanded with Visualizer
          <motion.div
            key="ptt-recording"
            className="absolute left-0 right-8 flex items-center gap-1 sm:gap-2 rounded-full px-2 sm:px-3 py-1 bg-transparent z-10"
            variants={expandedVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Stop button (only clickable in manual mode) */}
            <motion.button
              onClick={isManualMode ? onToggleRecording : undefined}
              disabled={!isManualMode}
              className={`shrink-0 text-black dark:text-white rounded-full p-2 transition-colors ${
                isManualMode 
                  ? 'bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 cursor-pointer' 
                  : 'bg-white/20 dark:bg-black/20 cursor-default'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Square size={16} fill="currentColor" />
            </motion.button>
            
            {/* Audio visualizer */}
            <div className="flex-1 rounded-lg overflow-hidden w-full h-12 flex items-center justify-center">
              <ReactSiriwave {...siriWaveConfig} />
            </div>
            
            {/* Recording indicator */}
            <motion.div
              className="shrink-0 w-2 h-2 rounded-full bg-black dark:bg-white"
              animate={{
                opacity: [1, 0.3, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StandalonePTTIcon;