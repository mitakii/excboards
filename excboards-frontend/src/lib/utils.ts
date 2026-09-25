import type { CSSProperties } from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Inline `animationDelay` style for staggering entrance animations across a
 * list, capped so long lists don't take forever to finish appearing.
 */
export function staggerDelay(
  index: number,
  stepMs = 40,
  maxMs = 320
): CSSProperties {
  return { animationDelay: `${Math.min(index * stepMs, maxMs)}ms` }
}
