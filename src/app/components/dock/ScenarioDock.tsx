"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Power,
  Brain,
  Shuffle,
  Headset,
  MessageSquare,
  Languages,
} from 'lucide-react';

interface ScenarioDockProps {
  onConnect: () => void;
  onDisconnect: () => void;
  onScenarioSelect: (scenarioKey: string) => void;
  selectedScenario?: string;
  isConnected: boolean;
  sessionStatus: string;
}

interface ScenarioConfig {
  key: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const scenarios: ScenarioConfig[] = [
  {
    key: 'bayaanGeneral',
    name: 'Bayaan General',
    icon: <Brain className="w-5 h-5" />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    key: 'simpleHandoff',
    name: 'Simple Handoff',
    icon: <Shuffle className="w-5 h-5" />,
    color: 'from-green-500 to-emerald-500',
  },
  {
    key: 'customerServiceRetail',
    name: 'Customer Service',
    icon: <Headset className="w-5 h-5" />,
    color: 'from-orange-500 to-red-500',
  },
  {
    key: 'chatSupervisor',
    name: 'Chat Supervisor',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    key: 'translationDirect',
    name: 'Translation Direct',
    icon: <Languages className="w-5 h-5" />,
    color: 'from-teal-500 to-blue-500',
  },
];

export default function ScenarioDock({
  onConnect,
  onDisconnect,
  onScenarioSelect,
  selectedScenario,
  isConnected,
  sessionStatus,
}: ScenarioDockProps) {
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null);
  
  // Determine if the dock should show as "active" based on connection state
  const localVisible = isConnected || sessionStatus === "CONNECTING";

  const handleToggle = () => {
    if (isConnected || sessionStatus === "CONNECTING") {
      onDisconnect();
    } else {
      onConnect();
    }
  };

  const handleScenarioClick = (scenarioKey: string) => {
    // First select the scenario
    onScenarioSelect(scenarioKey);
    
    // If not connected, also trigger connection
    if (!isConnected && sessionStatus !== "CONNECTING") {
      setTimeout(() => onConnect(), 100);
    }
  };

  return (
    <div className="relative">
      {/* Main Dock Container */}
      <motion.div
        className="flex flex-col items-center gap-2 p-2 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Toggle Button */}
        <motion.button
          onClick={handleToggle}
          className={`
            relative w-12 h-12 rounded-xl flex items-center justify-center
            transition-all duration-300 group
            ${localVisible 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25' 
              : 'bg-gradient-to-br from-gray-600 to-gray-700 shadow-lg shadow-gray-500/25'
            }
            hover:scale-110 active:scale-95
          `}
          whileHover={{ rotate: localVisible ? 0 : 180 }}
          whileTap={{ scale: 0.9 }}
        >
          <Power 
            className={`w-5 h-5 transition-colors duration-300 ${
              localVisible ? 'text-white' : 'text-gray-400'
            }`}
          />
          
          {/* Glow effect when on */}
          {localVisible && (
            <motion.div
              className="absolute inset-0 rounded-xl bg-green-400/30"
              initial={{ scale: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </motion.button>

        {/* Divider */}
        <div className="w-10 h-px bg-white/20 dark:bg-white/10 my-1" />

        {/* Scenario Icons */}
        <AnimatePresence>
          {localVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-2 overflow-hidden"
            >
              {scenarios.map((scenario, index) => {
                const isSelected = selectedScenario === scenario.key;
                const isCurrentlyConnected = isSelected && isConnected;
                
                return (
                  <motion.button
                    key={scenario.key}
                    onClick={() => handleScenarioClick(scenario.key)}
                    onMouseEnter={() => setHoveredScenario(scenario.key)}
                    onMouseLeave={() => setHoveredScenario(null)}
                    className={`
                      relative w-12 h-12 rounded-xl flex items-center justify-center
                      transition-all duration-300 group
                      ${isCurrentlyConnected
                        ? `bg-gradient-to-br ${scenario.color} shadow-lg text-white`
                        : isSelected
                        ? 'bg-white/20 dark:bg-white/10 text-white'
                        : 'bg-white/10 dark:bg-black/20 hover:bg-white/20 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400'
                      }
                    `}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {scenario.icon}
                    
                    {/* Connection pulse animation */}
                    {isCurrentlyConnected && (
                      <motion.div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-br ${scenario.color} opacity-30`}
                        initial={{ scale: 1 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                    )}
                    
                    {/* Tooltip */}
                    <AnimatePresence>
                      {hoveredScenario === scenario.key && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="absolute right-full mr-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-50"
                        >
                          {scenario.name}
                          {isCurrentlyConnected && (
                            <span className="ml-2 text-green-400">● Connected</span>
                          )}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-0 h-0 
                            border-t-[4px] border-t-transparent 
                            border-b-[4px] border-b-transparent 
                            border-l-[4px] border-l-gray-900 dark:border-l-gray-800" 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status indicator dot */}
      {isConnected && (
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 1
          }}
        />
      )}
    </div>
  );
}