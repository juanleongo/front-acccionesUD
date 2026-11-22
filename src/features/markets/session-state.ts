export type SessionState = 'open' | 'closed' | 'unknown';

/** `open` in the daily status contract means trading day, not open right now. */
export function sessionState(
  schedule:
    | {
        date: string;
        open: boolean;
        open_at: string | null;
        close_at: string | null;
      }
    | undefined,
  day: string,
  now: number,
): SessionState {
  if (!schedule || schedule.date !== day || !Number.isFinite(now))
    return 'unknown';
  if (!schedule.open) return 'closed';
  const start = schedule.open_at ? Date.parse(schedule.open_at) : NaN;
  const end = schedule.close_at ? Date.parse(schedule.close_at) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end)
    return 'unknown';
  return now >= start && now < end ? 'open' : 'closed';
}
