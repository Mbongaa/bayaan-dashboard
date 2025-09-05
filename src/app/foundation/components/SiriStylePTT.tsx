"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';
import ReactSiriwave, { IReactSiriwaveProps } from 'react-siriwave';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionStatus } from '@/app/shared/types/types';
import { useMobileAudio } from '@/app/foundation/hooks/useMobileAudio';
import { preventMobileScroll } from '@/app/shared/lib/mobileUtils';

interface SiriStylePTTProps {
  sessionStatus: SessionStatus;
  isPTTActive: boolean;
  isRecordingActive: boolean;
  volumeLevel: number;
  onToggleRecording: () => void;
  isDarkMode: boolean;
}

const SiriStylePTT: React.FC<SiriStylePTTProps> = ({
  sessionStatus,
  isPTTActive,
  isRecordingActive,
  volumeLevel,
  onToggleRecording,
  isDarkMode,
}) => {
  const {
    isMobileDevice,
    hasAudioPermission,
    requestPermissions,
    handleTouchStart,
    handleTouchEnd,
    enableWakeLock,
    disableWakeLock,
  } = useMobileAudio();
  const [siriWaveConfig, setSiriWaveConfig] = useState<IReactSiriwaveProps>({
    theme: "ios9",
    ratio: 1,
    speed: 0.2,
    amplitude: 1,
    frequency: 6,
    color: isDarkMode ? '#3b82f6' : '#1d4ed8',
    cover: false,
    width: 300,
    height: 60,
    autostart: true,
    pixelDepth: 1,
    lerpSpeed: 0.1,
  });

  const isConnected = sessionStatus === "CONNECTED";
  const isDisabled = !isPTTActive || !isConnected;

  useEffect(() => {
    setSiriWaveConfig(prevConfig => ({
      ...prevConfig,
      color: isDarkMode ? '#3b82f6' : '#1d4ed8',
      amplitude: isRecordingActive ? Math.max(volumeLevel * 8, 0.5) : 0,
      speed: isRecordingActive ? Math.max(volumeLevel * 12, 0.3) : 0,
      frequency: isRecordingActive ? Math.max(volumeLevel * 6, 1.5) : 0,
    }));
  }, [volumeLevel, isRecordingActive, isDarkMode]);

  // Handle mobile-specific touch interactions
  const handleMobilePress = useCallback(async () => {
    if (isMobileDevice && !hasAudioPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        alert('Microphone permission is required for voice recording');
        return;
      }
    }
    
    handleTouchStart();
    onToggleRecording();
  }, [isMobileDevice, hasAudioPermission, requestPermissions, handleTouchStart, onToggleRecording]);

  const handleMobileRelease = useCallback(() => {
    if (isMobileDevice) {
      handleTouchEnd();
    }
  }, [isMobileDevice, handleTouchEnd]);

  // Handle wake lock for recording sessions
  useEffect(() => {
    if (isRecordingActive) {
      enableWakeLock();
      preventMobileScroll(true);
    } else {
      disableWakeLock();
      preventMobileScroll(false);
    }
  }, [isRecordingActive, enableWakeLock, disableWakeLock]);

  return (
    <div className="flex flex-row items-center gap-2 pointer-events-auto">
      <div className="flex items-center justify-center">
        <motion.button
          onClick={isMobileDevice ? handleMobilePress : onToggleRecording}
          onTouchEnd={isMobileDevice ? handleMobileRelease : undefined}
          disabled={isDisabled}
          className={`
            p-3 rounded-full transition-all duration-200 select-none
            ${isRecordingActive 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
              : 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg shadow-blue-500/30'
            }
            ${isDisabled 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400 shadow-none' 
              : 'cursor-pointer active:shadow-xl'
            }
            ${isMobileDevice ? 'touch-manipulation' : ''}
          `}
          whileTap={{ scale: 0.9 }}
          whileHover={!isDisabled ? { scale: 1.05 } : {}}
          initial={{ x: 0 }}
          animate={{ x: isRecordingActive ? -20 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ 
            zIndex: 10, 
            position: 'relative',
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          <AnimatePresence>
            {!isRecordingActive ? (
              <motion.div
                key="micIcon"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Mic size={20} />
              </motion.div>
            ) : (
              <motion.div
                key="stopIcon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Square size={20} fill="currentColor" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {isRecordingActive && (
            <motion.div
              className="rounded-lg overflow-hidden ml-2"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg dark:bg-gray-800/50">
                <ReactSiriwave {...siriWaveConfig} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SiriStylePTT;