"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/login/actions";
import { createClient } from "@/app/utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfileButtonProps {
  className?: string;
}

export function UserProfileButton({ className }: UserProfileButtonProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [openTooltip, setOpenTooltip] = useState<boolean>(false);

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

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200} open={openTooltip}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-400/60 dark:border-gray-700/50 hover:scale-110 transform-gpu transition duration-150 ${className}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpenTooltip(!openTooltip);
            }}
            onMouseEnter={() => setOpenTooltip(true)}
            onMouseLeave={() => setOpenTooltip(false)}
          >
            <User className="h-4 w-4 text-gray-700 dark:text-gray-300" />
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
                setOpenTooltip(false);
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
    </TooltipProvider>
  );
}