/**
 * Timezone utilities for handling Eastern Time in the backend
 * These functions ensure cron jobs run according to Eastern Time regardless of server timezone
 */

/**
 * Get current time in Eastern Time zone in HH:MM format
 * This function accounts for daylight saving time automatically
 * @returns Current Eastern Time in HH:MM format (e.g., "14:30")
 */
export function getCurrentEasternTime(): string {
  const now = new Date();
  
  // Convert to Eastern Time using Intl.DateTimeFormat
  const easternTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);
  
  return easternTime; // Returns in HH:MM format
}

/**
 * Get current date in Eastern Time zone
 * @returns Date object representing current Eastern Time
 */
export function getCurrentEasternDate(): Date {
  const now = new Date();
  
  // Get the timezone offset for Eastern Time
  const easternTimeString = now.toLocaleString('en-US', {
    timeZone: 'America/New_York'
  });
  
  return new Date(easternTimeString);
}

/**
 * Check if current Eastern Time is within the specified time window
 * @param startTime Start time in HH:MM format (UTC from database)
 * @param endTime End time in HH:MM format (UTC from database), optional
 * @returns boolean indicating if current Eastern Time is within the window
 */
export function isWithinEasternTimeWindow(startTime: string, endTime?: string): boolean {
  const currentEasternTime = getCurrentEasternTime();
  
  // Convert UTC times from database to Eastern Time for comparison
  const easternStartTime = convertUTCToEasternTime(startTime);
  const easternEndTime = endTime ? convertUTCToEasternTime(endTime) : '23:59';
  
  return currentEasternTime >= easternStartTime && currentEasternTime <= easternEndTime;
}

/**
 * Convert UTC time string to Eastern Time
 * @param utcTimeString Time in HH:MM format (UTC)
 * @returns Time in HH:MM format (Eastern Time)
 */
export function convertUTCToEasternTime(utcTimeString: string): string {
  if (!utcTimeString) return '';
  
  try {
    const [hours, minutes] = utcTimeString.split(':').map(Number);
    
    // Create a UTC date for today with the given time
    const today = new Date();
    const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), hours, minutes));
    
    // Format to Eastern Time
    const easternTimeString = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(utcDate);
    
    return easternTimeString;
  } catch (error) {
    console.error('UTC to Eastern Time conversion error:', error);
    return utcTimeString;
  }
}

/**
 * Convert Eastern Time string to UTC
 * @param easternTimeString Time in HH:MM format (Eastern Time)
 * @returns Time in HH:MM format (UTC)
 */
export function convertEasternTimeToUTC(easternTimeString: string): string {
  if (!easternTimeString) return '';
  
  try {
    const [hours, minutes] = easternTimeString.split(':').map(Number);
    
    // Create a date object representing the Eastern Time
    const today = new Date();
    const easternDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    // Convert to UTC by getting the time as if it were in Eastern timezone
    const utcTime = new Date(easternDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const offsetDiff = easternDate.getTime() - utcTime.getTime();
    const utcDate = new Date(easternDate.getTime() - offsetDiff);
    
    const utcHours = utcDate.getUTCHours();
    const utcMinutes = utcDate.getUTCMinutes();
    
    return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Eastern Time to UTC conversion error:', error);
    return easternTimeString;
  }
}

/**
 * Get timezone abbreviation for current Eastern Time (EDT or EST)
 * @returns 'EDT' or 'EST' based on current date
 */
export function getEasternTimeZoneAbbreviation(): string {
  const now = new Date();
  const easternTimeString = now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'short'
  });
  
  // Extract timezone abbreviation from the string
  const abbreviation = easternTimeString.match(/\b(EDT|EST)\b/);
  return abbreviation ? abbreviation[0] : 'EST';
}