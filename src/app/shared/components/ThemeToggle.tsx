"use client";

import { cn } from "@/app/shared/lib/utils";
import { MoonIcon, SunIcon, SunMoonIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle({
  className,
}: {
  className?: string;
}) {
  const { setTheme, theme, resolvedTheme } = useTheme();
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
      <div className={cn("relative group", className)}>
        <button
          type="button"
          className={cn(
            "group peer relative h-14 w-10 overflow-hidden transition rounded-full bg-gray-100/30 dark:bg-black/30 backdrop-blur-sm p-2 border border-gray-200/50 dark:border-gray-700/50",
            "hover:scale-110 transform-gpu transition duration-150",
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
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      <button
        type="button"
        onClick={handleSwitchTheme}
        className={cn(
          "group peer relative h-14 w-10 overflow-hidden transition rounded-full bg-gray-100/30 dark:bg-black/30 backdrop-blur-sm p-2 border border-gray-200/50 dark:border-gray-700/50",
          "hover:scale-110 transform-gpu transition duration-150",
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
      <button
        type="button"
        onClick={() => {
          setTheme("system");
        }}
        className={cn(
          "peer group absolute left-12 size-10 overflow-hidden transition rounded-full bg-gray-100/30 dark:bg-black/30 backdrop-blur-sm top-1/2 -translate-y-1/2 p-2 border border-gray-200/50 dark:border-gray-700/50",
          "peer-hover:scale-110 transform-gpu transition duration-300 inline-flex items-center justify-center",
          "opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 scale-0 group-hover:scale-100",
        )}
        aria-label="Use system theme"
      >
        <SunMoonIcon
          className={cn(
            "size-5 text-neutral-600 transition-all dark:text-neutral-300 z-50 duration-300 transform-gpu",
            theme === "system"
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-50 scale-75",
          )}
        />
      </button>
    </div>
  );
}