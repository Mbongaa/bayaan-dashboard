"use client";
import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/app/shared/components/sidebar";
import { LayoutDashboard, UserCog, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import MiniOrb from "../../../foundation/components/MiniOrb";
import ThemeToggle from "../../../shared/components/ThemeToggle";

export function DashboardSidebar() {
  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <LayoutDashboard className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <UserCog className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <Settings className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <LogOut className="text-gray-700 dark:text-gray-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];
  
  return (
    <Sidebar>
      <SidebarBody>
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo />
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
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
export const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex items-center text-2xl text-gray-800 dark:text-gray-100 py-1 relative z-20 group min-w-[28px]"
      onClick={() => window.location.reload()}
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