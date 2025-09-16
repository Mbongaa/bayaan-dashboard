"use-client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { TranscriptItem } from "@/app/shared/types/types";
import { useTranscript } from "@/app/foundation/contexts/TranscriptContext";
import { GuardrailChip } from "./_archive/ui-elements/GuardrailChip";
import TypewriterText from "./TypewriterText";

export interface TranscriptProps extends Record<string, never> {
  // No props needed - transcript always shows full history
}

function Transcript({}: TranscriptProps = {}) {
  const { transcriptItems, toggleTranscriptItemExpand } = useTranscript();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
  const [typedMessages, setTypedMessages] = useState<Set<string>>(new Set());
  const [showNotification] = useState<boolean>(false);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

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



  
  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">

        {/* Transcript Content */}
        <div
          ref={transcriptRef}
          className="flex flex-col h-full scrollbar-hide p-4 gap-y-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {(() => {
            const sortedItems = [...transcriptItems].sort((a, b) => a.createdAtMs - b.createdAtMs);
            
            // Find the latest agent message (not user, not breadcrumb)
            const latestAgentMessage = sortedItems
              .filter(item => item.type === "MESSAGE" && item.role === "assistant")
              .pop();
            const latestAgentMessageId = latestAgentMessage?.itemId;
            
            // Always show all items
            const itemsToDisplay = sortedItems;
            
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
              const bubbleBase = `max-w-lg p-3 ${
                isUser 
                  ? "bg-transparent text-gray-600 dark:bg-transparent dark:text-gray-400 text-sm" 
                  : "bg-transparent text-gray-800 dark:bg-transparent dark:text-white text-lg"
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
                  <div className="max-w-lg">
                    <div
                      className={`${bubbleBase} rounded-t-xl ${
                        guardrailResult ? "" : "rounded-b-xl"
                      }`}
                    >
                      <div
                        className={`text-xs ${
                          isUser ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
                        } font-mono`}
                      >
                        {timestamp}
                      </div>
                      <div className={`whitespace-pre-wrap ${messageStyle}`}>
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
    </>
  );
}

export default Transcript;
