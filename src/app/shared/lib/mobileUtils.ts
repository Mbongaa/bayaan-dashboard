/**
 * Mobile-specific utilities for PWA and WebRTC functionality
 */

// Device detection utilities
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia('(display-mode: standalone)').matches) || 
         ('standalone' in window.navigator && window.navigator.standalone === true);
};

export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
};

// Audio permission handling for mobile
export const requestAudioPermissions = async (): Promise<boolean> => {
  try {
    // First, try to get user media to trigger permission request
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Stop all tracks immediately after getting permission
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch {
    console.error('Audio permission denied');
    return false;
  }
};

// Check if audio permissions are granted
export const checkAudioPermissions = async (): Promise<boolean> => {
  try {
    if (!navigator.permissions) return false;
    
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return permission.state === 'granted';
  } catch {
    // Fallback: try to access microphone briefly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }
};

// Mobile-specific audio constraints
export const getMobileAudioConstraints = () => {
  let audioConstraints: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  if (isIOS()) {
    // iOS-specific audio constraints
    audioConstraints = {
      ...audioConstraints,
      sampleRate: 48000, // iOS prefers 48kHz
      channelCount: 1,
    };
  } else if (isAndroid()) {
    // Android-specific audio constraints
    audioConstraints = {
      ...audioConstraints,
      sampleRate: 44100, // Android commonly uses 44.1kHz
      channelCount: 1,
    };
  }

  return { audio: audioConstraints };
};

// Handle mobile audio context issues
export const resumeAudioContext = async (audioContext?: AudioContext): Promise<void> => {
  if (!audioContext) return;
  
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log('Audio context resumed for mobile');
    } catch (error) {
      console.error('Failed to resume audio context:', error);
    }
  }
};

// Handle iOS audio autoplay restrictions
export const enableIOSAudio = async (audioElement: HTMLAudioElement): Promise<boolean> => {
  if (!isIOS()) return true;
  
  try {
    // iOS requires user interaction before audio can play
    audioElement.muted = false;
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
      await playPromise;
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('iOS audio playback failed:', error);
    return false;
  }
};

// Haptic feedback for mobile interactions
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'medium'): void => {
  if (typeof window === 'undefined') return;
  
  // Modern vibration API
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50]
    };
    navigator.vibrate(patterns[type]);
  }
  
  // iOS haptic feedback (if available)
  if ('hapticFeedback' in navigator) {
    try {
      (navigator as any).hapticFeedback.impact(type);
    } catch {
      // Silently fail if haptic feedback is not available
    }
  }
};

// Prevent mobile scroll during PTT interactions
export const preventMobileScroll = (prevent: boolean): void => {
  if (typeof document === 'undefined') return;
  
  if (prevent) {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  } else {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }
};

// Wake lock API for keeping screen active during voice interactions
export const requestWakeLock = async (): Promise<WakeLockSentinel | null> => {
  try {
    if ('wakeLock' in navigator) {
      const wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('Screen wake lock acquired');
      return wakeLock;
    }
  } catch (error) {
    console.warn('Wake lock not supported or failed:', error);
  }
  
  return null;
};

export const releaseWakeLock = (wakeLock: WakeLockSentinel | null): void => {
  if (wakeLock) {
    try {
      wakeLock.release();
      console.log('Screen wake lock released');
    } catch {
      console.warn('Failed to release wake lock');
    }
  }
};

// PWA install detection and prompting
export const isPWAInstallable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if app is already installed
  if (isStandalone()) return false;
  
  // Check for install prompt availability
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const showPWAInstallPrompt = (deferredPrompt: any): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!deferredPrompt) {
      resolve(false);
      return;
    }
    
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      resolve(choiceResult.outcome === 'accepted');
    });
  });
};

// Network status detection for PWA
export const isOnline = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

export const onNetworkChange = (callback: (online: boolean) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};