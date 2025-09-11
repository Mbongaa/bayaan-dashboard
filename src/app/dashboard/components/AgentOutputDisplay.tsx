"use client";

import React, { useEffect, useState } from 'react';
import { useTranscript } from '@/app/foundation/contexts/TranscriptContext';
import TypewriterText from '@/app/foundation/components/TypewriterText';
import { TranscriptItem } from '@/app/shared/types/types';

/**
 * AgentOutputDisplay Component
 * 
 * Displays the latest agent message with a typewriter effect.
 * Minimal design - just text, no container or background.
 */
export function AgentOutputDisplay() {
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

  // Truncate very long messages for header display
  const displayText = latestAgentMessage.length > 150 
    ? latestAgentMessage.substring(0, 150) + '...'
    : latestAgentMessage;

  return (
    <div 
      className="flex-1 ml-6"
      style={{
        minWidth: 0, // Allow text to shrink
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
    >
      <TypewriterText
        key={messageKey} // Force re-render on new message
        text={displayText}
        typingSpeed={25}
        showCursor={true}
        cursorCharacter="|"
        className="text-gray-600 dark:text-gray-400 text-sm font-normal"
        isLatestMessage={true}
      />
    </div>
  );
}

export default AgentOutputDisplay;