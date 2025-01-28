import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// write a function that capitalies a string and removes hyphens
export function capitalizeWords(str: string) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
