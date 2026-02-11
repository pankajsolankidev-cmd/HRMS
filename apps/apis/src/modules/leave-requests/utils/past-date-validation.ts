export function validatePastDatesOnly(fromDate: string, toDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (to < from) {
    return {
      valid: false,
      message: "To date cannot be before from date",
    };
  }

  if (from >= today || to >= today) {
    return {
      valid: false,
      message: "Manual leave can only be created for past dates",
    };
  }

  return { valid: true };
}
