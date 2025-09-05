"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Settings, 
  X, 
  Bot, 
  Mic, 
  Monitor 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/shared/lib/utils";

interface AgentSettingsMenuProps {
  // Agent Configuration
  agentSetKey: string;
  allAgentSets: Record<string, any>;
  selectedAgentName: string;
  selectedAgentConfigSet: any[] | null;
  onAgentChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSelectedAgentChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;

  // Voice & Turn Detection Settings
  vadType: 'server_vad' | 'semantic_vad' | 'disabled';
  vadSilenceDuration: number;
  vadThreshold: number;
  semanticVadEagerness: 'auto' | 'low' | 'medium' | 'high';
  selectedVoice: string;
  onVadTypeChange: (value: 'server_vad' | 'semantic_vad' | 'disabled') => void;
  onVadSilenceDurationChange: (value: number) => void;
  onVadThresholdChange: (value: number) => void;
  onSemanticVadEagernessChange: (value: 'auto' | 'low' | 'medium' | 'high') => void;
  onVoiceChange: (value: string) => void;

  // Codec Settings
  codec: string;
  onCodecChange: (codec: string) => void;
  
  // UI Settings
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (enabled: boolean) => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (expanded: boolean) => void;
  isPTTActive: boolean;
  setIsPTTActive: (active: boolean) => void;
  isAutoConnectEnabled: boolean;
  setIsAutoConnectEnabled: (enabled: boolean) => void;
  isDockVisible: boolean;
  setIsDockVisible: (visible: boolean) => void;
  
  // Session Status
  sessionStatus: string;
}

const menuCategories = [
  { 
    label: "Agent", 
    slug: "agent", 
    icon: Bot 
  },
  {
    label: "Voice",
    slug: "voice",
    icon: Mic
  },
  {
    label: "Interface",
    slug: "interface",
    icon: Monitor
  },
] as const;

export default function ChatboxSettingsMenu(props: AgentSettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subMenuSelected, setSubMenuSelected] = useState("agent");
  const [hasChanges, setHasChanges] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.getElementById("settings-icon-portal");
    setPortalContainer(container);
  }, []);

  const handleOpenSettings = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasChanges(false);
    }
  };

  const handleApplyChanges = () => {
    setIsOpen(false);
    toast.success("Settings Applied", {
      description: "Your changes have been saved successfully",
    });
    setHasChanges(false);
  };

  // Settings icon that goes in the chatbox (needs tooltip import)
  const settingsIcon = (
    <button
      className="flex h-8 w-8 items-center justify-center rounded-full text-foreground dark:text-white transition-colors hover:bg-accent dark:hover:bg-[#515151] focus-visible:outline-none"
      onClick={handleOpenSettings}
      type="button"
      title="Agent Settings"
    >
      <Settings className="w-5 h-5" />
    </button>
  );

  // Modal overlay that appears when settings are opened
  const settingsModal = isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{
          type: "spring",
          duration: 0.5,
          damping: 25,
          stiffness: 120,
        }}
        className="relative bg-gray-900 text-gray-50 rounded-2xl shadow-2xl border border-gray-700 w-96 max-w-[90vw] max-h-[80vh] overflow-hidden"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Agent Settings
            </h2>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition-colors"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-row gap-1 mb-4">
            {menuCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  className={cn(
                    "relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 font-medium text-sm transition-all duration-200 hover:text-gray-100",
                    subMenuSelected === category.slug 
                      ? "text-gray-100" 
                      : "text-gray-400"
                  )}
                  key={category.label}
                  onClick={() => {
                    setSubMenuSelected(category.slug);
                    setHasChanges(false);
                  }}
                  type="button"
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="z-20">{category.label}</span>
                  <AnimatePresence>
                    {subMenuSelected === category.slug && (
                      <motion.div
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-10 rounded-md bg-gray-700"
                        exit={{ opacity: 0, scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        layout={true}
                        layoutId="focused-element"
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      />
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="min-h-[200px] max-h-[50vh] overflow-y-auto">
            {subMenuSelected === "agent" && (
              <AgentSection {...props} setHasChanges={setHasChanges} />
            )}
            {subMenuSelected === "voice" && (
              <VoiceSection {...props} setHasChanges={setHasChanges} />
            )}
            {subMenuSelected === "interface" && (
              <InterfaceSection {...props} setHasChanges={setHasChanges} />
            )}
          </div>

          {/* Footer */}
          {hasChanges && (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              initial={{ opacity: 0, scale: 0.95 }}
              className="flex justify-between items-center pt-4 mt-4 border-t border-gray-700"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-gray-400 text-xs">Unsaved changes</p>
              </div>
              <button
                className="rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2 font-medium text-white text-sm transition-colors"
                onClick={handleApplyChanges}
                type="button"
              >
                Apply Changes
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  ) : null;

  return (
    <>
      {/* Settings icon portaled into chatbox */}
      {portalContainer && createPortal(settingsIcon, portalContainer)}
      
      {/* Settings modal */}
      <AnimatePresence>
        {settingsModal}
      </AnimatePresence>
    </>
  );
}

// Reuse the same section components from AgentSettingsMenuV2
function AgentSection({ 
  agentSetKey, 
  allAgentSets, 
  selectedAgentName, 
  selectedAgentConfigSet, 
  onAgentChange, 
  onSelectedAgentChange,
  setHasChanges 
}: AgentSettingsMenuProps & { setHasChanges: (hasChanges: boolean) => void }) {
  return (
    <motion.div
      animate={{ opacity: 1, filter: "blur(0px)" }}
      className="space-y-4"
      initial={{ opacity: 0, filter: "blur(4px)" }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Agent Scenario
        </label>
        <select
          value={agentSetKey}
          onChange={(e) => {
            onAgentChange(e);
            setHasChanges(true);
          }}
          className="w-full border border-gray-600 rounded-lg text-sm px-3 py-2 bg-gray-800 text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Object.keys(allAgentSets).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      {selectedAgentConfigSet && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Active Agent
          </label>
          <select
            value={selectedAgentName}
            onChange={(e) => {
              onSelectedAgentChange(e);
              setHasChanges(true);
            }}
            className="w-full border border-gray-600 rounded-lg text-sm px-3 py-2 bg-gray-800 text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {selectedAgentConfigSet.map((agent) => (
              <option key={agent.name} value={agent.name}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="text-xs text-gray-400 bg-gray-800 rounded-lg p-3">
        <p><strong>Current:</strong> {selectedAgentName || 'None'}</p>
        <p><strong>Scenario:</strong> {agentSetKey}</p>
      </div>
    </motion.div>
  );
}

function VoiceSection({ 
  vadType, 
  vadSilenceDuration, 
  vadThreshold, 
  semanticVadEagerness, 
  selectedVoice, 
  onVadTypeChange, 
  onVadSilenceDurationChange, 
  onVadThresholdChange, 
  onSemanticVadEagernessChange, 
  onVoiceChange,
  codec,
  onCodecChange,
  sessionStatus,
  setHasChanges 
}: AgentSettingsMenuProps & { setHasChanges: (hasChanges: boolean) => void }) {
  return (
    <motion.div
      animate={{ opacity: 1, filter: "blur(0px)" }}
      className="space-y-4"
      initial={{ opacity: 0, filter: "blur(4px)" }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Voice Model
        </label>
        <select
          value={selectedVoice}
          onChange={(e) => {
            onVoiceChange(e.target.value);
            setHasChanges(true);
          }}
          disabled={sessionStatus !== "DISCONNECTED"}
          className="w-full border border-gray-600 rounded-lg text-sm px-3 py-2 bg-gray-800 text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-700 disabled:text-gray-400"
        >
          <option value="alloy">alloy</option>
          <option value="ash">ash</option>
          <option value="ballad">ballad</option>
          <option value="cedar">cedar</option>
          <option value="coral">coral</option>
          <option value="echo">echo</option>
          <option value="marin">marin</option>
          <option value="sage">sage</option>
          <option value="shimmer">shimmer</option>
          <option value="verse">verse</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Turn Detection
        </label>
        <select
          value={vadType}
          onChange={(e) => {
            onVadTypeChange(e.target.value as 'server_vad' | 'semantic_vad' | 'disabled');
            setHasChanges(true);
          }}
          disabled={sessionStatus !== "DISCONNECTED"}
          className="w-full border border-gray-600 rounded-lg text-sm px-3 py-2 bg-gray-800 text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-700 disabled:text-gray-400"
        >
          <option value="server_vad">Server VAD</option>
          <option value="semantic_vad">Semantic VAD</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {vadType === 'server_vad' && (
        <div className="space-y-3 p-3 border border-gray-600 rounded-lg bg-gray-800/50">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Silence Duration (ms)
            </label>
            <input
              type="number"
              value={vadSilenceDuration}
              onChange={(e) => {
                onVadSilenceDurationChange(Number(e.target.value));
                setHasChanges(true);
              }}
              min="100"
              max="5000"
              step="100"
              className="w-full px-2 py-1 text-sm border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Threshold
            </label>
            <input
              type="number"
              value={vadThreshold}
              onChange={(e) => {
                onVadThresholdChange(Number(e.target.value));
                setHasChanges(true);
              }}
              min="0.1"
              max="1.0"
              step="0.1"
              className="w-full px-2 py-1 text-sm border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-50"
            />
          </div>
        </div>
      )}

      {vadType === 'semantic_vad' && (
        <div className="p-3 border border-gray-600 rounded-lg bg-gray-800/50">
          <label className="block text-xs text-gray-400 mb-1">
            Eagerness
          </label>
          <select
            value={semanticVadEagerness}
            onChange={(e) => {
              onSemanticVadEagernessChange(e.target.value as 'auto' | 'low' | 'medium' | 'high');
              setHasChanges(true);
            }}
            className="w-full text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-50"
          >
            <option value="auto">Auto</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Audio Codec
        </label>
        <select
          value={codec}
          onChange={(e) => {
            onCodecChange(e.target.value);
            setHasChanges(true);
          }}
          className="w-full border border-gray-600 rounded-lg text-sm px-3 py-2 bg-gray-800 text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="opus">Opus (48kHz)</option>
          <option value="pcmu">PCMU (8kHz)</option>
          <option value="pcma">PCMA (8kHz)</option>
        </select>
        <div className="text-xs text-gray-400 mt-1">
          <p><strong>Opus:</strong> High quality, recommended for music and speech</p>
          <p><strong>PCMU/PCMA:</strong> Lower quality, better for older systems</p>
        </div>
      </div>
    </motion.div>
  );
}

function InterfaceSection({ 
  isAudioPlaybackEnabled,
  setIsAudioPlaybackEnabled,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  isPTTActive,
  setIsPTTActive,
  isAutoConnectEnabled,
  setIsAutoConnectEnabled,
  isDockVisible,
  setIsDockVisible,
  setHasChanges 
}: AgentSettingsMenuProps & { setHasChanges: (hasChanges: boolean) => void }) {

  const toggles = [
    {
      label: "Audio Playback",
      description: "Enable audio response playback",
      value: isAudioPlaybackEnabled,
      onChange: setIsAudioPlaybackEnabled,
    },
    {
      label: "Show Event Logs",
      description: "Display technical logs panel",
      value: isEventsPaneExpanded,
      onChange: setIsEventsPaneExpanded,
    },
    {
      label: "Push to Talk Mode",
      description: "Require button press to speak",
      value: isPTTActive,
      onChange: setIsPTTActive,
    },
    {
      label: "Auto Connect",
      description: "Connect automatically on page load",
      value: isAutoConnectEnabled,
      onChange: setIsAutoConnectEnabled,
    },
    {
      label: "Show Agent Dock",
      description: "Display floating agent controls",
      value: isDockVisible,
      onChange: setIsDockVisible,
    },
  ];

  return (
    <motion.div
      animate={{ opacity: 1, filter: "blur(0px)" }}
      className="space-y-3"
      initial={{ opacity: 0, filter: "blur(4px)" }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      {toggles.map((toggle) => (
        <div key={toggle.label} className="flex items-center justify-between p-3 hover:bg-gray-800/50 rounded-lg">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-200">{toggle.label}</div>
            <div className="text-xs text-gray-400">{toggle.description}</div>
          </div>
          <button
            onClick={() => {
              toggle.onChange(!toggle.value);
              setHasChanges(true);
            }}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              toggle.value ? "bg-blue-500" : "bg-gray-600"
            )}
          >
            <span
              className={cn(
                "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                toggle.value ? "translate-x-5" : "translate-x-1"
              )}
            />
          </button>
        </div>
      ))}
    </motion.div>
  );
}