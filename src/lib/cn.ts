import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for combining CSS class names.
 *
 * This function is essential when using shadcn components. It combines the power of
 * `clsx` for conditional class merging with `tailwind-merge` for Tailwind CSS class deduplication.
 *
 * @ param {...ClassValue[]} inputs - Any number of class values (strings, objects, or arrays)
 * @ returns {string} A string of merged and deduplicated class names
 *
 * Usage:
 * cn('px-4 py-2', {'bg-blue-500': isActive}, ['text-white', 'font-bold'])
 *
 * This function helps prevent conflicts when combining default shadcn component classes
 * with custom classes, ensuring proper overrides and reducing CSS bloat.
 */

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
