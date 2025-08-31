"use client";
import React, { useState, useEffect } from "react";
import { RiSunLine, RiMoonLine } from "@remixicon/react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    setTheme(savedTheme || 'system');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme immediately
    const d = document.documentElement;
    d.classList.remove('light', 'dark');
    
    if (newTheme === 'dark') {
      d.style.colorScheme = 'dark';
      d.classList.add('dark');
    } else {
      d.style.colorScheme = 'light';
      d.classList.add('light');
    }
  };

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
        <div className="h-5 w-5" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50 h-10 py-2 px-4"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <RiSunLine className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      ) : (
        <RiMoonLine className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
}