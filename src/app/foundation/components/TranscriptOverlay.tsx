"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import Transcript from './Transcript';
import { Z_TRANSCRIPT } from '@/app/styles/z-index';

interface TranscriptOverlayProps {
  isVisible?: boolean;
  uiMode?: 'default' | 'compact';
}

export default function TranscriptOverlay({ 
  isVisible = true,
  uiMode = 'compact' 
}: TranscriptOverlayProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed ${isExpanded ? 'inset-4' : 'top-4 right-4'} ${isMinimized ? 'w-12 h-12' : isExpanded ? '' : 'w-96 h-[60vh]'}`}
        style={{ zIndex: Z_TRANSCRIPT }}
      >
        <div className={`
          ${isMinimized ? 'rounded-full' : 'rounded-2xl'}
          bg-white/10 dark:bg-black/10 backdrop-blur-md
          border border-gray-400/20 dark:border-gray-700/20
          shadow-lg h-full w-full
          flex flex-col
          transition-all duration-300
        `}>
          {/* Header */}
          <div className={`
            ${isMinimized ? 'hidden' : 'flex'}
            items-center justify-between
            p-3 border-b border-gray-400/20 dark:border-gray-700/20
          `}>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Chat Transcript
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded transition-colors"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded transition-colors"
                aria-label="Minimize"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="flex-1 overflow-hidden">
              <Transcript uiMode={uiMode} />
            </div>
          )}

          {/* Minimized State */}
          {isMinimized && (
            <button
              onClick={() => setIsMinimized(false)}
              className="w-full h-full flex items-center justify-center hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Restore transcript"
            >
              <MessageSquare className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}