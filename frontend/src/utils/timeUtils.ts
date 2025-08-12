// utils/timeUtils.ts
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Timezone abbreviations for Eastern Time
const getETAbbreviation = (date: Date): string => {
  // Eastern Standard Time (EST) is UTC-5, Eastern Daylight Time (EDT) is UTC-4
  const tzOffset = date.getTimezoneOffset();
  return tzOffset === 240 ? 'EDT' : 'EST'; // 240 minutes = UTC-4
};

/**
 * Convert any timestamp to Eastern Time
 * @param input Timestamp (string, number, or Date)
 * @param formatString Optional format string (default: 'MMM dd, yyyy hh:mm:ss a')
 * @returns Formatted Eastern Time string with timezone abbreviation
 */
export const convertToEasternTime = (
  input: string | number | Date,
  formatString: string = 'MMM dd, yyyy hh:mm:ss a'
): string => {
  try {
    const date = input instanceof Date ? input : new Date(input);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Convert to Eastern Time
    const easternTime = toZonedTime(date, 'America/New_York');
    
    // Format the date/time
    const formatted = format(easternTime, formatString);
    const abbreviation = getETAbbreviation(easternTime);
    
    return `${formatted} ${abbreviation}`;
  } catch (error) {
    console.error('Time conversion error:', error);
    return 'Invalid Date';
  }
};

/**
 * Format duration in milliseconds
 */
export const formatDuration = (ms?: number): string => {
  if (!ms || ms <= 0) return 'Not connected';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Convert Eastern Time to UTC for database storage
 * @param timeString Time in HH:MM format (Eastern Time)
 * @returns Time in HH:MM format (UTC)
 */
export const convertEasternTimeToUTC = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date for today with the given time
    const today = new Date();
    const easternDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    // Convert to Eastern timezone first
    const easternTime = toZonedTime(easternDate, 'America/New_York');
    
    // Get UTC time by creating a new date and adjusting for timezone offset
    const utcTime = new Date(easternTime.getTime() + (easternTime.getTimezoneOffset() * 60000));
    
    return `${utcTime.getUTCHours().toString().padStart(2, '0')}:${utcTime.getUTCMinutes().toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Eastern to UTC conversion error:', error);
    return timeString;
  }
};

/**
 * Convert UTC time to Eastern Time for display
 * @param timeString Time in HH:MM format (UTC)
 * @returns Time in HH:MM format (Eastern Time)
 */
export const convertUTCToEasternTime = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create UTC date for today with given time
    const today = new Date();
    const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), hours, minutes));
    
    // Convert to Eastern timezone
    const easternTime = toZonedTime(utcDate, 'America/New_York');
    
    return `${easternTime.getHours().toString().padStart(2, '0')}:${easternTime.getMinutes().toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('UTC to Eastern conversion error:', error);
    return timeString;
  }
};