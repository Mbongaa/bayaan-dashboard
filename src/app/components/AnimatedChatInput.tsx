"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import Image from "next/image";

interface AnimatedChatInputProps {
  // Input functionality only
  userText: string;
  setUserText: (val: string) => void;
  onSendMessage: () => void;
  canSend: boolean;
}

const AnimatedChatInput: React.FC<AnimatedChatInputProps> = ({
  userText,
  setUserText,
  onSendMessage,
  canSend,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle ESC key to collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
      // Quick open with "/" key
      if (e.key === "/" && !isExpanded && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsExpanded(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  const handleSendMessage = () => {
    onSendMessage();
    // Auto-collapse after sending (optional - can be removed if not desired)
    setIsExpanded(false);
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const iconVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 200, 
        damping: 15 
      }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: { duration: 0.2 }
    },
    hover: { 
      scale: 1.1,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  const expandedVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: 10,
      scale: 0.98,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Collapsed State - Elegant Chat Icon
          <motion.button
            key="chat-icon"
            onClick={handleToggleExpanded}
            className="group relative bg-transparent border border-black/20 dark:border-white/20 rounded-full p-4 hover:border-black/30 dark:hover:border-white/30 transition-colors shadow-lg"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover="hover"
            whileTap="tap"
          >
            <MessageCircle 
              size={24} 
              className="text-black dark:text-white group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors" 
            />
            
            {/* Subtle pulse animation for attention */}
            <motion.div
              className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/10"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.button>
        ) : (
          // Expanded State - Full Input Bar
          <motion.div
            key="chat-expanded"
            className="w-full max-w-4xl flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg"
            variants={expandedVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Close button */}
            <motion.button
              onClick={handleToggleExpanded}
              className="shrink-0 p-2 rounded-full hover:bg-white/10 transition-colors"
              variants={itemVariants}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </motion.button>

            {/* Input field */}
            <motion.input
              ref={inputRef}
              type="text"
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSend) {
                  handleSendMessage();
                }
              }}
              className="flex-1 px-4 py-2 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400"
              placeholder="Type a message..."
              variants={itemVariants}
            />
            
            {/* Send button */}
            <motion.button
              onClick={handleSendMessage}
              disabled={!canSend || !userText.trim()}
              className="shrink-0 bg-black/30 backdrop-blur-sm text-white rounded-full p-2 disabled:opacity-50 hover:bg-black/40 transition-colors"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image src="arrow.svg" alt="Send" width={20} height={20} />
            </motion.button>
          </motion.div>
        )}
    </AnimatePresence>
  );
};

export default AnimatedChatInput;