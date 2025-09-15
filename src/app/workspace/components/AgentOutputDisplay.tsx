"use client";

import React, { useEffect, useState } from 'react';
import { useTranscript } from '@/app/foundation/contexts/TranscriptContext';
import TypewriterText from '@/app/foundation/components/TypewriterText';
import { TranscriptItem } from '@/app/shared/types/types';

interface AgentOutputDisplayProps {
  mode?: 'voice' | 'workspace';
}

/**
 * AgentOutputDisplay Component
 * 
 * Displays the latest agent message with a typewriter effect.
 * Minimal design - just text, no container or background.
 * Can be styled differently for voice mode vs workspace mode.
 */
export function AgentOutputDisplay({ mode = 'workspace' }: AgentOutputDisplayProps) {
  const { transcriptItems } = useTranscript();
  const [latestAgentMessage, setLatestAgentMessage] = useState<string>('');
  const [messageKey, setMessageKey] = useState<number>(0);

  useEffect(() => {
    // Find the latest assistant message
    const agentMessages = transcriptItems.filter(
      item => item.type === 'MESSAGE' && item.role === 'assistant'
    );
    
    if (agentMessages.length > 0) {
      const latestMessage = agentMessages[agentMessages.length - 1];
      const messageText = latestMessage.title || '';
      
      // Only update if the message has changed
      if (messageText !== latestAgentMessage) {
        setLatestAgentMessage(messageText);
        // Change key to trigger re-animation
        setMessageKey(prev => prev + 1);
      }
    }
  }, [transcriptItems, latestAgentMessage]);

  // Don't render anything if there's no message
  if (!latestAgentMessage) {
    return null;
  }

  // Mode-specific configuration
  const isVoiceMode = mode === 'voice';
  
  // Truncate for workspace mode, show full text for voice mode
  const displayText = isVoiceMode 
    ? latestAgentMessage 
    : latestAgentMessage.length > 150 
      ? latestAgentMessage.substring(0, 150) + '...'
      : latestAgentMessage;
  
  // Different cursor characters for different modes
  const cursorChar = isVoiceMode ? "•" : "|";
  
  // Different text styles for different modes
  const textClassName = isVoiceMode 
    ? "text-white text-xl font-light"
    : "text-gray-600 dark:text-gray-400 text-sm font-normal";
  
  // Different container styles for different modes
  const containerStyle = isVoiceMode 
    ? {
        minWidth: 0,
        wordWrap: 'break-word' as const,
        whiteSpace: 'pre-wrap' as const,
      }
    : {
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      };

  return (
    <div 
      className={!isVoiceMode ? "flex-1 ml-6" : ""}
      style={containerStyle}
    >
      <TypewriterText
        key={messageKey} // Force re-render on new message
        text={displayText}
        typingSpeed={25}
        showCursor={true}
        cursorCharacter={cursorChar}
        className={textClassName}
        isLatestMessage={true}
      />
    </div>
  );
}

export default AgentOutputDisplay;