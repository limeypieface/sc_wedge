/**
 * ClassName Merge Utility
 *
 * Combines clsx and tailwind-merge for intelligent className merging.
 * This is a self-contained copy for the sindri-prototype.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names intelligently
 *
 * Uses clsx for conditional classes and tailwind-merge
 * to properly handle Tailwind CSS class conflicts.
 *
 * @param inputs - Class values to merge
 * @returns Merged className string
 *
 * @example
 * cn("px-2 py-1", "px-4") // "py-1 px-4"
 * cn("bg-red-500", condition && "bg-blue-500") // conditional
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
