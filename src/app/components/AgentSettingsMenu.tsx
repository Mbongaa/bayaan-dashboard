"use client";
import React from "react";
import { RiSettings3Line, RiVoiceprintLine, RiSpeakLine, RiSettings4Line, RiVolumeUpLine, RiFileTextLine, RiMicLine, RiWifiLine } from "@remixicon/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "./DropdownMenu";

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
  
  // UI Settings (consolidated from UISettingsMenu)
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (enabled: boolean) => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (expanded: boolean) => void;
  isPTTActive: boolean;
  setIsPTTActive: (active: boolean) => void;
  isAutoConnectEnabled: boolean;
  setIsAutoConnectEnabled: (enabled: boolean) => void;
  
  // Session Status
  sessionStatus: string;
}

export default function AgentSettingsMenu({
  agentSetKey,
  allAgentSets,
  selectedAgentName,
  selectedAgentConfigSet,
  onAgentChange,
  onSelectedAgentChange,
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
  isAudioPlaybackEnabled,
  setIsAudioPlaybackEnabled,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  isPTTActive,
  setIsPTTActive,
  isAutoConnectEnabled,
  setIsAutoConnectEnabled,
  sessionStatus,
}: AgentSettingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
          <RiSettings3Line className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[80vh] overflow-y-auto sm:w-96">
        {/* Agent Configuration Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <RiSettings3Line className="h-4 w-4" />
            Agent Configuration
          </DropdownMenuLabel>
          
          <div className="px-2 py-1">
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scenario
              </label>
              <select
                value={agentSetKey}
                onChange={onAgentChange}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md text-sm px-2 py-1 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(allAgentSets).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            {selectedAgentConfigSet && (
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent
                </label>
                <select
                  value={selectedAgentName}
                  onChange={onSelectedAgentChange}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md text-sm px-2 py-1 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedAgentConfigSet.map((agent) => (
                    <option key={agent.name} value={agent.name}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Voice Settings Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <RiVoiceprintLine className="h-4 w-4" />
            Voice Settings
          </DropdownMenuLabel>
          
          <div className="px-2 py-1">
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Voice
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => onVoiceChange(e.target.value)}
                disabled={sessionStatus !== "DISCONNECTED"}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md text-sm px-2 py-1 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
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

            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Turn Detection
              </label>
              <select
                value={vadType}
                onChange={(e) => onVadTypeChange(e.target.value as 'server_vad' | 'semantic_vad' | 'disabled')}
                disabled={sessionStatus !== "DISCONNECTED"}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md text-sm px-2 py-1 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="server_vad">Server VAD</option>
                <option value="semantic_vad">Semantic VAD</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            {/* VAD Settings */}
            {vadType === 'server_vad' && (
              <div className="space-y-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Silence Duration (ms)
                  </label>
                  <input
                    type="number"
                    value={vadSilenceDuration}
                    onChange={(e) => onVadSilenceDurationChange(Number(e.target.value))}
                    min="100"
                    max="5000"
                    step="100"
                    className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Threshold
                  </label>
                  <input
                    type="number"
                    value={vadThreshold}
                    onChange={(e) => onVadThresholdChange(Number(e.target.value))}
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50"
                  />
                </div>
              </div>
            )}

            {vadType === 'semantic_vad' && (
              <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Eagerness
                </label>
                <select
                  value={semanticVadEagerness}
                  onChange={(e) => onSemanticVadEagernessChange(e.target.value as 'auto' | 'low' | 'medium' | 'high')}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50"
                >
                  <option value="auto">Auto</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Audio Settings Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <RiSpeakLine className="h-4 w-4" />
            Audio Settings
          </DropdownMenuLabel>
          
          <div className="px-2 py-1">
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Audio Codec
              </label>
              <select
                value={codec}
                onChange={(e) => onCodecChange(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md text-sm px-2 py-1 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="opus">Opus (48kHz)</option>
                <option value="pcmu">PCMU (8kHz)</option>
                <option value="pcma">PCMA (8kHz)</option>
              </select>
            </div>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* UI Settings Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <RiSettings4Line className="h-4 w-4" />
            UI Settings
          </DropdownMenuLabel>
          
          <DropdownMenuCheckboxItem
            checked={isAudioPlaybackEnabled}
            onCheckedChange={setIsAudioPlaybackEnabled}
            className="flex items-center gap-2"
          >
            <RiVolumeUpLine className="h-4 w-4" />
            Audio Playback
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={isEventsPaneExpanded}
            onCheckedChange={setIsEventsPaneExpanded}
            className="flex items-center gap-2"
          >
            <RiFileTextLine className="h-4 w-4" />
            Show Logs
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={isPTTActive}
            onCheckedChange={setIsPTTActive}
            className="flex items-center gap-2"
          >
            <RiMicLine className="h-4 w-4" />
            Push to Talk Mode
          </DropdownMenuCheckboxItem>

          <DropdownMenuCheckboxItem
            checked={isAutoConnectEnabled}
            onCheckedChange={setIsAutoConnectEnabled}
            className="flex items-center gap-2"
          >
            <RiWifiLine className="h-4 w-4" />
            Automatic Connections
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}