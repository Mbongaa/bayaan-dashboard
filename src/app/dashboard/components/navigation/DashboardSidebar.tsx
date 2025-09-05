"use client";
import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/app/shared/components/sidebar";
import { LayoutDashboard, UserCog, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import MiniOrb from "../../../foundation/components/MiniOrb";
import ThemeToggle from "../../../shared/components/ThemeToggle";

interface DashboardSidebarProps {
  selectedItem: string | null;
  onMenuSelect: (menuItem: string) => void;
  onBackToVoice?: () => void;
}

export function DashboardSidebar({ selectedItem, onMenuSelect, onBackToVoice }: DashboardSidebarProps) {
  const links = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <LayoutDashboard className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />
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
  
  return (
    <Sidebar>
      <SidebarBody>
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo onBackToVoice={onBackToVoice} />
          <div className="mt-8 flex flex-col gap-2">
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
          {/* Theme Toggle positioned above account - no auto-centering */}
          <div className="flex items-center justify-center py-3 w-10">
            <div className="mr-2">
              <ThemeToggle />
            </div>
          </div>
          
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
        flex items-center py-2 group relative w-full text-left
        min-w-[28px] hover:min-w-[260px]
        transition-all duration-300
        ${isSelected 
          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' 
          : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
        }
        rounded-lg px-2
      `}
    >
      {/* Icon container - always visible, centered in collapsed state */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
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