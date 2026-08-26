import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

// SSR-safe: window is undefined during server rendering.
export const isIframe =
  typeof window !== "undefined" && window.self !== window.top;
