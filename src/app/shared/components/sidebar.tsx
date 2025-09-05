"use client";

import { cn } from "@/app/shared/lib/utils";
import Link, { LinkProps } from "next/link";
import React from "react";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

// Pure CSS sidebar with no React state management
export const Sidebar = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <>
      <DesktopSidebar className={cn("sidebar-container", className)}>{children}</DesktopSidebar>
      <MobileSidebar>{children}</MobileSidebar>
    </>
  );
};

export const SidebarBody = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div 
      className={cn("flex flex-col h-full justify-between gap-10", className)}
      {...props}
    >
      {children}
    </div>
  );
};

// Desktop sidebar with pure CSS hover animations
export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        // Core layout - floating positioning
        "fixed left-4 top-[12.5vh] h-[75vh] z-20",
        "hidden md:flex md:flex-col",
        // Match main app background with transparency (30% like theme toggle & chatbox)  
        "bg-gray-100/30 dark:bg-black/30 backdrop-blur-sm",
        "border border-gray-200/50 dark:border-gray-700/50",
        // CSS-only width animation (NO JavaScript state)
        "w-[60px] hover:w-[300px]",
        "transition-all duration-300 ease-in-out",
        // Padding - removed overflow-hidden to show content
        "px-4 py-4",
        // Floating card appearance
        "rounded-3xl shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Mobile sidebar with minimal JavaScript
export const MobileSidebar = ({
  children,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <>
      {/* Mobile header */}
      <div
        className={cn(
          "h-16 px-4 flex flex-row md:hidden items-center justify-between",
          "bg-gray-100/30 dark:bg-black/30 backdrop-blur-sm w-full fixed top-0 left-0 z-20",
          "border-b border-gray-200/50 dark:border-gray-700/50"
        )}
        {...props}
      >
        <div className="flex justify-end w-full">
          <Menu
            className="text-gray-800 dark:text-gray-100 cursor-pointer"
            onClick={() => {
              const sidebar = document.querySelector('.mobile-sidebar-overlay') as HTMLElement;
              if (sidebar) sidebar.style.display = sidebar.style.display === 'flex' ? 'none' : 'flex';
            }}
          />
        </div>
      </div>
      
      {/* Mobile overlay */}
      <div
        className={cn(
          "mobile-sidebar-overlay fixed inset-0 z-[100]",
          "bg-gray-100/30 dark:bg-black/30 backdrop-blur-md p-10",
          "hidden md:hidden flex-col justify-between"
        )}
        style={{ display: 'none' }}
      >
        <div
          className="absolute right-10 top-10 z-50 text-gray-800 dark:text-gray-100 cursor-pointer"
          onClick={() => {
            const sidebar = document.querySelector('.mobile-sidebar-overlay') as HTMLElement;
            if (sidebar) sidebar.style.display = 'none';
          }}
        >
          <X />
        </div>
        {children}
      </div>
    </>
  );
};

// Sidebar link with CSS-only label animations
export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center py-2 group relative",
        // Ensure minimum width for hover target
        "min-w-[28px] hover:min-w-[260px]",
        className
      )}
      {...props}
    >
      {/* Icon container - always visible, centered in collapsed state */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {link.icon}
      </div>
      {/* Label - hidden by default, shown on parent sidebar hover */}
      <span className="sidebar-label text-gray-700 dark:text-gray-200 text-sm whitespace-nowrap ml-2 group-hover:translate-x-1 transition-transform duration-300">
        {link.label}
      </span>
    </Link>
  );
};