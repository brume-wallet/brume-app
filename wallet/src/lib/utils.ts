import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Strip trailing fractional zeros and a dangling decimal point (e.g. 1.2300 → 1.23, 2.0000 → 2).

export function trimTrailingAmountZeros(s: string): string {
  return s.replace(/\.?0+$/, "")
}

// 
// Portfolio / token list: at most `maxDecimals` fractional digits, rounded, then trim trailing zeros.

export function formatTokenListAmount(n: number, maxDecimals = 4): string {
  if (!Number.isFinite(n)) return "0"
  return trimTrailingAmountZeros(n.toFixed(maxDecimals))
}
