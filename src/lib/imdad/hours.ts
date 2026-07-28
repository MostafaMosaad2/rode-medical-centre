/** Online booking window: 4:00 PM – 10:00 PM (inclusive). */
export const BOOKING_START_MINUTES = 16 * 60; // 16:00
export const BOOKING_END_MINUTES = 22 * 60; // 22:00

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function timeToMinutes(time: string): number | null {
  const [h, m] = time.split(":").map((x) => Number(x));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function isWithinBookingHours(time: string): boolean {
  const minutes = timeToMinutes(time);
  if (minutes === null) return false;
  return minutes >= BOOKING_START_MINUTES && minutes <= BOOKING_END_MINUTES;
}

/** True when start time has consecutive free slots covering `durationMinutes`. */
export function hasHourAvailability(
  time: string,
  availableTimes: ReadonlySet<string>,
  durationMinutes = 60,
  stepMinutes = 30,
): boolean {
  const start = timeToMinutes(time);
  if (start === null) return false;
  for (
    let t = start + stepMinutes;
    t < start + durationMinutes;
    t += stepMinutes
  ) {
    if (!availableTimes.has(minutesToTime(t))) return false;
  }
  return true;
}
