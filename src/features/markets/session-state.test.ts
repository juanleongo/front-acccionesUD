import { expect, it } from 'vitest';
import { sessionState } from './session-state';

const day = '2026-11-20';
const schedule = {
  date: day,
  open: true,
  open_at: `${day}T14:30:00Z`,
  close_at: `${day}T21:00:00Z`,
};

it('distinguishes a trading day from a session open now, including exact opening and closing boundaries', () => {
  for (const [time, expected] of [
    ['14:29:59', 'closed'],
    ['14:30:00', 'open'],
    ['20:59:59', 'open'],
    ['21:00:00', 'closed'],
  ] as const) {
    expect(sessionState(schedule, day, Date.parse(`${day}T${time}Z`))).toBe(
      expected,
    );
  }
});

it('respects special closures and early closing times', () => {
  const now = Date.parse(`${day}T19:00:00Z`);
  expect(
    sessionState({ ...schedule, close_at: `${day}T18:00:00Z` }, day, now),
  ).toBe('closed');
  expect(
    sessionState(
      { ...schedule, open: false, open_at: null, close_at: null },
      day,
      now,
    ),
  ).toBe('closed');
});

it('never invents open/closed states from missing, invalid or previous-day data', () => {
  const now = Date.parse(`${day}T16:00:00Z`);
  expect(sessionState(undefined, day, now)).toBe('unknown');
  expect(sessionState(schedule, '2026-11-21', now)).toBe('unknown');
  expect(sessionState({ ...schedule, open_at: null }, day, now)).toBe(
    'unknown',
  );
  expect(
    sessionState({ ...schedule, close_at: schedule.open_at }, day, now),
  ).toBe('unknown');
  expect(sessionState(schedule, day, NaN)).toBe('unknown');
});
