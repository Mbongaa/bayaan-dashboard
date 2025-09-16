"use client";

import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSuggestionsForScenario } from '@/app/agentConfigs/suggestionConfig';

interface SuggestionCardsProps {
  scenarioKey: string;
  onSelectSuggestion: (text: string) => void;
  isVisible: boolean;
}

// Memoized component to prevent unnecessary re-renders
const PureSuggestionCards = memo(({ 
  scenarioKey, 
  onSelectSuggestion, 
  isVisible 
}: SuggestionCardsProps) => {
  const suggestions = getSuggestionsForScenario(scenarioKey);
  
  // Don't render if no suggestions for this scenario
  if (!suggestions || suggestions.length === 0) {
    return null;
  }
  
  // Don't render if not visible (conversation has started)
  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ 
          duration: 0.4, 
          ease: "easeOut",
          staggerChildren: 0.1 
        }}
        className="w-full mb-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-1">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05, // Staggered animation
                ease: "easeOut"
              }}
              onClick={() => onSelectSuggestion(suggestion.text)}
              className="
                group relative p-3 text-left
                rounded-xl border border-gray-200/50 dark:border-gray-700/50
                bg-white/50 dark:bg-gray-800/30
                hover:bg-white/80 dark:hover:bg-gray-800/50
                hover:border-gray-300/50 dark:hover:border-gray-600/50
                backdrop-blur-sm
                transition-all duration-200 ease-out
                hover:shadow-md dark:hover:shadow-lg
                hover:scale-[1.02]
                cursor-pointer
              "
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Card content */}
              <div className="flex items-start space-x-2">
                {/* Optional icon placeholder for future enhancement */}
                <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 dark:from-blue-500/20 dark:to-purple-500/20" />
                
                {/* Text content */}
                <span className="
                  flex-1 text-sm 
                  text-gray-700 dark:text-gray-200
                  group-hover:text-gray-900 dark:group-hover:text-white
                  transition-colors duration-200
                  line-clamp-2
                ">
                  {suggestion.text}
                </span>
              </div>
              
              {/* Subtle gradient overlay on hover */}
              <div className="
                absolute inset-0 rounded-xl
                bg-gradient-to-r from-blue-500/0 to-purple-500/0
                group-hover:from-blue-500/5 group-hover:to-purple-500/5
                dark:group-hover:from-blue-400/10 dark:group-hover:to-purple-400/10
                transition-all duration-300
                pointer-events-none
              " />
            </motion.button>
          ))}
        </div>
        
        {/* Optional helper text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="
            text-xs text-center mt-2 
            text-gray-500 dark:text-gray-400
            px-1
          "
        >
          Click a suggestion to get started
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
});

PureSuggestionCards.displayName = 'PureSuggestionCards';

// Main component with visibility logic
export default function SuggestionCards({
  scenarioKey,
  onSelectSuggestion,
  isVisible
}: SuggestionCardsProps) {
  // Wrap the callback to ensure it's memoized
  const handleSelectSuggestion = useCallback((text: string) => {
    onSelectSuggestion(text);
  }, [onSelectSuggestion]);
  
  return (
    <PureSuggestionCards
      scenarioKey={scenarioKey}
      onSelectSuggestion={handleSelectSuggestion}
      isVisible={isVisible}
    />
  );
}