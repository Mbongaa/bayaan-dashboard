import React, { createContext, useContext } from 'react';
import { SessionStatus } from '../types';

interface RealtimeContextValue {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  audioElement: HTMLAudioElement | null;
  sessionRef?: React.MutableRefObject<any>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider: React.FC<{
  children: React.ReactNode;
  value: RealtimeContextValue;
}> = ({ children, value }) => {
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};