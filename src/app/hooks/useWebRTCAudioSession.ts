import { useState, useRef, useEffect, useCallback } from 'react';
import { useRealtimeContext } from '../contexts/RealtimeContext';

export type { ConversationState };

type ConversationState = 'idle' | 'user_speaking' | 'agent_speaking';

interface UseWebRTCAudioSessionReturn {
  currentVolume: number;
  isSessionActive: boolean;
  conversationState: ConversationState;
  handleStartStopClick: () => void;
}

export function useWebRTCAudioSession(_voice: string): UseWebRTCAudioSessionReturn {
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  
  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number>(0);
  const volumeHistoryRef = useRef<number[]>([]);
  const smoothedVolumeRef = useRef<number>(0);
  
  // Get session status and controls from context
  const { sessionStatus, onToggleConnection, audioElement, sessionRef } = useRealtimeContext();
  
  const isSessionActive = sessionStatus === 'CONNECTED';
  const handleStartStopClick = onToggleConnection;
  
  const setupAudioAnalysis = useCallback(async () => {
    if (!audioElement || !audioElement.srcObject) {
      console.log('[useWebRTCAudioSession] No audio element or srcObject available');
      return;
    }
    
    try {
      console.log('[useWebRTCAudioSession] Setting up audio analysis...');
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
      
      // Connect MediaStream source
      const source = audioContextRef.current.createMediaStreamSource(
        audioElement.srcObject as MediaStream
      );
      source.connect(analyserRef.current);
      
      // Start analysis loop
      analyzeAudio();
      console.log('[useWebRTCAudioSession] Audio analysis setup complete');
    } catch (error) {
      console.error('[useWebRTCAudioSession] Audio analysis setup failed:', error);
    }
  }, [audioElement]);
  
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate volume (RMS)
    let sum = 0;
    const dataArray = dataArrayRef.current;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rawVolume = Math.sqrt(sum / dataArray.length) / 255;
    
    // Apply smoothing to reduce chaotic movement
    const historySize = 5;
    volumeHistoryRef.current.push(rawVolume);
    if (volumeHistoryRef.current.length > historySize) {
      volumeHistoryRef.current.shift();
    }
    
    // Calculate smoothed volume (moving average)
    const smoothedVolume = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length;
    
    // Apply exponential smoothing for stability
    const smoothingFactor = 0.3;
    smoothedVolumeRef.current = smoothedVolumeRef.current * (1 - smoothingFactor) + smoothedVolume * smoothingFactor;
    
    // Clamp volume to reasonable range
    const clampedVolume = Math.min(smoothedVolumeRef.current, 0.5);
    
    setCurrentVolume(clampedVolume);
    
    // Continue analysis loop if audio context is active
    if (analyserRef.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, []);
  
  const cleanupAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
    volumeHistoryRef.current = [];
    smoothedVolumeRef.current = 0;
    setCurrentVolume(0);
  }, []);
  
  // Setup audio analysis when session becomes active
  useEffect(() => {
    if (isSessionActive) {
      // Delay setup to ensure audio element is available
      const timer = setTimeout(setupAudioAnalysis, 1000);
      return () => clearTimeout(timer);
    } else {
      cleanupAudioAnalysis();
    }
  }, [isSessionActive, setupAudioAnalysis, cleanupAudioAnalysis]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioAnalysis();
    };
  }, [cleanupAudioAnalysis]);
  
  // Handle conversation state events
  const handleConversationEvents = useCallback((event: any) => {
    console.log('[useWebRTCAudioSession] Transport event:', event.type); // Debug logging
    switch (event.type) {
      case 'output_audio_buffer.started':
        console.log('[useWebRTCAudioSession] Agent speaking - setting agent_speaking state');
        setConversationState('agent_speaking');
        break;
      case 'input_audio_buffer.speech_started':
        console.log('[useWebRTCAudioSession] User speaking - setting user_speaking state (SHRINK)');
        setConversationState('user_speaking'); // This is when user is actually speaking - SHRINK
        break;
      case 'input_audio_buffer.cleared':
        console.log('[useWebRTCAudioSession] PTT started - setting user_speaking state (SHRINK)');
        setConversationState('user_speaking'); // PTT mode - user is about to speak - SHRINK
        break;
      case 'input_audio_buffer.speech_stopped':
      case 'input_audio_buffer.committed':
      case 'response.done':
        console.log('[useWebRTCAudioSession] Setting idle state');
        setConversationState('idle');
        break;
      default:
        break;
    }
  }, []);

  // Subscribe to transport events for conversation state
  useEffect(() => {
    if (sessionRef?.current) {
      sessionRef.current.on('transport_event', handleConversationEvents);
      return () => {
        sessionRef.current?.off('transport_event', handleConversationEvents);
      };
    }
  }, [sessionRef?.current, handleConversationEvents]);

  // Reset conversation state when session disconnects
  useEffect(() => {
    if (!isSessionActive) {
      setConversationState('idle');
    }
  }, [isSessionActive]);

  return {
    currentVolume,
    isSessionActive,
    conversationState,
    handleStartStopClick,
  };
}