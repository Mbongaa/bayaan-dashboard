"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar, SidebarBody } from '@/app/shared/components/sidebar';
import { DashboardSidebar } from './navigation/DashboardSidebar';
import DashboardContentRenderer from './DashboardContentRenderer';
import { WorkspaceNotification } from './WorkspaceNotification';
import { Z_CLASSES } from '@/app/styles/z-index';
import { foundationServices } from '../../foundation/services/FoundationServices';
import { cn } from '@/app/shared/lib/utils';

interface DashboardLayoutProps {
  selectedItem: string | null;
  onMenuSelect: (menuItem: string) => void;
  onBackToVoice: () => void;
  contentMode: 'voice' | 'dashboard';
}

/**
 * Unified Dashboard Layout Component
 * 
 * This component integrates the sidebar and content area into a single
 * fluid layout system. The sidebar keeps its original floating design
 * but is properly integrated with the content flow.
 */
export function DashboardLayout({
  selectedItem,
  onMenuSelect,
  onBackToVoice,
  contentMode
}: DashboardLayoutProps) {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Only render when in dashboard mode
  if (contentMode !== 'dashboard') {
    return null;
  }

  return (
    <div className={`dashboard-layout-container fixed inset-0 ${Z_CLASSES.dashboard}`}>
      {/* Original Floating Sidebar - Positioned absolutely */}
      <div
        className={cn(
          // Required for sidebar-label CSS to work
          "sidebar-container",
          // Original fixed positioning
          "fixed left-4 top-[12.5vh] h-[75vh] z-40",
          "flex flex-col",
          // Original transparent background with visible borders  
          "bg-white/10 dark:bg-black/10 backdrop-blur-sm",
          "border border-gray-400/60 dark:border-gray-700/50",
          // CSS-only width animation
          "w-[60px] hover:w-[300px]",
          "transition-all duration-300 ease-in-out",
          // Hide overflow in collapsed state
          "overflow-hidden hover:overflow-visible",
          // Padding
          "px-4 py-4",
          // Floating card appearance
          "rounded-3xl",
          // Group for hover states
          "group"
        )}
        onMouseEnter={() => {
          setIsSidebarHovered(true);
          foundationServices.navigation.setSidebarState('expanded');
        }}
        onMouseLeave={() => {
          setIsSidebarHovered(false);
          foundationServices.navigation.setSidebarState('collapsed');
        }}
      >
        <DashboardSidebar 
          selectedItem={selectedItem}
          onMenuSelect={onMenuSelect}
          onBackToVoice={onBackToVoice}
        />
      </div>

      {/* Content Area - Full screen with padding to avoid sidebar overlap */}
      <div className="w-full h-full overflow-hidden pl-20 pr-4">
        <DashboardContentRenderer
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

export default DashboardLayout;