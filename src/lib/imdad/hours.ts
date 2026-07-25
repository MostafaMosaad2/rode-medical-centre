/** Online booking window: 4:00 PM – 10:00 PM (inclusive). */
export const BOOKING_START_MINUTES = 16 * 60; // 16:00
export const BOOKING_END_MINUTES = 22 * 60; // 22:00

export function timeToMinutes(time: string): number | null {
  const [h, m] = time.split(":").map((x) => Number(x));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function isWithinBookingHours(time: string): boolean {
  const minutes = timeToMinutes(time);
  if (minutes === null) return false;
  return minutes >= BOOKING_START_MINUTES && minutes <= BOOKING_END_MINUTES;
}
