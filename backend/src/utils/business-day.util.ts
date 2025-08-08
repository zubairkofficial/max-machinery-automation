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
  const today = currentDate.getDay(); // Get the current day of the week (0 = Sunday, 1 = Monday, ...)

  let nextDate = new Date(currentDate); // Initialize nextDate with the current date

  // If the selected day is a weekend, adjust it to the next Monday (1)
  if (selectedDay === 0 || selectedDay === 6) {
    selectedDay = 1; // Set to Monday (1) if Saturday (6) or Sunday (0)
  }

  if (selectedDay > today) {
    // If the selected day is later in the current week, set the reminder to that day
    nextDate.setDate(currentDate.getDate() + (selectedDay - today));
  } else if (selectedDay < today) {
    // If the selected day is in the past this week, set the reminder to that day in the next week
    nextDate.setDate(currentDate.getDate() + (7 + selectedDay - today));
  } else {
    // If today is the selected day, set the reminder for today
    nextDate.setDate(currentDate.getDate());
  }

  // Ensure the next date is a business day (Monday to Friday)
  if (nextDate.getDay() === 0) { // Sunday
    nextDate.setDate(nextDate.getDate() + 1); // Set to next Monday
  } else if (nextDate.getDay() === 6) { // Saturday
    nextDate.setDate(nextDate.getDate() + 2); // Set to next Monday
  }

  return nextDate;
}


