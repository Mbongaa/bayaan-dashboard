"use client";
import React from "react";
import { RiSettings4Line, RiVolumeUpLine, RiFileTextLine, RiMicLine } from "@remixicon/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "./DropdownMenu";

interface UISettingsMenuProps {
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (enabled: boolean) => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (expanded: boolean) => void;
  isPTTActive: boolean;
  setIsPTTActive: (active: boolean) => void;
  sessionStatus: string;
}

export default function UISettingsMenu({
  isAudioPlaybackEnabled,
  setIsAudioPlaybackEnabled,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  isPTTActive,
  setIsPTTActive,
  sessionStatus,
}: UISettingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
          <RiSettings4Line className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
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
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}