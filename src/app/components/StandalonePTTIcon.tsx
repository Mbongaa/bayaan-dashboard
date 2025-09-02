"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Mic, Square } from "lucide-react";
import ReactSiriwave, { IReactSiriwaveProps } from 'react-siriwave';
import { SessionStatus } from "@/app/types";
import { ConversationState } from "@/app/hooks/useWebRTCAudioSession";

interface StandalonePTTIconProps {
  sessionStatus: SessionStatus;
  isPTTActive: boolean;
  isRecordingActive: boolean;
  volumeLevel: number;
  onToggleRecording: () => void;
  isDarkMode: boolean;
  conversationState: ConversationState;
}

const StandalonePTTIcon: React.FC<StandalonePTTIconProps> = ({
  sessionStatus,
  isPTTActive,
  isRecordingActive,
  volumeLevel,
  onToggleRecording,
  isDarkMode,
  conversationState,
}) => {
  const [siriWaveConfig, setSiriWaveConfig] = useState<IReactSiriwaveProps>({
    theme: "ios9",
    ratio: 1,
    speed: 0.2,
    amplitude: 1,
    frequency: 6,
    color: isDarkMode ? '#ef4444' : '#dc2626',
    cover: false,
    width: 200,
    height: 40,
    autostart: true,
    pixelDepth: 1,
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
      amplitude: isShowingActiveState ? Math.max(volumeLevel * 40, 2.5) : 0,
      speed: isShowingActiveState ? Math.max(volumeLevel * 8, 0.2) : 0,
      frequency: isShowingActiveState ? Math.max(volumeLevel * 10, 2.0) : 0,
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
      width: 60,
      scale: 0.9
    },
    animate: { 
      opacity: 1, 
      width: 220,
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut" as const
      }
    },
    exit: { 
      opacity: 0, 
      width: 60,
      scale: 0.9,
      transition: { duration: 0.3 }
    }
  };

  // Icon is now always visible - behavior changes based on mode

  return (
    <div className="relative flex justify-center items-end">
      <AnimatePresence mode="wait">
        {!isShowingActiveState ? (
          // Collapsed State - Elegant PTT Icon
          <motion.button
            key="ptt-icon"
            onClick={isClickable ? onToggleRecording : undefined}
            disabled={!isClickable}
            className={`
              group relative rounded-full p-4 shadow-lg transition-colors
              ${!isConnected 
                ? 'bg-transparent border border-black/20 dark:border-white/20 cursor-not-allowed' 
                : isManualMode
                  ? 'bg-transparent border border-black/30 dark:border-white/30 hover:border-black/50 dark:hover:border-white/50 cursor-pointer'
                  : 'bg-transparent border border-black/30 dark:border-white/30 cursor-default'
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
              size={24} 
              className={`
                transition-colors
                ${!isConnected 
                  ? 'text-black/60 dark:text-white/60'
                  : 'text-black dark:text-white group-hover:text-gray-800 dark:group-hover:text-gray-200'
                }
              `} 
            />
            
            {/* Subtle pulse animation when available */}
            {isConnected && (
              <motion.div
                className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/10"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.1, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.button>
        ) : (
          // Recording State - Expanded with Visualizer
          <motion.div
            key="ptt-recording"
            className="flex items-center gap-2 rounded-full px-3 py-2 shadow-lg bg-transparent border border-black/40 dark:border-white/40"
            variants={expandedVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Stop button (only clickable in manual mode) */}
            <motion.button
              onClick={isManualMode ? onToggleRecording : undefined}
              disabled={!isManualMode}
              className={`shrink-0 text-white dark:text-black rounded-full p-2 transition-colors ${
                isManualMode 
                  ? 'bg-transparent border border-black/30 dark:border-white/30 cursor-pointer' 
                  : 'bg-transparent border border-black/30 dark:border-white/30 cursor-default'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Square size={16} fill="currentColor" />
            </motion.button>
            
            {/* Audio visualizer */}
            <div className="flex-1 rounded-lg overflow-hidden">
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