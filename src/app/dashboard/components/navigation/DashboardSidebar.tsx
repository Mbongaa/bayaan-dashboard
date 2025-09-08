"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/app/shared/components/sidebar";
import { 
  LayoutDashboard, 
  UserCog, 
  Settings, 
  LogOut,
  Grid3x3,
  Mail,
  Users,
  Calendar,
  BarChart3,
  CheckSquare,
  Layers
} from "lucide-react";
import Link from "next/link";
import MiniOrb from "../../../foundation/components/MiniOrb";

interface WorkspaceModule {
  id: string;
  name: string;
  type: string;
  status: 'loading' | 'active' | 'idle';
}

interface DashboardSidebarProps {
  selectedItem: string | null;
  onMenuSelect: (menuItem: string) => void;
  onBackToVoice?: () => void;
  activeModules?: WorkspaceModule[];
  currentLayout?: string;
}

export function DashboardSidebar({ 
  selectedItem, 
  onMenuSelect, 
  onBackToVoice,
  activeModules = [],
  currentLayout = 'dashboard'
}: DashboardSidebarProps) {
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
    <Sidebar>
      <SidebarBody>
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo onBackToVoice={onBackToVoice} />
          
          {/* Workspace Status Section */}
          <div className="mt-6 mb-4 px-2">
            <div className="sidebar-label text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Workspace
            </div>
            <div className="sidebar-label text-xs text-gray-600 dark:text-gray-300 mb-3">
              Layout: <span className="font-medium capitalize">{currentLayout}</span>
            </div>
            
            {/* Active Modules */}
            {activeModules.length > 0 && (
              <div className="space-y-1">
                <div className="sidebar-label text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
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
                    <span className="sidebar-label text-xs text-gray-700 dark:text-gray-300 capitalize">
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
          <SidebarLink
            link={{
              label: "Bayaan AI",
              href: "#",
              icon: (
                <div className="h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
                  <span className="text-white text-xs font-bold">B</span>
                </div>
              ),
            }}
          />
        </div>
      </SidebarBody>
    </Sidebar>
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
  };
  isSelected: boolean;
  onClick: () => void;
}

const MenuLink = ({ link, isSelected, onClick }: MenuLinkProps) => {
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