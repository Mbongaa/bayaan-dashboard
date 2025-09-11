"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranscript } from '@/app/foundation/contexts/TranscriptContext';
import { TranscriptItem } from '@/app/shared/types/types';
import { Z_NOTIFICATION } from '@/app/styles/z-index';

/**
 * WorkspaceNotification Component
 * 
 * Displays tool and agent change notifications in the bottom-left of the workspace.
 * Shows breadcrumb updates with smooth fade-in/out animations.
 */
export function WorkspaceNotification() {
  const { transcriptItems } = useTranscript();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [currentBreadcrumb, setCurrentBreadcrumb] = useState<TranscriptItem | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevItemsRef = useRef<TranscriptItem[]>([]);

  useEffect(() => {
    // Get the latest breadcrumb
    const latestBreadcrumb = transcriptItems
      .filter(item => item.type === "BREADCRUMB")
      .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];
    
    const prevLatestBreadcrumb = prevItemsRef.current
      .filter(item => item.type === "BREADCRUMB")
      .sort((a, b) => b.createdAtMs - a.createdAtMs)[0];
    
    // Check if there's a new breadcrumb
    if (latestBreadcrumb && (!prevLatestBreadcrumb || latestBreadcrumb.itemId !== prevLatestBreadcrumb.itemId)) {
      // New breadcrumb detected
      setCurrentBreadcrumb(latestBreadcrumb);
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

    // Update previous items
    prevItemsRef.current = transcriptItems;
  }, [transcriptItems]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  if (!currentBreadcrumb) return null;

  const { title, timestamp } = currentBreadcrumb;
  
  // Determine icon and color based on breadcrumb content
  const isAgent = title?.toLowerCase().includes('agent') || false;
  const isTool = title?.toLowerCase().includes('tool') || title?.toLowerCase().includes('function') || false;
  const isWorkflow = title?.toLowerCase().includes('workflow') || title?.toLowerCase().includes('action') || false;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ 
            type: 'spring',
            damping: 20,
            stiffness: 300,
            duration: 0.3 
          }}
          className="fixed bottom-6 left-24 max-w-sm"
          style={{ zIndex: Z_NOTIFICATION }}
        >
          <div className="
            bg-white/95 dark:bg-gray-900/95
            backdrop-blur-xl
            border border-gray-200/50 dark:border-gray-700/50
            rounded-2xl
            shadow-xl
            px-4 py-3
            pointer-events-auto
          ">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full
                flex items-center justify-center
                ${isAgent ? 'bg-blue-100 dark:bg-blue-900/30' : 
                  isTool ? 'bg-green-100 dark:bg-green-900/30' :
                  isWorkflow ? 'bg-purple-100 dark:bg-purple-900/30' :
                  'bg-gray-100 dark:bg-gray-900/30'}
              `}>
                <span className="text-base">
                  {isAgent ? '👤' : isTool ? '🔧' : isWorkflow ? '⚡' : '📍'}
                </span>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`
                  text-sm font-medium
                  ${isAgent ? 'text-blue-700 dark:text-blue-300' : 
                    isTool ? 'text-green-700 dark:text-green-300' :
                    isWorkflow ? 'text-purple-700 dark:text-purple-300' :
                    'text-gray-700 dark:text-gray-300'}
                `}>
                  {title || 'Processing...'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {timestamp}
                </p>
              </div>

              {/* Progress indicator for ongoing actions */}
              {isTool && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WorkspaceNotification;