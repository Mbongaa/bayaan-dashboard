"use client";

import { cn } from "@/app/shared/lib/utils";
import { LayoutDashboard, Headphones } from "lucide-react";
import { useEffect, useState } from "react";
import { navigationService } from "@/app/foundation/services/NavigationService";

interface ModeToggleProps {
  className?: string;
  appMode: 'voice' | 'workspace';
  onModeChange: (mode: 'voice' | 'workspace') => void;
}

export default function ModeToggle({
  className,
  appMode,
  onModeChange,
}: ModeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [currentMode, setCurrentMode] = useState<'voice' | 'workspace'>(appMode);

  useEffect(() => {
    setMounted(true);
    // Get initial mode from NavigationService
    const initialMode = navigationService.getContentMode();
    setCurrentMode(initialMode);
  }, []);

  useEffect(() => {
    setCurrentMode(appMode);
  }, [appMode]);

  const handleSwitchMode = () => {
    const newMode = currentMode === 'voice' ? 'workspace' : 'voice';
    setCurrentMode(newMode);
    onModeChange(newMode);
    
    // Update NavigationService
    if (newMode === 'workspace') {
      navigationService.navigateToSection('workspace');
    } else {
      navigationService.backToVoice();
    }
  };

  // Show a neutral state until hydration is complete
  if (!mounted) {
    return (
      <div className={cn("relative group", className)}>
        <button
          type="button"
          className={cn(
            "group peer relative h-14 w-10 overflow-hidden transition rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm p-2 border border-gray-400/60 dark:border-gray-700/50",
            "hover:scale-110 transform-gpu transition duration-150",
          )}
          aria-label="Toggle mode"
          disabled
        >
          <Headphones
            className="size-5 text-neutral-600 dark:text-neutral-300 opacity-50 absolute -translate-x-1/2 left-1/2 top-2 transform-gpu"
          />
          <LayoutDashboard
            className="size-5 text-neutral-600 dark:text-neutral-300 opacity-50 absolute -translate-x-1/2 left-1/2 bottom-2 transform-gpu"
          />
        </button>
        <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap">
            Voice / Workspace Mode
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      <button
        type="button"
        onClick={handleSwitchMode}
        className={cn(
          "group peer relative h-14 w-10 overflow-hidden transition rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm p-2 border border-gray-400/60 dark:border-gray-700/50",
          "hover:scale-110 transform-gpu transition duration-150",
        )}
        aria-label={`Switch to ${currentMode === 'voice' ? 'workspace' : 'voice'} mode`}
      >
        {/* Voice Mode Icon - Show when in voice mode */}
        <Headphones
          className={cn(
            "size-5 text-neutral-600 transition-all dark:text-neutral-300 z-50 duration-300 absolute -translate-x-1/2 left-1/2 top-2 transform-gpu",
            currentMode === "voice"
              ? "opacity-100 translate-y-0 scale-100 group-hover:scale-75 group-hover:opacity-90"
              : "opacity-50 -translate-y-8 scale-90 group-hover:-translate-y-3",
          )}
        />

        {/* Workspace Mode Icon - Show when in workspace mode */}
        <LayoutDashboard
          className={cn(
            "size-5 text-neutral-600 transition-all dark:text-neutral-300 z-50 duration-300 absolute -translate-x-1/2 left-1/2 bottom-2 transform-gpu",
            currentMode === "workspace"
              ? "opacity-100 translate-y-0 scale-100 group-hover:scale-75 group-hover:opacity-90"
              : "opacity-50 translate-y-8 scale-75 group-hover:translate-y-3",
          )}
        />
      </button>
      
      {/* Tooltip */}
      <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap">
          {currentMode === 'voice' ? 'Voice Mode' : 'Workspace Mode'}
        </div>
      </div>
    </div>
  );
}