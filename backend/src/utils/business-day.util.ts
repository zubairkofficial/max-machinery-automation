import { nextMonday, addDays, addMonths, setMonth, setDate } from "date-fns";
import { JobName } from "src/cron-settings/enums/job-name.enum";

// Function to add business days (skip weekends)
export function addBusinessDays(startDate: Date, daysToAdd: number): Date {
  const result = new Date(startDate);
  let added = 0;
  
  while (added < daysToAdd) {
    // Add one day
    result.setDate(result.getDate() + 1);
    
    // Skip weekends (Sunday = 0, Saturday = 6)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      added++;
    }
  }
  
  // Return date-only without time
  return new Date(result.getFullYear(), result.getMonth(), result.getDate());
}

export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}


export function getNextReminderDate(selectedDay: number, currentDate: Date): Date {
  const result = new Date(currentDate);
  let added = 0;
  
  while (added < selectedDay) {
    // Add one day
    result.setDate(result.getDate() + 1);
    
    // Skip weekends (Sunday = 0, Saturday = 6)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      added++;
    }
  }
  
  // Return date-only without time
  return new Date(result.getFullYear(), result.getMonth(), result.getDate());
}




export function parseUserSchedule(scheduleText: string): Date | null {
  const now = new Date();
  scheduleText = scheduleText.toLowerCase();

  // Next Monday
  if (scheduleText.includes('next monday')) {
    return nextMonday(now);
  }

  // After X days
  const afterDaysMatch = scheduleText.match(/after (\d+) day/);
  if (afterDaysMatch) {
    const days = parseInt(afterDaysMatch[1], 10);
    return addDays(now, days);
  }

  // After X months
  const afterMonthsMatch = scheduleText.match(/after (\d+) month/);
  if (afterMonthsMatch) {
    const months = parseInt(afterMonthsMatch[1], 10);
    return addMonths(now, months);
  }

  // Specific month like "Dec", "October", etc.
  const monthsMap: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  for (const [key, monthIndex] of Object.entries(monthsMap)) {
    if (scheduleText.includes(key)) {
      // Set to first day of that month, current year
      return setMonth(setDate(new Date(), 1), monthIndex);
    }
  }

  // If can't parse, return null
  return null;
}


