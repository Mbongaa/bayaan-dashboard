"use client";

import React, { useState, useEffect } from "react";
import { 
  Package2,
  Grid3x3,
  UserCog, 
  Settings, 
  LogOut,
  User,
  Mail,
  Users,
  Calendar,
  BarChart3,
  CheckSquare,
  Layers
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/login/actions";
import { createClient } from "@/app/utils/supabase/client";
import { foundationServices } from "../../../foundation/services/FoundationServices";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { MODULE_TYPES } from "../workspace/WorkspaceGrid";
import { isMobile } from "@/app/shared/lib/mobileUtils";

interface WorkspaceModule {
  id: string;
  name: string;
  type: string;
  status: 'loading' | 'active' | 'idle';
}

interface WorkspaceSidebarV2Props {
  selectedItem: string | null;
  onMenuSelect: (menuItem: string) => void;
  onBackToVoice?: () => void;
  activeModules?: WorkspaceModule[];
  currentLayout?: string;
}

export function WorkspaceSidebarV2({ 
  selectedItem, 
  onMenuSelect, 
  onBackToVoice,
  activeModules = [],
  currentLayout = 'workspace'
}: WorkspaceSidebarV2Props) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Enhanced mobile detection that works with browser device mode
  const detectMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    
    // Check multiple conditions for better detection
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasMobileUA = isMobile();
    const isNarrowViewport = window.innerWidth <= 768;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasHoverNone = window.matchMedia('(hover: none)').matches;
    
    // Consider it mobile if it has touch AND (narrow viewport OR mobile UA OR coarse pointer)
    const result = hasTouch && (isNarrowViewport || hasMobileUA || hasCoarsePointer || hasHoverNone);
    
    // Debug logging
    console.log('Mobile detection:', {
      hasTouch,
      hasMobileUA,
      isNarrowViewport,
      hasCoarsePointer,
      hasHoverNone,
      result
    });
    
    return result;
  };

  // Detect mobile device and listen for changes
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = detectMobileDevice();
      setIsMobileDevice(isMobile);
      
      // Reset open tooltip when switching modes
      if (!isMobile) {
        setOpenTooltip(null);
      }
    };
    
    // Initial check
    checkMobile();
    
    // Listen for viewport changes (browser device mode switching)
    window.addEventListener('resize', checkMobile);
    
    // Listen for media query changes
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const handleMediaChange = () => checkMobile();
    
    // Modern way to listen for media query changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleMediaChange);
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  // Handle clicking outside to close tooltips on mobile
  useEffect(() => {
    if (!isMobileDevice || !openTooltip) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-tooltip-trigger]') && !target.closest('[role="tooltip"]')) {
        setOpenTooltip(null);
      }
    };
    
    // Small delay to avoid closing immediately after opening
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileDevice, openTooltip]);

  useEffect(() => {
    let mounted = true;

    const loadUserData = async () => {
      try {
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (mounted) {
          setUser(currentUser);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    loadUserData();

    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('User loading timeout - displaying fallback');
        setUser(null);
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [loading]);

  // Helper function to get module icon
  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'crm': return <Users className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'tasks': return <CheckSquare className="h-4 w-4" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'loading': return 'bg-yellow-500 animate-pulse';
      case 'idle': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <TooltipProvider>
      <div className="fixed left-[26px] top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
        {/* Module Palette */}
        <Tooltip delayDuration={isMobileDevice ? 0 : 200} open={isMobileDevice ? openTooltip === 'module' : undefined}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm border-gray-400/60 dark:border-gray-700/50"
              data-tooltip-trigger="module"
              onClick={(e) => {
                if (isMobileDevice) {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenTooltip(openTooltip === 'module' ? null : 'module');
                }
              }}
              onMouseEnter={() => !isMobileDevice && foundationServices.navigation.setSidebarState('expanded')}
              onMouseLeave={() => !isMobileDevice && foundationServices.navigation.setSidebarState('collapsed')}
            >
              <Package2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            align="center"
            className="p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl ml-1 w-80"
          >
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Module Palette
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Drag modules to workspace
              </div>
              
              {/* Active Modules */}
              {activeModules.length > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Active
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {activeModules.map(module => (
                      <div 
                        key={module.id}
                        className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-gray-100 dark:bg-gray-800/70 w-12 h-12"
                      >
                        {/* Status indicator */}
                        <div className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${getStatusColor(module.status)}`} />
                        {/* Icon */}
                        <div className="text-lg">
                          {getModuleIcon(module.type)}
                        </div>
                        {/* Name (very small) */}
                        <span className="text-[9px] text-gray-600 dark:text-gray-400 capitalize mt-0.5">
                          {module.name.slice(0, 5)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Draggable Modules - App Grid Style */}
              <div className="grid grid-cols-4 gap-3">
                {MODULE_TYPES.map((module) => (
                  <div
                    key={module.type}
                    draggable="true"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', module.type);
                      e.dataTransfer.effectAllowed = 'copy';
                      // Close tooltip when starting drag
                      if (isMobileDevice) {
                        setOpenTooltip(null);
                      }
                    }}
                    onTouchStart={(e) => {
                      // Handle touch drag for mobile devices
                      const touch = e.touches[0];
                      const element = e.currentTarget as HTMLElement;
                      const rect = element.getBoundingClientRect();
                      
                      // Create a drag image for mobile
                      const dragImage = element.cloneNode(true) as HTMLElement;
                      dragImage.style.position = 'fixed';
                      dragImage.style.pointerEvents = 'none';
                      dragImage.style.zIndex = '9999';
                      dragImage.style.opacity = '0.8';
                      dragImage.style.left = `${touch.clientX - rect.width / 2}px`;
                      dragImage.style.top = `${touch.clientY - rect.height / 2}px`;
                      dragImage.style.width = `${rect.width}px`;
                      document.body.appendChild(dragImage);
                      
                      const handleTouchMove = (moveEvent: TouchEvent) => {
                        moveEvent.preventDefault();
                        const moveTouch = moveEvent.touches[0];
                        dragImage.style.left = `${moveTouch.clientX - rect.width / 2}px`;
                        dragImage.style.top = `${moveTouch.clientY - rect.height / 2}px`;
                      };
                      
                      const handleTouchEnd = (endEvent: TouchEvent) => {
                        const endTouch = endEvent.changedTouches[0];
                        const dropTarget = document.elementFromPoint(endTouch.clientX, endTouch.clientY);
                        
                        // Find the grid container
                        const gridContainer = dropTarget?.closest('.react-grid-layout');
                        if (gridContainer) {
                          // Trigger a custom event for the grid to handle the drop
                          const dropEvent = new CustomEvent('module-drop', {
                            detail: { moduleType: module.type, x: endTouch.clientX, y: endTouch.clientY },
                            bubbles: true
                          });
                          gridContainer.dispatchEvent(dropEvent);
                        }
                        
                        // Clean up
                        document.body.removeChild(dragImage);
                        document.removeEventListener('touchmove', handleTouchMove);
                        document.removeEventListener('touchend', handleTouchEnd);
                        
                        // Close tooltip
                        if (isMobileDevice) {
                          setOpenTooltip(null);
                        }
                      };
                      
                      document.addEventListener('touchmove', handleTouchMove, { passive: false });
                      document.addEventListener('touchend', handleTouchEnd);
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 cursor-grab hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-800/50 transition-all duration-200 hover:scale-110 active:scale-95 active:cursor-grabbing touch-none group relative"
                    style={{ userSelect: 'none', WebkitUserDrag: 'element' as any, aspectRatio: '1/1' }}
                  >
                    {/* App Icon */}
                    <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-200">
                      {module.icon}
                    </div>
                    {/* App Name */}
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200 text-center leading-tight">
                      {module.title}
                    </div>
                    {/* Hover Tooltip for Description */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {module.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Workspace */}
        <Tooltip delayDuration={isMobileDevice ? 0 : 200} open={isMobileDevice ? openTooltip === 'workspace' : undefined}>
          <TooltipTrigger asChild>
            <Button
              variant={selectedItem === 'workspace' ? 'default' : 'outline'}
              size="icon"
              className={`rounded-full ${
                selectedItem === 'workspace' 
                  ? 'bg-blue-500/20 border-blue-500' 
                  : 'bg-white/10 dark:bg-black/10 backdrop-blur-sm border-gray-400/60 dark:border-gray-700/50'
              }`}
              data-tooltip-trigger="workspace"
              onClick={(e) => {
                if (isMobileDevice) {
                  e.stopPropagation();
                  if (openTooltip === 'workspace') {
                    setOpenTooltip(null);
                  } else {
                    setOpenTooltip('workspace');
                    // Small delay to show tooltip before navigation
                    setTimeout(() => {
                      onMenuSelect('workspace');
                      setOpenTooltip(null);
                    }, 300);
                  }
                } else {
                  onMenuSelect('workspace');
                }
              }}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            align="center"
            className="px-3 py-1.5 bg-gray-900 text-white rounded-md"
          >
            Workspace
          </TooltipContent>
        </Tooltip>

        {/* Profile */}
        <Tooltip delayDuration={isMobileDevice ? 0 : 200} open={isMobileDevice ? openTooltip === 'profile' : undefined}>
          <TooltipTrigger asChild>
            <Button
              variant={selectedItem === 'profile' ? 'default' : 'outline'}
              size="icon"
              className={`rounded-full ${
                selectedItem === 'profile' 
                  ? 'bg-blue-500/20 border-blue-500' 
                  : 'bg-white/10 dark:bg-black/10 backdrop-blur-sm border-gray-400/60 dark:border-gray-700/50'
              }`}
              data-tooltip-trigger="profile"
              onClick={(e) => {
                if (isMobileDevice) {
                  e.stopPropagation();
                  if (openTooltip === 'profile') {
                    setOpenTooltip(null);
                  } else {
                    setOpenTooltip('profile');
                    setTimeout(() => {
                      onMenuSelect('profile');
                      setOpenTooltip(null);
                    }, 300);
                  }
                } else {
                  onMenuSelect('profile');
                }
              }}
            >
              <UserCog className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            align="center"
            className="px-3 py-1.5 bg-gray-900 text-white rounded-md"
          >
            Profile
          </TooltipContent>
        </Tooltip>

        {/* Settings */}
        <Tooltip delayDuration={isMobileDevice ? 0 : 200} open={isMobileDevice ? openTooltip === 'settings' : undefined}>
          <TooltipTrigger asChild>
            <Button
              variant={selectedItem === 'settings' ? 'default' : 'outline'}
              size="icon"
              className={`rounded-full ${
                selectedItem === 'settings' 
                  ? 'bg-blue-500/20 border-blue-500' 
                  : 'bg-white/10 dark:bg-black/10 backdrop-blur-sm border-gray-400/60 dark:border-gray-700/50'
              }`}
              data-tooltip-trigger="settings"
              onClick={(e) => {
                if (isMobileDevice) {
                  e.stopPropagation();
                  if (openTooltip === 'settings') {
                    setOpenTooltip(null);
                  } else {
                    setOpenTooltip('settings');
                    setTimeout(() => {
                      onMenuSelect('settings');
                      setOpenTooltip(null);
                    }, 300);
                  }
                } else {
                  onMenuSelect('settings');
                }
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            align="center"
            className="px-3 py-1.5 bg-gray-900 text-white rounded-md"
          >
            Settings
          </TooltipContent>
        </Tooltip>

        {/* User Info & Logout */}
        <Tooltip delayDuration={isMobileDevice ? 0 : 200} open={isMobileDevice ? openTooltip === 'user' : undefined}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-0"
              data-tooltip-trigger="user"
              onClick={(e) => {
                if (isMobileDevice) {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenTooltip(openTooltip === 'user' ? null : 'user');
                }
              }}
            >
              <User className="h-4 w-4 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            align="center"
            className="p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl ml-1"
          >
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-1">
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded animate-pulse w-24" />
                  <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded animate-pulse w-32" />
                </div>
              ) : (
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || 'No email available'}
                  </div>
                </div>
              )}
              
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Close tooltip first on mobile
                  if (isMobileDevice) {
                    setOpenTooltip(null);
                  }
                  // Small delay to ensure tooltip closes before form submission
                  setTimeout(async () => {
                    await signOut();
                  }, 100);
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Logout
              </button>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}