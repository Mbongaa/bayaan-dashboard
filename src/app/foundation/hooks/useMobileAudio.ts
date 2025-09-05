import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  isMobile, 
  isIOS, 
  isStandalone,
  requestAudioPermissions, 
  checkAudioPermissions,
  resumeAudioContext,
  enableIOSAudio,
  triggerHapticFeedback,
  requestWakeLock,
  releaseWakeLock
} from '../../shared/lib/mobileUtils';

export interface MobileAudioState {
  isMobileDevice: boolean;
  isStandaloneApp: boolean;
  hasAudioPermission: boolean;
  isAudioContextReady: boolean;
  wakeLock: WakeLockSentinel | null;
}

export interface MobileAudioActions {
  requestPermissions: () => Promise<boolean>;
  prepareAudioForMobile: (audioElement: HTMLAudioElement) => Promise<boolean>;
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
  enableWakeLock: () => Promise<void>;
  disableWakeLock: () => void;
}

export function useMobileAudio(): MobileAudioState & MobileAudioActions {
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [isAudioContextReady, setIsAudioContextReady] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const isMobileDevice = isMobile();
  const isStandaloneApp = isStandalone();

  // Initialize audio context for mobile
  useEffect(() => {
    if (!isMobileDevice) {
      setIsAudioContextReady(true);
      return;
    }

    const initAudioContext = async () => {
      try {
        // Create audio context if it doesn't exist
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        await resumeAudioContext(audioContextRef.current);
        setIsAudioContextReady(audioContextRef.current.state === 'running');
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        setIsAudioContextReady(false);
      }
    };

    initAudioContext();

    // Cleanup
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isMobileDevice]);

  // Check audio permissions on mount
  useEffect(() => {
    if (isMobileDevice) {
      checkAudioPermissions().then(setHasAudioPermission);
    } else {
      setHasAudioPermission(true);
    }
  }, [isMobileDevice]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isMobileDevice) return true;

    try {
      const granted = await requestAudioPermissions();
      setHasAudioPermission(granted);
      
      // Also resume audio context after permission is granted
      if (granted && audioContextRef.current) {
        await resumeAudioContext(audioContextRef.current);
        setIsAudioContextReady(audioContextRef.current.state === 'running');
      }
      
      return granted;
    } catch (error) {
      console.error('Failed to request audio permissions:', error);
      setHasAudioPermission(false);
      return false;
    }
  }, [isMobileDevice]);

  const prepareAudioForMobile = useCallback(async (audioElement: HTMLAudioElement): Promise<boolean> => {
    if (!isMobileDevice) return true;

    try {
      // Handle iOS audio restrictions
      if (isIOS()) {
        const success = await enableIOSAudio(audioElement);
        if (!success) {
          console.warn('iOS audio preparation failed');
          return false;
        }
      }

      // Apply mobile-specific audio settings
      audioElement.preload = 'none'; // Reduce bandwidth usage
      (audioElement as any).playsInline = true; // Prevent fullscreen video on iOS
      
      // Set up audio context if needed
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await resumeAudioContext(audioContextRef.current);
      }
      
      // Update ready state based on current context state
      if (audioContextRef.current) {
        setIsAudioContextReady(audioContextRef.current.state === 'running');
      }

      return true;
    } catch (error) {
      console.error('Failed to prepare audio for mobile:', error);
      return false;
    }
  }, [isMobileDevice]);

  const handleTouchStart = useCallback(() => {
    if (!isMobileDevice) return;

    // Trigger haptic feedback for touch start
    triggerHapticFeedback('light');
    
    // Resume audio context on touch (iOS requirement)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      resumeAudioContext(audioContextRef.current).then(() => {
        setIsAudioContextReady(audioContextRef.current!.state === 'running');
      });
    }
  }, [isMobileDevice]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobileDevice) return;

    // Trigger haptic feedback for touch end
    triggerHapticFeedback('medium');
  }, [isMobileDevice]);

  const enableWakeLock = useCallback(async () => {
    if (!isMobileDevice || wakeLock) return;

    try {
      const newWakeLock = await requestWakeLock();
      setWakeLock(newWakeLock);
    } catch (error) {
      console.warn('Wake lock not available:', error);
    }
  }, [isMobileDevice, wakeLock]);

  const disableWakeLock = useCallback(() => {
    if (wakeLock) {
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  }, [wakeLock]);

  // Auto-enable wake lock when in standalone mode and audio session is active
  useEffect(() => {
    if (isStandaloneApp && hasAudioPermission && isAudioContextReady) {
      enableWakeLock();
    }

    return () => {
      if (wakeLock) {
        disableWakeLock();
      }
    };
  }, [isStandaloneApp, hasAudioPermission, isAudioContextReady]);

  return {
    // State
    isMobileDevice,
    isStandaloneApp,
    hasAudioPermission,
    isAudioContextReady,
    wakeLock,
    
    // Actions
    requestPermissions,
    prepareAudioForMobile,
    handleTouchStart,
    handleTouchEnd,
    enableWakeLock,
    disableWakeLock,
  };
}