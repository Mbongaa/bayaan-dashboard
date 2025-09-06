"use-client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { TranscriptItem } from "@/app/shared/types/types";
import { useTranscript } from "@/app/foundation/contexts/TranscriptContext";
import { GuardrailChip } from "./GuardrailChip";
import TypewriterText from "./TypewriterText";

export interface TranscriptProps {
  uiMode?: 'default' | 'compact';
}

function Transcript({ uiMode = 'default' }: TranscriptProps) {
  const { transcriptItems, toggleTranscriptItemExpand } = useTranscript();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
  const [typedMessages, setTypedMessages] = useState<Set<string>>(new Set());
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<'default' | 'compact'>(uiMode);

  function scrollToBottom() {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }

  function scrollToBottomSmooth() {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTo({
        top: transcriptRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  // Handle mode transitions with fade effect
  useEffect(() => {
    if (uiMode !== currentMode) {
      setIsTransitioning(true);
      
      // Fade out
      setTimeout(() => {
        setCurrentMode(uiMode);
        
        // Fade back in
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 300);
    }
  }, [uiMode, currentMode]);

  useEffect(() => {
    const hasNewMessage = transcriptItems.length > prevLogs.length;
    const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
      const oldItem = prevLogs[index];
      return (
        oldItem &&
        (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) {
      scrollToBottom();
    }

    // Check for new breadcrumbs
    const latestBreadcrumb = transcriptItems
      .filter(item => item.type === "BREADCRUMB")
      .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];
    
    const prevLatestBreadcrumb = prevLogs
      .filter(item => item.type === "BREADCRUMB")
      .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];
    
    if (latestBreadcrumb && (!prevLatestBreadcrumb || latestBreadcrumb.itemId !== prevLatestBreadcrumb.itemId)) {
      // New breadcrumb detected, show notification
      setShowNotification(true);
      
      // Clear existing timer
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      
      // Hide after 5 seconds
      notificationTimerRef.current = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }

    setPrevLogs(transcriptItems);
  }, [transcriptItems]);



  const isCompactMode = currentMode === 'compact';
  
  return (
    <>
      <div className={`
        flex flex-col pointer-events-none transition-all duration-700 ease-out transform-gpu
        ${isCompactMode 
          ? 'fixed top-[4vh] left-[100px] right-[10vw] h-[10vh] max-h-[10vh] z-40' 
          : 'flex-1 min-h-0 scale-100 translate-x-0 translate-y-0'
        }
        ${isTransitioning ? 'opacity-0' : 'opacity-100'}
      `}>
      <div className={`flex flex-col ${isCompactMode ? 'h-full' : 'flex-1 min-h-0'}`}>

        {/* Transcript Content */}
        <div
          ref={transcriptRef}
          className={`flex flex-col h-full pointer-events-auto scrollbar-hide ${
            isCompactMode ? 'p-3 gap-y-1 overflow-hidden' : 'p-4 gap-y-4 overflow-auto'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {(() => {
            const sortedItems = [...transcriptItems].sort((a, b) => a.createdAtMs - b.createdAtMs);
            
            // Find the latest agent message (not user, not breadcrumb)
            const latestAgentMessage = sortedItems
              .filter(item => item.type === "MESSAGE" && item.role === "assistant")
              .pop();
            const latestAgentMessageId = latestAgentMessage?.itemId;
            
            // Filter items based on mode - show only latest assistant message in compact mode
            const itemsToDisplay = isCompactMode 
              ? (latestAgentMessage ? [latestAgentMessage] : [])
              : sortedItems;
            
            return itemsToDisplay.map((item) => {
              const {
                itemId,
                type,
                role,
                data,
                expanded,
                timestamp,
                title = "",
                isHidden,
                guardrailResult,
              } = item;

            if (isHidden) {
              return null;
            }

            if (type === "MESSAGE") {
              const isUser = role === "user";
              const containerClasses = `flex justify-end flex-col ${
                isUser ? "items-end" : "items-start"
              }`;
              const bubbleBase = `${isCompactMode ? 'w-full' : 'max-w-lg'} ${isCompactMode ? 'p-2' : 'p-3'} ${
                isUser 
                  ? "bg-transparent text-gray-600 dark:bg-transparent dark:text-gray-400 text-sm" 
                  : isCompactMode
                  ? "bg-transparent text-gray-900 dark:bg-transparent dark:text-gray-100 text-base"
                  : "bg-transparent text-gray-900 dark:bg-transparent dark:text-gray-100 text-lg"
              }`;
              const isBracketedMessage =
                title.startsWith("[") && title.endsWith("]");
              const messageStyle = isBracketedMessage
                ? 'italic text-gray-400 dark:text-gray-500'
                : '';
              const displayTitle = isBracketedMessage
                ? title.slice(1, -1)
                : title;

              return (
                <div key={itemId} className={containerClasses}>
                  <div className={`${isCompactMode ? 'w-full' : 'max-w-lg'}`}>
                    <div
                      className={`${bubbleBase} rounded-t-xl ${
                        guardrailResult ? "" : "rounded-b-xl"
                      }`}
                    >
                      {!isCompactMode && (
                        <div
                          className={`text-xs ${
                            isUser ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
                          } font-mono`}
                        >
                          {timestamp}
                        </div>
                      )}
                      <div className={`${isCompactMode ? 'line-clamp-3' : 'whitespace-pre-wrap'} ${messageStyle}`}>
                        {!isUser && !isBracketedMessage && !typedMessages.has(`${itemId}-${displayTitle}`) ? (
                          <TypewriterText
                            key={`typewriter-${itemId}`}
                            text={displayTitle}
                            typingSpeed={25}
                            showCursor={true}
                            cursorCharacter="●"
                            isLatestMessage={itemId === latestAgentMessageId}
                            onComplete={() => {
                              setTypedMessages(prev => new Set(prev).add(`${itemId}-${displayTitle}`));
                              scrollToBottomSmooth();
                            }}
                          />
                        ) : (
                          <ReactMarkdown>{displayTitle}</ReactMarkdown>
                        )}
                      </div>
                    </div>
                    {guardrailResult && (
                      <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-b-xl">
                        <GuardrailChip guardrailResult={guardrailResult} />
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (type === "BREADCRUMB") {
              return (
                <div
                  key={itemId}
                  className="flex flex-col justify-start items-start text-gray-600 dark:text-gray-400 text-sm"
                >
                  <span className="text-xs font-mono">{timestamp}</span>
                  <div
                    className={`whitespace-pre-wrap flex items-center font-mono text-sm text-gray-600 dark:text-gray-400 ${
                      data ? "cursor-pointer" : ""
                    }`}
                    onClick={() => data && toggleTranscriptItemExpand(itemId)}
                  >
                    {data && (
                      <span
                        className={`text-gray-400 dark:text-gray-500 mr-1 transform transition-transform duration-200 select-none font-mono ${
                          expanded ? "rotate-90" : "rotate-0"
                        }`}
                      >
                        ▶
                      </span>
                    )}
                    {title}
                  </div>
                  {expanded && data && (
                    <div className="text-gray-800 dark:text-gray-200 text-left">
                      <pre className="border-l-2 ml-1 border-white/20 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            } else {
              // Fallback if type is neither MESSAGE nor BREADCRUMB
              return (
                <div
                  key={itemId}
                  className="flex justify-center text-gray-500 dark:text-gray-400 text-sm italic font-mono"
                >
                  Unknown item type: {type}{" "}
                  <span className="ml-2 text-xs">{timestamp}</span>
                </div>
              );
            }
            });
          })()}
        </div>
      </div>

    </div>
    
    {/* Compact Mode Notification Area - Bottom Left for Breadcrumbs */}
    {isCompactMode && (
      <div className={`fixed bottom-[2.5rem] left-[0.5rem] max-w-[300px] h-[3rem] z-30 
        bg-gray-100/5 dark:bg-black/5 backdrop-blur-sm 
        border border-gray-200/10 dark:border-gray-700/10 rounded-xl 
        transition-all duration-500 ease-out pointer-events-auto
        ${showNotification && !isTransitioning ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
        <div className="h-full px-3 py-1.5 flex items-center">
          {(() => {
            // Get the latest breadcrumb
            const latestBreadcrumb = [...transcriptItems]
              .filter(item => item.type === "BREADCRUMB")
              .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];
            
            if (!latestBreadcrumb) return null;
            
            const { title, timestamp } = latestBreadcrumb;
            
            // Determine icon and color based on breadcrumb content
            const isAgent = title.toLowerCase().includes('agent');
            const isTool = title.toLowerCase().includes('tool') || title.toLowerCase().includes('function');
            
            return (
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className={`text-sm
                  ${isAgent ? 'text-blue-500 dark:text-blue-400' : 
                    isTool ? 'text-green-500 dark:text-green-400' : 
                    'text-gray-500 dark:text-gray-400'}
                `}>
                  {isAgent ? '👤' : isTool ? '🔧' : '📍'}
                </span>
                <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                  {title}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-500 ml-1">
                  {timestamp}
                </span>
              </div>
            );
          })()}
        </div>
      </div>
    )}
    </>
  );
}

export default Transcript;
