"use client";
import React from "react";
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
import { MODULE_TYPES } from "../workspace/WorkspaceGrid";

interface WorkspaceModule {
  id: string;
  name: string;
  type: string;
  status: 'loading' | 'active' | 'idle';
}

interface IntegratedSidebarProps {
  selectedItem: string | null;
  onMenuSelect: (menuItem: string) => void;
  onBackToVoice?: () => void;
  activeModules?: WorkspaceModule[];
  currentLayout?: string;
  isExpanded?: boolean;
}

export function IntegratedSidebar({ 
  selectedItem, 
  onMenuSelect, 
  onBackToVoice,
  activeModules = [],
  currentLayout = 'dashboard',
  isExpanded = false
}: IntegratedSidebarProps) {
  const links = [
    {
      id: "workspace",
      label: "Workspace",
      icon: <Grid3x3 className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      id: "profile",
      label: "Profile",
      icon: <UserCog className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      id: "logout",
      label: "Logout",
      icon: <LogOut className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />,
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
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Logo */}
        <Link
          href="#"
          className="font-normal flex items-center text-2xl text-gray-800 dark:text-gray-100 py-2 mb-6 relative"
          onClick={(e) => {
            e.preventDefault();
            if (onBackToVoice) onBackToVoice();
          }}
        >
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            <MiniOrb />
          </div>
          <div className={`font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap ml-2 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <span style={{ letterSpacing: '-1.3px' }}>
              bayaan<span className="text-gray-500 dark:text-gray-400">.ai</span>
            </span>
          </div>
        </Link>
        
        {/* Module Palette - Only visible when expanded */}
        <div className={`mb-4 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 whitespace-nowrap">
            Module Palette
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mb-3 whitespace-nowrap">
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
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    {module.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {module.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
        
        {/* Navigation Links */}
        <div className="flex flex-col gap-2">
          {links.map((link, idx) => (
            link.isAction ? (
              <form key={idx} action={signOut}>
                <button
                  type="submit"
                  className={`
                    flex items-center py-2 px-2 w-full text-left
                    transition-all duration-300
                    hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400
                    rounded-lg
                  `}
                >
                  <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                    {link.icon}
                  </div>
                  <span className={`text-sm whitespace-nowrap ml-2 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    {link.label}
                  </span>
                </button>
              </form>
            ) : (
              <button
                key={idx}
                onClick={() => onMenuSelect(link.id)}
                className={`
                  flex items-center py-2 px-2 w-full text-left
                  transition-all duration-300
                  ${selectedItem === link.id 
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }
                  rounded-lg
                `}
              >
                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                  {link.icon}
                </div>
                <span className={`text-sm whitespace-nowrap ml-2 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'} ${selectedItem === link.id ? 'font-medium' : ''}`}>
                  {link.label}
                </span>
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
}