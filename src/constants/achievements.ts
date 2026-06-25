import { DayEntry } from '../types';
import { getLevelFromXp } from './titles';
import { CHALLENGE_START } from './theme';
import { getTodayString, getDayNumber } from '../utils/dateUtils';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  emoji: string;
  rarity: AchievementRarity;
  color: string;
}

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common:    '#78909C',
  rare:      '#42A5F5',
  epic:      '#CE93D8',
  legendary: '#FFB300',
};

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  common:    'Gewöhnlich',
  rare:      'Selten',
  epic:      'Episch',
  legendary: 'Legendär',
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // ─── Streaks ─────────────────────────────────────────────────────────────────
  { key: 'first_flame',    title: 'Erste Flamme',    description: '3 Tage hintereinander trainiert',        emoji: '🔥', rarity: 'common',    color: '#FF7043' },
  { key: 'week_warrior',   title: 'Wochenkämpfer',   description: '7 Tage Streak erreicht',                 emoji: '⚡', rarity: 'rare',      color: '#FDD835' },
  { key: 'momentum',       title: 'Momentum',        description: '14 Tage Streak erreicht',                emoji: '💫', rarity: 'rare',      color: '#42A5F5' },
  { key: 'unstoppable',    title: 'Unaufhaltsam',    description: '30 Tage Streak erreicht',                emoji: '🌊', rarity: 'epic',      color: '#26C6DA' },
  { key: 'fifty_streak',   title: 'Halb-Legende',    description: '50 Tage Streak erreicht',                emoji: '👑', rarity: 'legendary', color: '#FFB300' },

  // ─── Training count ───────────────────────────────────────────────────────────
  { key: 'first_workout',       title: 'Erster Schritt',  description: 'Erste Trainingseinheit abgeschlossen',    emoji: '🎯', rarity: 'common', color: '#66BB6A' },
  { key: 'ten_workouts',        title: 'Routinier',       description: '10 Trainingseinheiten abgeschlossen',     emoji: '💪', rarity: 'common', color: '#4CAF50' },
  { key: 'twentyfive_workouts', title: 'Stammgast',       description: '25 Trainingseinheiten abgeschlossen',     emoji: '🏋️', rarity: 'rare',   color: '#42A5F5' },
  { key: 'fifty_workouts',      title: 'Maschine',        description: '50 Trainingseinheiten abgeschlossen',     emoji: '🦾', rarity: 'epic',   color: '#CE93D8' },
  { key: 'hundred_workouts',    title: '100 Tage!',       description: 'Alle 100 Challenge-Tage trainiert',       emoji: '🏆', rarity: 'legendary', color: '#FFB300' },

  // ─── XP & Levels ──────────────────────────────────────────────────────────────
  { key: 'first_level5',  title: 'Aufsteiger', description: 'Level 5 in einer Sportart erreicht',  emoji: '⭐', rarity: 'common',    color: '#FDD835' },
  { key: 'first_level10', title: 'Profi',      description: 'Level 10 in einer Sportart erreicht', emoji: '🌟', rarity: 'rare',      color: '#42A5F5' },
  { key: 'first_level20', title: 'Elite',      description: 'Level 20 in einer Sportart erreicht', emoji: '💎', rarity: 'epic',      color: '#CE93D8' },
  { key: 'black_rank',    title: 'BLACK',      description: 'Level 30 in einer Sportart erreicht', emoji: '⬛', rarity: 'legendary', color: '#FFD700' },

  // ─── Nutrition ────────────────────────────────────────────────────────────────
  { key: 'nutrition_start', title: 'Ernährungsbewusst', description: 'Erstmals Nährwerte eingetragen',  emoji: '🥗', rarity: 'common', color: '#66BB6A' },
  { key: 'nutrition_ten',   title: 'Kalorienjäger',     description: '10× Nährwerte eingetragen',       emoji: '📊', rarity: 'rare',   color: '#42A5F5' },

  // ─── Weight ───────────────────────────────────────────────────────────────────
  { key: 'first_weight',  title: 'Waage-Debüt', description: 'Erstmals Gewicht eingetragen',    emoji: '⚖️', rarity: 'common', color: '#78909C' },
  { key: 'weight_tracker', title: 'Daten-Nerd', description: '20× Gewicht eingetragen',         emoji: '📉', rarity: 'rare',   color: '#26C6DA' },

  // ─── Sport variety ────────────────────────────────────────────────────────────
  { key: 'five_sports', title: 'Allrounder',        description: '5 verschiedene Sportarten ausprobiert', emoji: '🎭', rarity: 'rare', color: '#FF7043' },
  { key: 'all_sports',  title: 'Meister der Vielfalt', description: 'Alle 9 Sportarten ausprobiert',      emoji: '🌈', rarity: 'epic', color: '#CE93D8' },

  // ─── Intensity ────────────────────────────────────────────────────────────────
  { key: 'first_intense', title: 'Kein Schmerz',      description: 'Erstes intensives Training absolviert',  emoji: '🔥', rarity: 'common', color: '#EF5350' },
  { key: 'ten_intense',   title: 'Schmerzliebhaber',  description: '10 intensive Trainings absolviert',      emoji: '💥', rarity: 'rare',   color: '#FF7043' },

  // ─── Full days ────────────────────────────────────────────────────────────────
  { key: 'first_full_day',    title: 'Vollständig',  description: 'Erster Tag mit Training + Nährwerten',  emoji: '✅', rarity: 'common', color: '#66BB6A' },
  { key: 'ten_full_days',     title: 'Konsequent',   description: '10 vollständige Tage erreicht',          emoji: '🎖️', rarity: 'rare',   color: '#42A5F5' },
  { key: 'thirty_full_days',  title: 'Diszipliniert', description: '30 vollständige Tage erreicht',         emoji: '🏅', rarity: 'epic',   color: '#CE93D8' },

  // ─── Long workouts ────────────────────────────────────────────────────────────
  { key: 'long_workout', title: 'Ausdauerprofi', description: '90 Minuten am Stück trainiert',           emoji: '⏱️', rarity: 'rare', color: '#26C6DA' },
  { key: 'beast_mode',   title: 'Beast Mode',    description: '120+ Minuten an einem Tag trainiert',     emoji: '🦁', rarity: 'epic', color: '#FF7043' },

  // ─── Sport debuts ─────────────────────────────────────────────────────────────
  { key: 'viking_debut', title: 'Wikinger-Debut', description: 'Erstes Vikings Training absolviert',     emoji: '🪓', rarity: 'common', color: '#78909C' },
  { key: 'fight_debut',  title: 'Kampf-Debut',    description: 'Erstes Kampfsport-Training absolviert',  emoji: '🥋', rarity: 'common', color: '#EF5350' },

  // ─── Mood ─────────────────────────────────────────────────────────────────────
  { key: 'on_fire', title: 'Im Flow', description: '5× mit Stimmung "Feuer 🔥" eingetragen', emoji: '😤', rarity: 'rare', color: '#FF7043' },

  // ─── Challenge milestones ─────────────────────────────────────────────────────
  { key: 'day25', title: 'Ein Viertel', description: 'Challenge-Tag 25 mit Training abgeschlossen', emoji: '🎯', rarity: 'rare',      color: '#42A5F5' },
  { key: 'day50', title: 'Halbzeit!',   description: 'Challenge-Tag 50 mit Training abgeschlossen', emoji: '🏅', rarity: 'epic',      color: '#CE93D8' },
  { key: 'day75', title: 'Fast da!',    description: 'Challenge-Tag 75 mit Training abgeschlossen', emoji: '🥈', rarity: 'legendary', color: '#FFB300' },
];

function calcStreakFromEntries(entries: DayEntry[]): number {
  const today = getTodayString();
  const trainedDates = new Set(entries.filter(e => e.workout).map(e => e.date));
  let streak = 0;
  const cur = new Date(today);
  while (true) {
    const d = cur.toISOString().split('T')[0];
    if (d < CHALLENGE_START) break;
    if (trainedDates.has(d)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else if (d === today) {
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function computeUnlockedAchievements(
  entries: DayEntry[],
  sportXp: Record<string, number>,
): string[] {
  const unlocked = new Set<string>();

  const withWorkout   = entries.filter(e => e.workout);
  const withNutrition = entries.filter(e => e.nutrition);
  const withWeight    = entries.filter(e => e.weight);
  const fullDays      = entries.filter(e => e.workout && e.nutrition);

  // ── Streak ──────────────────────────────────────────────────────────────────
  const streak = calcStreakFromEntries(entries);
  if (streak >= 3)  unlocked.add('first_flame');
  if (streak >= 7)  unlocked.add('week_warrior');
  if (streak >= 14) unlocked.add('momentum');
  if (streak >= 30) unlocked.add('unstoppable');
  if (streak >= 50) unlocked.add('fifty_streak');

  // ── Training count ──────────────────────────────────────────────────────────
  if (withWorkout.length >= 1)   unlocked.add('first_workout');
  if (withWorkout.length >= 10)  unlocked.add('ten_workouts');
  if (withWorkout.length >= 25)  unlocked.add('twentyfive_workouts');
  if (withWorkout.length >= 50)  unlocked.add('fifty_workouts');
  if (withWorkout.length >= 100) unlocked.add('hundred_workouts');

  // ── XP / Levels ─────────────────────────────────────────────────────────────
  const maxLevel = Object.values(sportXp).reduce((m, xp) => Math.max(m, getLevelFromXp(xp)), 0);
  if (maxLevel >= 5)  unlocked.add('first_level5');
  if (maxLevel >= 10) unlocked.add('first_level10');
  if (maxLevel >= 20) unlocked.add('first_level20');
  if (maxLevel >= 30) unlocked.add('black_rank');

  // ── Nutrition ───────────────────────────────────────────────────────────────
  if (withNutrition.length >= 1)  unlocked.add('nutrition_start');
  if (withNutrition.length >= 10) unlocked.add('nutrition_ten');

  // ── Weight ──────────────────────────────────────────────────────────────────
  if (withWeight.length >= 1)  unlocked.add('first_weight');
  if (withWeight.length >= 20) unlocked.add('weight_tracker');

  // ── Sport variety ────────────────────────────────────────────────────────────
  const usedSports = new Set<string>();
  for (const e of entries) {
    if (!e.workout) continue;
    const ws = e.workout.workouts ?? [];
    if (ws.length) ws.forEach(w => usedSports.add(w.type));
    else if (e.workout.type) usedSports.add(e.workout.type);
  }
  if (usedSports.size >= 5) unlocked.add('five_sports');
  if (usedSports.size >= 9) unlocked.add('all_sports');
  if (usedSports.has('Vikings Training')) unlocked.add('viking_debut');
  if (usedSports.has('Kampfsport'))       unlocked.add('fight_debut');

  // ── Intensity ───────────────────────────────────────────────────────────────
  let intenseCount = 0;
  for (const e of entries) {
    if (!e.workout) continue;
    const ws = e.workout.workouts ?? [];
    const isIntense = ws.length
      ? ws.some(w => w.intensity === 'intensiv')
      : e.workout.intensity === 'intensiv';
    if (isIntense) intenseCount++;
  }
  if (intenseCount >= 1)  unlocked.add('first_intense');
  if (intenseCount >= 10) unlocked.add('ten_intense');

  // ── Full days ───────────────────────────────────────────────────────────────
  if (fullDays.length >= 1)  unlocked.add('first_full_day');
  if (fullDays.length >= 10) unlocked.add('ten_full_days');
  if (fullDays.length >= 30) unlocked.add('thirty_full_days');

  // ── Long workouts ────────────────────────────────────────────────────────────
  for (const e of entries) {
    if (!e.workout) continue;
    const ws = e.workout.workouts ?? [];
    const totalMin = ws.length ? ws.reduce((s, w) => s + w.duration, 0) : (e.workout.duration ?? 0);
    const maxSingle = ws.length ? Math.max(...ws.map(w => w.duration)) : (e.workout.duration ?? 0);
    if (maxSingle >= 90)  unlocked.add('long_workout');
    if (totalMin  >= 120) unlocked.add('beast_mode');
  }

  // ── Mood ────────────────────────────────────────────────────────────────────
  if (entries.filter(e => e.mood === 5).length >= 5) unlocked.add('on_fire');

  // ── Challenge milestones ─────────────────────────────────────────────────────
  for (const e of entries) {
    if (!e.workout) continue;
    const day = getDayNumber(e.date);
    if (day >= 25) unlocked.add('day25');
    if (day >= 50) unlocked.add('day50');
    if (day >= 75) unlocked.add('day75');
  }

  return Array.from(unlocked);
}
