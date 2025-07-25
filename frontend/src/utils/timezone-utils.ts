// Utility functions for timezone conversion between Eastern Time and UTC

/**
 * Convert Eastern time to UTC
 * @param easternTime - Time string in HH:mm format (Eastern time)
 * @returns UTC time string in HH:mm format
 */
export const easternToUTC = (easternTime: string): string => {
  if (!easternTime) return '';
  
  // Create a date object for today with the Eastern time
  const today = new Date();
  const [hours, minutes] = easternTime.split(':').map(Number);
  console.log("hours", hours);
  console.log("minutes", minutes);
  // Create date in Eastern timezone
  const easternDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
  
  // Convert to UTC by adding the timezone offset
  // Eastern Time is UTC-5 (EST) or UTC-4 (EDT)
  // We'll use a simple approach: assume EST (UTC-5) for now
  // For production, you might want to use a library like date-fns-tz or moment-timezone
  const utcDate = new Date(easternDate.getTime() + (5 * 60 * 60 * 1000)); // Add 5 hours to convert to UTC
  
  // Format as HH:mm
  const utcHours = utcDate.getUTCHours().toString().padStart(2, '0');
  const utcMinutes = utcDate.getUTCMinutes().toString().padStart(2, '0');
  console.log(utcHours,utcMinutes)
  return `${utcHours}:${utcMinutes}`;
};

/**
 * Convert UTC time to Eastern time
 * @param utcTime - Time string in HH:mm format (UTC)
 * @returns Eastern time string in HH:mm format
 */
export const utcToEastern = (utcTime: string): string => {
  if (!utcTime) return '';
  
  // Create a date object for today with the UTC time
  const today = new Date();
  const [hours, minutes] = utcTime.split(':').map(Number);
  
  // Create date in UTC
  const utcDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes));
  
  // Convert to Eastern by subtracting the timezone offset
  // Eastern Time is UTC-5 (EST) or UTC-4 (EDT)
  // We'll use a simple approach: assume EST (UTC-5) for now
  const easternDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000)); // Subtract 5 hours to convert to Eastern
  
  // Format as HH:mm
  const easternHours = easternDate.getHours().toString().padStart(2, '0');
  const easternMinutes = easternDate.getMinutes().toString().padStart(2, '0');
  
  return `${easternHours}:${easternMinutes}`;
};

/**
 * Format time for display with timezone indicator
 * @param time - Time string in HH:mm format
 * @param timezone - Timezone to display (default: 'ET')
 * @returns Formatted time string
 */
export const formatTimeForDisplay = (time: string, timezone: string = 'ET'): string => {
  if (!time) return '';
  return `${time} ${timezone}`;
}; 