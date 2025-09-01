import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
}

function BottomToolbar({
  sessionStatus,
  onToggleConnection,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";


  function getConnectionButtonLabel() {
    if (isConnected) return "Disconnect";
    if (isConnecting) return "Connecting...";
    return "Connect";
  }

  function getConnectionButtonClasses() {
    const baseClasses = "text-white text-base p-2 w-36 rounded-md h-full";
    const cursorClass = isConnecting ? "cursor-not-allowed" : "cursor-pointer";

    if (isConnected) {
      // Connected -> label "Disconnect" -> red
      return `bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 ${cursorClass} ${baseClasses}`;
    }
    // Disconnected or connecting -> label is either "Connect" or "Connecting" -> black
    return `bg-black hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 ${cursorClass} ${baseClasses}`;
  }

  return (
    <div className="p-4 flex flex-row items-center justify-center gap-x-8 bg-transparent border-t border-transparent pointer-events-none">
      <button
        onClick={onToggleConnection}
        className={`${getConnectionButtonClasses()} pointer-events-auto`}
        disabled={isConnecting}
      >
        {getConnectionButtonLabel()}
      </button>



      {/* Codec dropdown hidden per user request */}
      {/* 
      <div className="flex flex-row items-center gap-2">
        <div className="text-gray-800 dark:text-gray-200">Codec:</div>
        <select
          id="codec-select"
          value={codec}
          onChange={handleCodecChange}
          className="border border-white/20 rounded-md px-2 py-1 focus:outline-none cursor-pointer bg-white/10 backdrop-blur-sm text-gray-800 dark:text-gray-200"
        >
          <option value="opus">Opus (48 kHz)</option>
          <option value="pcmu">PCMU (8 kHz)</option>
          <option value="pcma">PCMA (8 kHz)</option>
        </select>
      </div>
      */}
    </div>
  );
}

export default BottomToolbar;
