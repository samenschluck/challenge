import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { User, DayEntry, Workout, WorkoutEntry } from '../types';
import { displayName } from '../utils/displayName';

function getWorkouts(w: WorkoutEntry): Workout[] {
  if (w.workouts?.length) return w.workouts;
  if (w.type) return [{ id: 'legacy', type: w.type, duration: w.duration ?? 0, intensity: w.intensity ?? 'mittel', notes: w.notes }];
  return [];
}

interface Props {
  user: User;
  entry: DayEntry | null;
  isMe?: boolean;
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(1, value / max);
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValue}>{value}g</Text>
    </View>
  );
}

export default function UserDayCard({ user, entry, isMe }: Props) {
  const hasWorkout = !!entry?.workout;
  const hasNutrition = !!entry?.nutrition;

  return (
    <View style={[styles.card, isMe && styles.cardMe]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: user.avatarColor + '33', borderColor: user.avatarColor }]}>
          <Text style={styles.avatarText}>{user.avatar}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{displayName(user)} {isMe ? '(du)' : ''}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, hasWorkout ? styles.badgeGreen : styles.badgeGray]}>
              <Text style={styles.badgeText}>{hasWorkout ? '💪 Sport' : '— Sport'}</Text>
            </View>
            <View style={[styles.badge, hasNutrition ? styles.badgeBlue : styles.badgeGray]}>
              <Text style={styles.badgeText}>{hasNutrition ? '🥗 Ernährung' : '— Ernährung'}</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {entry && (
            <View style={styles.moodBubble}>
              <Text style={styles.moodText}>{['😴', '😐', '🙂', '😊', '🔥'][((entry.mood || 3) - 1)]}</Text>
            </View>
          )}
          {entry?.weight ? (
            <Text style={styles.weightText}>⚖️ {entry.weight} kg</Text>
          ) : null}
        </View>
      </View>

      {hasWorkout && getWorkouts(entry!.workout!).map((w, i) => (
        <View key={i} style={styles.workoutRow}>
          <Text style={styles.workoutIcon}>🏋️</Text>
          <Text style={styles.workoutText}>{w.type} · {w.duration} Min · {w.intensity}</Text>
        </View>
      ))}

      {hasNutrition && (
        <View style={styles.nutritionSection}>
          <View style={styles.calRow}>
            <Text style={styles.calLabel}>Kalorien</Text>
            <Text style={styles.calValue}>{entry!.nutrition!.calories} kcal</Text>
          </View>
          <MacroBar label="Protein" value={entry!.nutrition!.protein} max={200} color={COLORS.protein} />
          <MacroBar label="Kohlenhydrate" value={entry!.nutrition!.carbs} max={300} color={COLORS.carbs} />
          <MacroBar label="Fett" value={entry!.nutrition!.fat} max={100} color={COLORS.fat} />
          {entry!.nutrition!.water > 0 && (
            <Text style={styles.water}>💧 {entry!.nutrition!.water} ml Wasser</Text>
          )}
        </View>
      )}

      {!entry && (
        <Text style={styles.emptyText}>Noch nichts eingetragen heute</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardMe: { borderColor: COLORS.primary + '88' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 22 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeGreen: { backgroundColor: COLORS.success + '33' },
  badgeBlue: { backgroundColor: COLORS.protein + '33' },
  badgeGray: { backgroundColor: COLORS.border },
  badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.text },
  moodBubble: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  moodText: { fontSize: 24 },
  workoutRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success + '22', borderRadius: 10, padding: 10, marginBottom: 10 },
  workoutIcon: { fontSize: 20, marginRight: 8 },
  workoutText: { color: COLORS.successLight, fontSize: 13, fontWeight: '600' },
  nutritionSection: { backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 12 },
  calRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calLabel: { fontSize: 14, color: COLORS.textSecondary },
  calValue: { fontSize: 16, fontWeight: '800', color: COLORS.calories },
  macroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  macroLabel: { width: 100, fontSize: 12, color: COLORS.textSecondary },
  barBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginRight: 8 },
  barFill: { height: 6, borderRadius: 3 },
  macroValue: { width: 40, fontSize: 12, color: COLORS.text, textAlign: 'right' },
  water: { marginTop: 6, fontSize: 12, color: COLORS.protein },
  weightText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', padding: 8 },
});
