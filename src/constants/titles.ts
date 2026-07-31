import { DayEntry } from '../types';

export const MAX_LEVEL = 30;

export interface TitleDef {
  key: string;
  label: string;
  sport: string;
  levelRequired: number;
  emoji: string;
}

// Flat XP cost per level — every level costs the same, so the required XP
// never grows as you climb. Keeps leveling approachable at high levels.
export const XP_PER_LEVEL = 100;

// XP needed to gain a single level (marginal cost) — constant for all levels
export function xpForLevel(_level: number): number {
  return XP_PER_LEVEL;
}

// Total cumulative XP needed to reach a given level (linear)
export function totalXpForLevel(level: number): number {
  return XP_PER_LEVEL * level;
}

export function getLevelFromXp(xp: number): number {
  let level = 0;
  while (level < MAX_LEVEL && xp >= totalXpForLevel(level + 1)) level++;
  return level;
}

export function getXpProgress(xp: number) {
  const level = getLevelFromXp(xp);
  const baseXp = totalXpForLevel(level);
  const neededXp = level < MAX_LEVEL ? xpForLevel(level + 1) : 0;
  return {
    level,
    currentXp: xp - baseXp,
    neededXp,
    pct: neededXp > 0 ? Math.min(1, (xp - baseXp) / neededXp) : 1,
  };
}

// ── XP Multipliers ────────────────────────────────────────────────────────────
// Harder sports give more XP per minute to balance effort fairly.
// Krafttraining is baseline 1.0 (lots of rest between sets).
export const SPORT_XP_MULTIPLIERS: Record<string, number> = {
  'HIIT': 1.8,
  'Vikings Training': 1.5,
  'Kampfsport': 1.4,
  'Laufen': 1.4,
  'Schwimmen': 1.3,
  'Cardio': 1.2,
  'Radfahren': 1.1,
  'Krafttraining': 1.0,
  'Sonstiges': 1.0,
};

// Intensity has only a mild influence on XP — the sport and duration matter more.
export const INTENSITY_XP_MULTIPLIERS: Record<string, number> = {
  leicht: 0.9,
  mittel: 1.0,
  intensiv: 1.1,
};

export function calcWorkoutXp(duration: number, sport: string, intensity?: string): number {
  const sportMult = SPORT_XP_MULTIPLIERS[sport] ?? 1.0;
  const intMult = INTENSITY_XP_MULTIPLIERS[intensity ?? 'mittel'] ?? 1.0;
  return Math.round(duration * sportMult * intMult);
}

// ── Titles ────────────────────────────────────────────────────────────────────

export const SPORT_TITLES: Record<string, TitleDef[]> = {
  'Krafttraining': [
    { key: 'hantelschuettler', label: 'Hantelschüttler', sport: 'Krafttraining', levelRequired: 5, emoji: '🏋️' },
    { key: 'eisenheber', label: 'Eisenheber', sport: 'Krafttraining', levelRequired: 10, emoji: '⚡' },
    { key: 'stahlmann', label: 'Stahlmann', sport: 'Krafttraining', levelRequired: 15, emoji: '🔩' },
    { key: 'kraftpaket', label: 'Kraftpaket', sport: 'Krafttraining', levelRequired: 20, emoji: '💥' },
    { key: 'muskelberg', label: 'Muskelberg', sport: 'Krafttraining', levelRequired: 25, emoji: '⛰️' },
  ],
  'Cardio': [
    { key: 'herzklopfer', label: 'Herzklopfer', sport: 'Cardio', levelRequired: 5, emoji: '❤️' },
    { key: 'pulsraser', label: 'Pulsraser', sport: 'Cardio', levelRequired: 10, emoji: '💓' },
    { key: 'ausdauermensch', label: 'Ausdauermensch', sport: 'Cardio', levelRequired: 15, emoji: '🫀' },
    { key: 'cardiomaschine', label: 'Cardiomaschine', sport: 'Cardio', levelRequired: 20, emoji: '🤖' },
    { key: 'herzensbrecher', label: 'Herzensbrecher', sport: 'Cardio', levelRequired: 25, emoji: '💔' },
  ],
  'HIIT': [
    { key: 'zappelphilipp', label: 'Zappelphilipp', sport: 'HIIT', levelRequired: 5, emoji: '🙃' },
    { key: 'intervallmacher', label: 'Intervallmacher', sport: 'HIIT', levelRequired: 10, emoji: '⏱️' },
    { key: 'hiitter', label: 'Hiitter', sport: 'HIIT', levelRequired: 15, emoji: '💢' },
    { key: 'intervalljager', label: 'Intervalljäger', sport: 'HIIT', levelRequired: 20, emoji: '🎯' },
    { key: 'feuergeist', label: 'Feuergeist', sport: 'HIIT', levelRequired: 25, emoji: '🔥' },
  ],
  'Laufen': [
    { key: 'gehender', label: 'Gehender', sport: 'Laufen', levelRequired: 5, emoji: '🚶' },
    { key: 'traber', label: 'Traber', sport: 'Laufen', levelRequired: 10, emoji: '🏃' },
    { key: 'laufer', label: 'Läufer', sport: 'Laufen', levelRequired: 15, emoji: '🏃' },
    { key: 'sprinter', label: 'Sprinter', sport: 'Laufen', levelRequired: 20, emoji: '⚡' },
    { key: 'windbrecher', label: 'Windbrecher', sport: 'Laufen', levelRequired: 25, emoji: '🌪️' },
  ],
  'Radfahren': [
    { key: 'stutzradfahrer', label: 'Stützradfahrer', sport: 'Radfahren', levelRequired: 5, emoji: '🛴' },
    { key: 'pedaltreter', label: 'Pedaltreter', sport: 'Radfahren', levelRequired: 10, emoji: '🚲' },
    { key: 'radler', label: 'Radler', sport: 'Radfahren', levelRequired: 15, emoji: '🚴' },
    { key: 'bergfluchter', label: 'Bergflüchter', sport: 'Radfahren', levelRequired: 20, emoji: '⛰️' },
    { key: 'windreiter', label: 'Windreiter', sport: 'Radfahren', levelRequired: 25, emoji: '🌬️' },
  ],
  'Schwimmen': [
    { key: 'planscher', label: 'Planscher', sport: 'Schwimmen', levelRequired: 5, emoji: '💦' },
    { key: 'badeente', label: 'Badeente', sport: 'Schwimmen', levelRequired: 10, emoji: '🦆' },
    { key: 'schwimmer', label: 'Schwimmer', sport: 'Schwimmen', levelRequired: 15, emoji: '🏊' },
    { key: 'delphin', label: 'Delphin', sport: 'Schwimmen', levelRequired: 20, emoji: '🐬' },
    { key: 'meeresbezwinger', label: 'Meeresbezwinger', sport: 'Schwimmen', levelRequired: 25, emoji: '🌊' },
  ],
  'Kampfsport': [
    { key: 'weissgurt', label: 'Weißgurt', sport: 'Kampfsport', levelRequired: 5, emoji: '🥋' },
    { key: 'blaugurt', label: 'Blaugurt', sport: 'Kampfsport', levelRequired: 10, emoji: '🥊' },
    { key: 'kampfer', label: 'Kämpfer', sport: 'Kampfsport', levelRequired: 15, emoji: '⚔️' },
    { key: 'krieger', label: 'Krieger', sport: 'Kampfsport', levelRequired: 20, emoji: '🛡️' },
    { key: 'sensei', label: 'Sensei', sport: 'Kampfsport', levelRequired: 25, emoji: '👺' },
  ],
  'Vikings Training': [
    { key: 'wikingerkind', label: 'Wikingerkind', sport: 'Vikings Training', levelRequired: 5, emoji: '🪓' },
    { key: 'schildtraeger', label: 'Schildträger', sport: 'Vikings Training', levelRequired: 10, emoji: '🛡️' },
    { key: 'berserker', label: 'Berserker', sport: 'Vikings Training', levelRequired: 15, emoji: '🔥' },
    { key: 'jarls_krieger', label: 'Jarls Krieger', sport: 'Vikings Training', levelRequired: 20, emoji: '⚔️' },
    { key: 'nordmann', label: 'Nordmann', sport: 'Vikings Training', levelRequired: 25, emoji: '🏔️' },
  ],
  'Sonstiges': [
    { key: 'bewegungsmensch', label: 'Bewegungsmensch', sport: 'Sonstiges', levelRequired: 5, emoji: '🤸' },
    { key: 'aktivist', label: 'Aktivist', sport: 'Sonstiges', levelRequired: 10, emoji: '💪' },
    { key: 'allrounder', label: 'Allrounder', sport: 'Sonstiges', levelRequired: 15, emoji: '🎭' },
    { key: 'vielseitiger', label: 'Vielseitiger', sport: 'Sonstiges', levelRequired: 20, emoji: '🎲' },
    { key: 'meister_der_vielfalt', label: 'Meister der Vielfalt', sport: 'Sonstiges', levelRequired: 25, emoji: '🌈' },
  ],
};

export const TITLE_BLACK: TitleDef = {
  key: 'black', label: 'BLACK', sport: '', levelRequired: 30, emoji: '⬛',
};

export function getUnlockedTitles(sportXp: Record<string, number>): TitleDef[] {
  const unlocked: TitleDef[] = [];
  let hasBlack = false;
  for (const [sport, titles] of Object.entries(SPORT_TITLES)) {
    const level = getLevelFromXp(sportXp[sport] ?? 0);
    if (level >= MAX_LEVEL) hasBlack = true;
    for (const t of titles) {
      if (level >= t.levelRequired) unlocked.push(t);
    }
  }
  if (hasBlack) unlocked.unshift(TITLE_BLACK);
  return unlocked;
}

export function getTitleByKey(key: string): TitleDef | undefined {
  if (key === 'black') return TITLE_BLACK;
  for (const titles of Object.values(SPORT_TITLES)) {
    const found = titles.find(t => t.key === key);
    if (found) return found;
  }
  return undefined;
}

export function computeSportXp(entries: DayEntry[]): Record<string, number> {
  const xp: Record<string, number> = {};
  for (const entry of entries) {
    if (!entry.workout) continue;
    const ws = entry.workout.workouts ?? [];
    if (!ws.length && entry.workout.type) {
      const t = entry.workout.type;
      xp[t] = (xp[t] ?? 0) + calcWorkoutXp(entry.workout.duration ?? 0, t, entry.workout.intensity);
      continue;
    }
    for (const w of ws) {
      xp[w.type] = (xp[w.type] ?? 0) + calcWorkoutXp(w.duration, w.type, w.intensity);
    }
  }
  return xp;
}

export function totalXp(sportXp: Record<string, number>): number {
  return Object.values(sportXp).reduce((s, v) => s + v, 0);
}
