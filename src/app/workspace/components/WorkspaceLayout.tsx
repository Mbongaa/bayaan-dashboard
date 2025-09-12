"use client";

import React from 'react';
import { WorkspaceSidebarV2 } from './navigation/WorkspaceSidebarV2';
import WorkspaceContentRenderer from './WorkspaceContentRenderer';
import { WorkspaceNotification } from './WorkspaceNotification';
import { Z_CLASSES } from '@/app/styles/z-index';

interface WorkspaceLayoutProps {
  selectedItem: string | null;
  onMenuSelect: (menuItem: string) => void;
  onBackToVoice: () => void;
  appMode: 'voice' | 'workspace';
}

/**
 * Unified Workspace Layout Component
 * 
 * This component integrates the icon navigation and content area into a single
 * fluid layout system. The navigation icons use a floating design
 * with tooltips for navigation control.
 */
export function WorkspaceLayout({
  selectedItem,
  onMenuSelect,
  onBackToVoice,
  appMode
}: WorkspaceLayoutProps) {
  // Only render when in workspace mode
  if (appMode !== 'workspace') {
    return null;
  }

  return (
    <div className={`workspace-layout-container fixed inset-0 ${Z_CLASSES.workspace}`}>
      {/* Icon-based Navigation */}
      <WorkspaceSidebarV2 
        selectedItem={selectedItem}
        onMenuSelect={onMenuSelect}
        onBackToVoice={onBackToVoice}
      />

      {/* Content Area - Full screen with padding to avoid icon navigation overlap */}
      <div className="w-full h-full overflow-hidden pl-20 pr-4">
        <WorkspaceContentRenderer
          selectedItem={selectedItem}
          onBackToVoice={onBackToVoice}
          className="h-full w-full"
        />
      </div>

      {/* Workspace Notifications - Bottom left corner */}
      <WorkspaceNotification />
    </div>
  );
}

export default WorkspaceLayout;