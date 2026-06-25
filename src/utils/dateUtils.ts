import { CHALLENGE_START, CHALLENGE_END } from '../constants/theme';

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDayNumber(dateStr: string): number {
  const start = new Date(CHALLENGE_START);
  const target = new Date(dateStr);
  const diff = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export function getTodayDayNumber(): number {
  return getDayNumber(getTodayString());
}

export function getDaysRemaining(): number {
  const today = new Date();
  const end = new Date(CHALLENGE_END);
  const diff = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export function isInChallenge(dateStr: string): boolean {
  return dateStr >= CHALLENGE_START && dateStr <= CHALLENGE_END;
}

export function getProgressPercent(): number {
  const day = getTodayDayNumber();
  return Math.min(100, Math.max(0, (day / 100) * 100));
}

// Streak = longest consecutive run ending at the most-recently-trained date.
// Starts from the last day with a workout (not from today), so retroactively
// logged days count correctly even when today hasn't been logged yet.
export function calcStreak(trainedDates: Set<string>): number {
  const today = getTodayString();
  const valid = [...trainedDates].filter(d => d <= today && d >= CHALLENGE_START);
  if (!valid.length) return 0;
  const latest = valid.sort().pop()!;
  let streak = 0;
  let cur = latest;
  while (cur >= CHALLENGE_START) {
    if (trainedDates.has(cur)) {
      streak++;
      const d = new Date(cur + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      cur = d.toISOString().split('T')[0];
    } else {
      break;
    }
  }
  return streak;
}
