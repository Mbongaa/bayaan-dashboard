"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar, SidebarBody } from '@/app/shared/components/sidebar';
import { WorkspaceSidebar } from './navigation/WorkspaceSidebar';
import { WorkspaceSidebarV2 } from './navigation/WorkspaceSidebarV2';
import WorkspaceContentRenderer from './WorkspaceContentRenderer';
import { WorkspaceNotification } from './WorkspaceNotification';
import { Z_CLASSES } from '@/app/styles/z-index';
import { foundationServices } from '../../foundation/services/FoundationServices';
import { cn } from '@/app/shared/lib/utils';

interface WorkspaceLayoutProps {
  selectedItem: string | null;
  onMenuSelect: (menuItem: string) => void;
  onBackToVoice: () => void;
  appMode: 'voice' | 'workspace';
}

/**
 * Unified Workspace Layout Component
 * 
 * This component integrates the sidebar and content area into a single
 * fluid layout system. The sidebar keeps its original floating design
 * but is properly integrated with the content flow.
 */
export function WorkspaceLayout({
  selectedItem,
  onMenuSelect,
  onBackToVoice,
  appMode
}: WorkspaceLayoutProps) {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Only render when in workspace mode
  if (appMode !== 'workspace') {
    return null;
  }

  return (
    <div className={`workspace-layout-container fixed inset-0 ${Z_CLASSES.workspace}`}>
      {/* New Icon-based Sidebar */}
      <WorkspaceSidebarV2 
        selectedItem={selectedItem}
        onMenuSelect={onMenuSelect}
        onBackToVoice={onBackToVoice}
      />

      {/* Content Area - Full screen with padding to avoid sidebar overlap */}
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