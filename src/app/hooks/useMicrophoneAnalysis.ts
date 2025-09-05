import { useState, useRef, useEffect, useCallback } from 'react';
import { SessionStatus } from '../types';

interface UseMicrophoneAnalysisReturn {
  microphoneVolume: number;
  isMicrophoneActive: boolean;
}

export function useMicrophoneAnalysis(sessionStatus: SessionStatus): UseMicrophoneAnalysisReturn {
  const [microphoneVolume, setMicrophoneVolume] = useState<number>(0);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState<boolean>(false);
  
  // Audio analysis refs
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number>(0);
  const volumeHistoryRef = useRef<number[]>([]);
  const smoothedVolumeRef = useRef<number>(0);

  const setupMicrophoneAnalysis = useCallback(async () => {
    try {
      console.log('[useMicrophoneAnalysis] Setting up microphone analysis...');
      
      // Get user's microphone stream
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.6;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
      
      // Connect microphone stream to analyser
      const source = audioContextRef.current.createMediaStreamSource(micStreamRef.current);
      source.connect(analyserRef.current);
      
      setIsMicrophoneActive(true);
      
      // Start analysis loop
      analyzeMicrophoneAudio();
      console.log('[useMicrophoneAnalysis] Microphone analysis setup complete');
    } catch (error) {
      console.error('[useMicrophoneAnalysis] Microphone analysis setup failed:', error);
      setIsMicrophoneActive(false);
    }
  }, []);
  
  const analyzeMicrophoneAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate volume (RMS) from microphone input
    let sum = 0;
    const dataArray = dataArrayRef.current;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rawVolume = Math.sqrt(sum / dataArray.length) / 255;
    
    // Apply smoothing for stable visualization
    const historySize = 2; // Even shorter history for maximum responsiveness
    volumeHistoryRef.current.push(rawVolume);
    if (volumeHistoryRef.current.length > historySize) {
      volumeHistoryRef.current.shift();
    }
    
    // Calculate smoothed volume
    const smoothedVolume = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length;
    
    // Apply exponential smoothing for stability
    const smoothingFactor = 0.3; // Even more responsive for soft speech
    smoothedVolumeRef.current = smoothedVolumeRef.current * (1 - smoothingFactor) + smoothedVolume * smoothingFactor;
    
    // Enhance volume for better visualization
    const enhancedVolume = Math.min(smoothedVolumeRef.current * 4.5, 1.0);
    
    setMicrophoneVolume(enhancedVolume);
    
    // Continue analysis loop
    if (analyserRef.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
      animationFrameRef.current = requestAnimationFrame(analyzeMicrophoneAudio);
    }
  }, []);
  
  const cleanupMicrophoneAnalysis = useCallback(() => {
    console.log('[useMicrophoneAnalysis] Cleaning up microphone analysis...');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    audioContextRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
    micStreamRef.current = null;
    volumeHistoryRef.current = [];
    smoothedVolumeRef.current = 0;
    setMicrophoneVolume(0);
    setIsMicrophoneActive(false);
  }, []);
  
  // Setup microphone analysis when session becomes connected
  useEffect(() => {
    if (sessionStatus === 'CONNECTED') {
      setupMicrophoneAnalysis();
    } else {
      cleanupMicrophoneAnalysis();
    }
  }, [sessionStatus, setupMicrophoneAnalysis, cleanupMicrophoneAnalysis]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMicrophoneAnalysis();
    };
  }, [cleanupMicrophoneAnalysis]);
  
  return {
    microphoneVolume,
    isMicrophoneActive,
  };
}