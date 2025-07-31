
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