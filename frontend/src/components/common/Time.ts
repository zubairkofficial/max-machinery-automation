
export const convertEasternToUTC = (easternTime: string): string => {
    if (!easternTime) return '';
    
    // Create a date object with Eastern time
    const [hours, minutes] = easternTime.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Convert to Eastern timezone (EST/EDT)
    const easternDate = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // Get the UTC time
    const utcDate = new Date(easternDate.getTime() + (easternDate.getTimezoneOffset() * 60000));
    
    // Format as HH:mm
    return utcDate.toTimeString().slice(0, 5);
  };
  
  export const convertUTCToEastern = (utcTime: string): string => {
    if (!utcTime) return '';
    
    // Create a date object with UTC time
    const [hours, minutes] = utcTime.split(':');
    const date = new Date();
    date.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Convert to Eastern timezone
    const easternTime = date.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return easternTime;
  };