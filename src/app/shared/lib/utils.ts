import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cx(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Alias for compatibility with external components
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}