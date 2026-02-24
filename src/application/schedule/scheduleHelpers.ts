/**
 * scheduleHelpers — pure functions shared by both schedule use cases.
 *
 * Kept framework-free so they are trivially unit-testable.
 */

/**
 * Returns the default isOpen value for a date string (YYYY-MM-DD).
 * Default rule:
 *   Monday–Friday  → open  (true)
 *   Saturday–Sunday → closed (false)
 *
 * NOTE: `new Date("YYYY-MM-DD")` is parsed as UTC midnight, so getUTCDay()
 * is used to avoid local-timezone day-of-week shifts.
 */
export function defaultIsOpen(date: string): boolean {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return dow >= 1 && dow <= 5;
}

/**
 * Returns today's date in the server's UTC timezone as a YYYY-MM-DD string.
 */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Adds `days` calendar days to a YYYY-MM-DD string and returns a new one.
 */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns true if `date` is strictly before `today` (both YYYY-MM-DD strings).
 */
export function isInPast(date: string, today: string): boolean {
  return date < today;
}

/**
 * Generates every YYYY-MM-DD string between `from` and `to` (inclusive).
 */
export function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  let current = from;
  while (current <= to) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}
