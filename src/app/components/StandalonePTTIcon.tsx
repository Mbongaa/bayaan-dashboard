"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  
  // Dynamic behavior based on mode
  const isShowingActiveState = isManualMode 
    ? isRecordingActive // Manual mode: show active when user is manually recording
    : conversationState === 'user_speaking'; // Automatic mode: show active when system detects user speaking
  
  const isClickable = isManualMode && isConnected; // Only clickable in manual mode when connected

  useEffect(() => {
    // Dynamic color based on mode
    const baseColor = isManualMode 
      ? (isDarkMode ? '#ef4444' : '#dc2626') // Red for manual PTT mode
      : (isDarkMode ? '#3b82f6' : '#1d4ed8'); // Blue for automatic listening mode
    
    setSiriWaveConfig(prevConfig => ({
      ...prevConfig,
      color: baseColor,
      amplitude: isShowingActiveState ? Math.max(volumeLevel * 8, 0.5) : 0,
      speed: isShowingActiveState ? Math.max(volumeLevel * 12, 0.3) : 0,
      frequency: isShowingActiveState ? Math.max(volumeLevel * 6, 1.5) : 0,
    }));
  }, [volumeLevel, isShowingActiveState, isDarkMode, isManualMode]);

  const iconVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: !isConnected ? 0.6 : 1, // Dimmed when disconnected, full opacity when connected
      transition: { 
        type: "spring", 
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

  const expandedVariants = {
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
        ease: "easeOut"
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
                ? `${isManualMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-blue-500/10 border border-blue-500/20'} backdrop-blur-sm cursor-not-allowed` 
                : isManualMode
                  ? 'bg-red-500/20 backdrop-blur-sm border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50 cursor-pointer'
                  : 'bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 cursor-default'
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
                  ? isManualMode 
                    ? 'text-red-400/60 dark:text-red-400/60' 
                    : 'text-blue-400/60 dark:text-blue-400/60'
                  : isManualMode
                    ? 'text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300'
                    : 'text-blue-600 dark:text-blue-400'
                }
              `} 
            />
            
            {/* Subtle pulse animation when available */}
            {isConnected && (
              <motion.div
                className={`absolute inset-0 rounded-full ${isManualMode ? 'bg-red-400/10 dark:bg-red-500/10' : 'bg-blue-400/10 dark:bg-blue-500/10'}`}
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
            className={`flex items-center gap-2 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg ${
              isManualMode 
                ? 'bg-red-500/20 border border-red-500/40' 
                : 'bg-blue-500/20 border border-blue-500/40'
            }`}
            variants={expandedVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Stop button (only clickable in manual mode) */}
            <motion.button
              onClick={isManualMode ? onToggleRecording : undefined}
              disabled={!isManualMode}
              className={`shrink-0 text-white rounded-full p-2 transition-colors ${
                isManualMode 
                  ? 'bg-red-500 hover:bg-red-600 cursor-pointer' 
                  : 'bg-blue-500 cursor-default'
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
              className={`shrink-0 w-2 h-2 rounded-full ${isManualMode ? 'bg-red-500' : 'bg-blue-500'}`}
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