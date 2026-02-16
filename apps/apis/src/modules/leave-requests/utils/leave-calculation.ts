function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function countWeekendDays(start: Date, end: Date) {
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    if (isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export function calculateLeaveTotalsSimple(params: {
  fromDate: string;
  toDate: string;
  dayType: string;
  fromHour: number;
  toHour: number;
}) {
  const { fromDate, toDate, dayType, fromHour, toHour } = params;

  let totalHours = 0;

  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (isWeekend(start)) {
    throw new Error("Leave cannot start on weekend");
  }
  if (isWeekend(end)) {
    throw new Error("Leave cannot end on weekend");
  }

  if (fromDate === toDate) {
    if (dayType === "full_day") totalHours = 8;
    else if (dayType === "first_half") totalHours = 4;
    else if (dayType === "second_half") totalHours = 4;
    else if (dayType === "multiple_days") {
      totalHours = fromHour + toHour;
    }
  } else {
    const diffDays =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const weekendCount = countWeekendDays(start, end);
    const workingDays = diffDays - weekendCount;

    if (dayType === "multiple_days") {
      totalHours += fromHour;

      if (workingDays > 2) {
        totalHours += (workingDays - 2) * 8;
      }

      totalHours += toHour;
    } else if (dayType === "full_day") {
      totalHours = workingDays * 8;
    }
  }

  const totalDays = totalHours / 8;
  return { totalHours, totalDays };
}
