"use client";
import React, { useState, useEffect } from "react";
import { 
  UserCog, 
  Settings, 
  LogOut,
  Grid3x3,
  Mail,
  Users,
  Calendar,
  BarChart3,
  CheckSquare,
  Layers,
  User
} from "lucide-react";
import Link from "next/link";
import MiniOrb from "../../../foundation/components/MiniOrb";
import { signOut } from "@/app/(auth)/login/actions";
import { createClient } from "@/app/utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { MODULE_TYPES } from "../workspace/WorkspaceGrid";

interface WorkspaceModule {
  id: string;
  name: string;
  type: string;
  status: 'loading' | 'active' | 'idle';
}

interface WorkspaceSidebarProps {
  selectedItem: string | null;
  onMenuSelect: (menuItem: string) => void;
  onBackToVoice?: () => void;
  activeModules?: WorkspaceModule[];
  currentLayout?: string;
}

export function WorkspaceSidebar({ 
  selectedItem, 
  onMenuSelect, 
  onBackToVoice,
  activeModules = [],
  currentLayout = 'workspace'
}: WorkspaceSidebarProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUserData = async () => {
      try {
        const supabase = createClient();
        
        // Get the current user (works reliably in protected routes)
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

    // Load user data immediately
    loadUserData();

    // Timeout safety net - never load forever
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

  const links = [
    {
      id: "workspace",
      label: "Workspace",
      icon: (
        <Grid3x3 className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <UserCog className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <Settings className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      id: "logout",
      label: "Logout",
      icon: (
        <LogOut className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />
      ),
      isAction: true,
    },
  ];
  
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
    <>
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Logo onBackToVoice={onBackToVoice} />
          
          {/* Workspace Status Section */}
          <div className="mt-6 mb-4 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="sidebar-label text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 whitespace-nowrap">
              Workspace
            </div>
            <div className="sidebar-label text-xs text-gray-600 dark:text-gray-300 mb-3 whitespace-nowrap">
              Layout: <span className="font-medium capitalize">{currentLayout}</span>
            </div>
            
            {/* Active Modules */}
            {activeModules.length > 0 && (
              <div className="space-y-1">
                <div className="sidebar-label text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 whitespace-nowrap">
                  Active Modules
                </div>
                {activeModules.map(module => (
                  <div 
                    key={module.id}
                    className="flex items-center gap-2 py-1 px-2 rounded-md bg-white/60 dark:bg-gray-800/50 border border-gray-300/50 dark:border-transparent"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(module.status)}`} />
                    <div className="flex-shrink-0 text-gray-600 dark:text-gray-400">
                      {getModuleIcon(module.type)}
                    </div>
                    <span className="sidebar-label text-xs text-gray-700 dark:text-gray-300 capitalize whitespace-nowrap">
                      {module.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeModules.length === 0 && (
              <div className="sidebar-label text-xs text-gray-500 dark:text-gray-400 italic">
                No active modules
              </div>
            )}
          </div>

          {/* Module Palette - Only visible in expanded state */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-4 mb-4 px-2">
            <div className="sidebar-label text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 whitespace-nowrap">
              Module Palette
            </div>
            <div className="sidebar-label text-xs text-gray-600 dark:text-gray-300 mb-3 whitespace-nowrap">
              Drag modules to workspace
            </div>
            
            <div className="space-y-2">
              {MODULE_TYPES.map((module) => (
                <div
                  key={module.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', module.type);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/60 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 cursor-grab hover:bg-white/80 dark:hover:bg-gray-800/70 transition-all duration-200 hover:scale-105 active:cursor-grabbing"
                  style={{ userSelect: 'none' }}
                >
                  <div className="text-lg flex-shrink-0">
                    {module.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="sidebar-label text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {module.title}
                    </div>
                    <div className="sidebar-label text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {module.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
          
          <div className="flex flex-col gap-2">
            {links.map((link, idx) => (
              <MenuLink 
                key={idx} 
                link={link} 
                isSelected={selectedItem === link.id}
                onClick={() => onMenuSelect(link.id)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center py-1 group relative w-full min-w-[28px] hover:min-w-[260px] transition-all duration-300">
            {/* User Avatar - matches menu item structure exactly */}
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
              {loading ? (
                <div className="h-7 w-7 rounded-full bg-gray-700 animate-pulse" />
              ) : (
                <div className="h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
                  <User className="text-white h-4 w-4" />
                </div>
              )}
            </div>
            
            {/* User Info - matches menu item label structure */}
            <div className="sidebar-label ml-2 flex-1 min-w-0 group-hover:translate-x-1 transition-transform duration-300">
              {loading ? (
                <div className="space-y-1">
                  <div className="h-3 bg-gray-700 rounded animate-pulse w-24" />
                  <div className="h-2 bg-gray-700 rounded animate-pulse w-32" />
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'No email available'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
    </>
  );
}

// Static logo - no conditional rendering, no animations
export const Logo = ({ onBackToVoice }: { onBackToVoice?: () => void }) => {
  const handleLogoClick = () => {
    if (onBackToVoice) {
      onBackToVoice();
    } else {
      window.location.reload();
    }
  };

  return (
    <Link
      href="#"
      className="font-normal flex items-center text-2xl text-gray-800 dark:text-gray-100 py-1 relative z-20 group min-w-[28px]"
      onClick={handleLogoClick}
    >
      {/* MiniOrb container - always visible, positioned for collapsed state */}
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
        <MiniOrb />
      </div>
      {/* Logo text - hidden by default, shown on sidebar hover */}
      <div className="sidebar-label font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap ml-2">
        <span style={{ letterSpacing: '-1.3px' }}>
          bayaan<span className="text-gray-500 dark:text-gray-400">.ai</span>
        </span>
      </div>
    </Link>
  );
};

// Custom menu link component with selection state and click handling
interface MenuLinkProps {
  link: {
    id: string;
    label: string;
    icon: React.ReactNode;
    isAction?: boolean;
  };
  isSelected: boolean;
  onClick: () => void;
}

const MenuLink = ({ link, isSelected, onClick }: MenuLinkProps) => {
  // Handle logout action
  if (link.id === 'logout' && link.isAction) {
    return (
      <form action={signOut}>
        <button
          type="submit"
          className={`
            flex items-center py-1 group relative w-full text-left
            min-w-[28px] hover:min-w-[260px]
            transition-all duration-300
            hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400
            rounded-lg
          `}
        >
          {/* Icon container - always visible, centered in collapsed state */}
          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
            {link.icon}
          </div>
          {/* Label - hidden by default, shown on parent sidebar hover */}
          <span className={`
            sidebar-label text-sm whitespace-nowrap ml-2 
            group-hover:translate-x-1 transition-transform duration-300
            text-gray-700 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400
          `}>
            {link.label}
          </span>
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center py-1 group relative w-full text-left
        min-w-[28px] hover:min-w-[260px]
        transition-all duration-300
        ${isSelected 
          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' 
          : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
        }
        rounded-lg
      `}
    >
      {/* Icon container - always visible, centered in collapsed state */}
      <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
        {link.icon}
      </div>
      {/* Label - hidden by default, shown on parent sidebar hover */}
      <span className={`
        sidebar-label text-sm whitespace-nowrap ml-2 
        group-hover:translate-x-1 transition-transform duration-300
        ${isSelected 
          ? 'text-blue-600 dark:text-blue-400 font-medium' 
          : 'text-gray-700 dark:text-gray-200'
        }
      `}>
        {link.label}
      </span>
    </button>
  );
};