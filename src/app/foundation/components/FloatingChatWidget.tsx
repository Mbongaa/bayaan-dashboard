"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import Transcript from './Transcript';
import { Z_CHATBOX, Z_TRANSCRIPT } from '@/app/styles/z-index';

interface FloatingChatWidgetProps {
  // No props needed - widget always shows full transcript
}

export default function FloatingChatWidget({}: FloatingChatWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('chatWidgetOpen');
    if (savedState === 'true') {
      setIsOpen(true);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('chatWidgetOpen', isOpen.toString());
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setHasNewMessage(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleChat}
            className={`
              fixed bottom-5 right-5 
              w-14 h-14 rounded-full
              bg-gradient-to-r from-blue-500 to-purple-600
              hover:from-blue-600 hover:to-purple-700
              text-white shadow-lg
              flex items-center justify-center
              transition-all duration-300
              ${hasNewMessage ? 'animate-pulse' : ''}
            `}
            style={{ zIndex: Z_CHATBOX }}
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-5 right-5 w-96 h-[600px] max-h-[85vh]"
            style={{ zIndex: Z_TRANSCRIPT }}
          >
            <div className="
              h-full rounded-2xl overflow-hidden
              bg-white/95 dark:bg-gray-900/95 
              backdrop-blur-xl
              border border-gray-200/50 dark:border-gray-700/50
              shadow-2xl
              flex flex-col
            ">
              {/* Header */}
              <div className="
                px-4 py-3 
                bg-gradient-to-r from-blue-500/10 to-purple-600/10
                border-b border-gray-200/50 dark:border-gray-700/50
                flex items-center justify-between
              ">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Conversation History
                  </h3>
                </div>
                <button
                  onClick={toggleChat}
                  className="
                    p-1.5 rounded-lg
                    hover:bg-gray-200/50 dark:hover:bg-gray-700/50
                    transition-colors
                  "
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Transcript Content - Full Height */}
              <div className="flex-1 overflow-hidden">
                <Transcript />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}