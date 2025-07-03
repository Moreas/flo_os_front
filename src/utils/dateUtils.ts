/**
 * Safely parse a date string from an HTML date input (YYYY-MM-DD format)
 * to avoid timezone issues where the date might be interpreted as the previous day.
 * 
 * @param dateString - Date string in YYYY-MM-DD format from date input
 * @returns Date object representing the local date (not UTC)
 */
export function parseDateInput(dateString: string): Date {
  if (!dateString) {
    return new Date();
  }
  
  // Split the date string and manually create a Date object
  // This ensures we create a local date, not UTC
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Month is 0-indexed in JavaScript Date constructor
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object to YYYY-MM-DD format for HTML date inputs
 * This ensures consistent formatting regardless of timezone
 * 
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format an ISO date string to YYYY-MM-DD format for HTML date inputs
 * This handles the common case of converting backend date strings to input format
 * 
 * @param isoString - ISO date string (can be null/undefined)
 * @returns Date string in YYYY-MM-DD format, or empty string if input is null/undefined
 */
export function formatISOForInput(isoString?: string | null): string {
  if (!isoString) return '';
  
  try {
    // Parse the ISO string to a Date, then format it
    const date = parseDateInput(isoString.split('T')[0]); // Take only the date part
    return formatDateForInput(date);
  } catch (e) {
    console.error("Error formatting ISO string for input:", e);
    return '';
  }
}

/**
 * Check if a date is today (ignoring time)
 * 
 * @param date - Date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Add days to a date
 * 
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New Date object with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Subtract days from a date
 * 
 * @param date - Starting date
 * @param days - Number of days to subtract
 * @returns New Date object with days subtracted
 */
export function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
} 