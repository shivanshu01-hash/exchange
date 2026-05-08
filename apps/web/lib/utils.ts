/**
 * Merge Tailwind CSS classes efficiently
 * Simple implementation without external dependencies
 */
export function cn(...classes: (string | boolean | null | undefined)[]) {
  return classes
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format currency values
 */
export function formatCurrency(
  amount: number,
  currency: string = "₹",
  decimals: number = 2
): string {
  return `${currency}${amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Format odds (decimal to fractional)
 */
export function formatOdds(
  odds: number,
  format: "decimal" | "fractional" | "percentage" = "decimal"
): string {
  switch (format) {
    case "decimal":
      return odds.toFixed(2);
    case "fractional":
      const numerator = odds - 1;
      const denominator = 1;
      // Simplify fraction
      const simplifiedNumerator = Math.round(numerator * 100);
      const simplifiedDenominator = 100;
      return `${simplifiedNumerator}/${simplifiedDenominator}`;
    case "percentage":
      return `${((1 / odds) * 100).toFixed(1)}%`;
    default:
      return odds.toFixed(2);
  }
}

/**
 * Calculate liability for a bet
 */
export function calculateLiability(
  side: "BACK" | "LAY",
  price: number,
  stake: number
): number {
  if (side === "BACK") {
    return stake;
  } else {
    // LAY liability = (price - 1) * stake
    return (price - 1) * stake;
  }
}

/**
 * Calculate potential profit for a bet
 */
export function calculateProfit(
  side: "BACK" | "LAY",
  price: number,
  stake: number
): number {
  if (side === "BACK") {
    // BACK profit = (price - 1) * stake
    return (price - 1) * stake;
  } else {
    // LAY profit = stake
    return stake;
  }
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ""): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Parse query parameters from URL
 */
export function getQueryParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Format date/time for display
 */
export function formatDateTime(
  date: Date | string,
  format: "short" | "medium" | "long" | "relative" = "medium"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  switch (format) {
    case "short":
      return dateObj.toLocaleDateString();
    case "medium":
      return dateObj.toLocaleString();
    case "long":
      return dateObj.toLocaleString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    case "relative":
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return dateObj.toLocaleDateString();
    default:
      return dateObj.toLocaleString();
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}