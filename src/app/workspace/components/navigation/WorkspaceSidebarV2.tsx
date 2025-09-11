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
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm border-gray-400/60 dark:border-gray-700/50"
              onMouseEnter={() => foundationServices.navigation.setSidebarState('expanded')}
              onMouseLeave={() => foundationServices.navigation.setSidebarState('collapsed')}
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
                    Active Modules
                  </div>
                  <div className="space-y-1">
                    {activeModules.map(module => (
                      <div 
                        key={module.id}
                        className="flex items-center gap-2 py-1 px-2 rounded-md bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(module.status)}`} />
                        {getModuleIcon(module.type)}
                        <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">
                          {module.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Draggable Modules */}
              <div className="space-y-2">
                {MODULE_TYPES.map((module) => (
                  <div
                    key={module.type}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', module.type);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 cursor-grab hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-all duration-200 hover:scale-105 active:cursor-grabbing"
                    style={{ userSelect: 'none' }}
                  >
                    <div className="text-lg flex-shrink-0">
                      {module.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {module.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {module.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Workspace */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant={selectedItem === 'workspace' ? 'default' : 'outline'}
              size="icon"
              className={`rounded-full ${
                selectedItem === 'workspace' 
                  ? 'bg-blue-500/20 border-blue-500' 
                  : 'bg-white/10 dark:bg-black/10 backdrop-blur-sm border-gray-400/60 dark:border-gray-700/50'
              }`}
              onClick={() => onMenuSelect('workspace')}
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
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant={selectedItem === 'profile' ? 'default' : 'outline'}
              size="icon"
              className={`rounded-full ${
                selectedItem === 'profile' 
                  ? 'bg-blue-500/20 border-blue-500' 
                  : 'bg-white/10 dark:bg-black/10 backdrop-blur-sm border-gray-400/60 dark:border-gray-700/50'
              }`}
              onClick={() => onMenuSelect('profile')}
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
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant={selectedItem === 'settings' ? 'default' : 'outline'}
              size="icon"
              className={`rounded-full ${
                selectedItem === 'settings' 
                  ? 'bg-blue-500/20 border-blue-500' 
                  : 'bg-white/10 dark:bg-black/10 backdrop-blur-sm border-gray-400/60 dark:border-gray-700/50'
              }`}
              onClick={() => onMenuSelect('settings')}
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
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-0"
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
              
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  Logout
                </button>
              </form>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}