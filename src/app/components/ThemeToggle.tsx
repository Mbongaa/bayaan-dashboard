"use client";

import { cn } from "@/app/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle({
  className,
}: {
  className?: string;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSwitchTheme = () => {
    if (resolvedTheme === "dark") {
      setTheme("light");
    }
    if (resolvedTheme === "light") {
      setTheme("dark");
    }
  };

  // Show a neutral state until hydration is complete
  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          "group relative h-14 w-10 overflow-hidden transition rounded-full bg-neutral-50/30 dark:bg-neutral-900/30 p-2 border border-neutral-500/20",
          "hover:scale-110 transform-gpu transition duration-150",
          className
        )}
        aria-label="Toggle theme"
        disabled
      >
        <SunIcon
          className="size-5 text-neutral-600 dark:text-neutral-300 opacity-50 absolute -translate-x-1/2 left-1/2 top-2 transform-gpu"
        />
        <MoonIcon
          className="size-5 text-neutral-600 dark:text-neutral-300 opacity-50 absolute -translate-x-1/2 left-1/2 bottom-2 transform-gpu"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSwitchTheme}
      className={cn(
        "group relative h-14 w-10 overflow-hidden transition rounded-full bg-neutral-50/30 dark:bg-neutral-900/30 p-2 border border-neutral-500/20",
        "hover:scale-110 transform-gpu transition duration-150",
        className
      )}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <SunIcon
        className={cn(
          "size-5 text-neutral-600 transition-all dark:text-neutral-300 z-50 duration-300 absolute -translate-x-1/2 left-1/2 top-2 transform-gpu",
          resolvedTheme === "light"
            ? "opacity-100 translate-y-0 scale-100 group-hover:scale-75 group-hover:opacity-90"
            : "opacity-50 -translate-y-8 scale-90  group-hover:-translate-y-3",
        )}
      />

      <MoonIcon
        className={cn(
          "size-5 text-neutral-600 transition-all dark:text-neutral-300 z-50 duration-300 absolute -translate-x-1/2 left-1/2 bottom-2 transform-gpu",
          resolvedTheme === "dark"
            ? "opacity-100 translate-y-0 scale-100 group-hover:scale-75 group-hover:opacity-90"
            : "opacity-50 translate-y-8 scale-75 group-hover:translate-y-3",
        )}
      />
    </button>
  );
}