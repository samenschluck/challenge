import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, CHALLENGE_START } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { DayEntry } from '../types';
import { getTodayString } from '../utils/dateUtils';

function calcStreak(entries: DayEntry[], userId: string): number {
  const today = getTodayString();
  let streak = 0;
  const cur = new Date(today);
  while (true) {
    const d = cur.toISOString().split('T')[0];
    if (d < CHALLENGE_START) break;
    const e = entries.find(x => x.userId === userId && x.date === d);
    if (e?.workout && e?.nutrition) { streak++; cur.setDate(cur.getDate() - 1); }
    else break;
  }
  return streak;
}

function calcStats(entries: DayEntry[], userId: string) {
  const mine = entries.filter(e => e.userId === userId);
  const withWorkout = mine.filter(e => !!e.workout).length;
  const withNutrition = mine.filter(e => !!e.nutrition).length;
  const full = mine.filter(e => !!e.workout && !!e.nutrition).length;
  const avgCal = mine.filter(e => e.nutrition?.calories).length > 0
    ? Math.round(mine.reduce((s, e) => s + (e.nutrition?.calories ?? 0), 0) / mine.filter(e => e.nutrition?.calories).length)
    : 0;
  const avgProtein = mine.filter(e => e.nutrition?.protein).length > 0
    ? Math.round(mine.reduce((s, e) => s + (e.nutrition?.protein ?? 0), 0) / mine.filter(e => e.nutrition?.protein).length)
    : 0;
  const totalWorkoutMin = mine.reduce((s, e) => s + (e.workout?.duration ?? 0), 0);
  return { withWorkout, withNutrition, full, avgCal, avgProtein, totalWorkoutMin };
}

function MacroBar({ label, values, colors, users }: { label: string; values: number[]; colors: string[]; users: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <View style={styles.macroComp}>
      <Text style={styles.macroCompLabel}>{label}</Text>
      {values.map((v, i) => (
        <View key={i} style={styles.macroCompRow}>
          <Text style={styles.macroCompUser}>{users[i]}</Text>
          <View style={styles.macroCompBg}>
            <View style={[styles.macroCompFill, { width: `${(v / max) * 100}%` as any, backgroundColor: colors[i] }]} />
          </View>
          <Text style={styles.macroCompVal}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StatsScreen() {
  const { currentUser, allUsers, myEntries, todayEntries } = useApp();

  const today = getTodayString();
  const daysElapsed = Math.max(1, Math.floor(
    (new Date(today).getTime() - new Date(CHALLENGE_START).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1);

  const myStreak = useMemo(() => calcStreak(myEntries, currentUser?.id ?? ''), [myEntries, currentUser]);
  const myStats = useMemo(() => calcStats(myEntries, currentUser?.id ?? ''), [myEntries, currentUser]);

  const displayUsers = useMemo(() => {
    const list = [...allUsers];
    if (currentUser && !list.find(u => u.id === currentUser.id)) list.unshift(currentUser);
    return list;
  }, [allUsers, currentUser]);

  return (
    <LinearGradient colors={['#0f0f1a', '#0f0f1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Statistiken</Text>

          {/* My highlights */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Deine Highlights</Text>
            <View style={styles.highlightRow}>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightNum}>{myStreak}</Text>
                <Text style={styles.highlightLabel}>🔥 Streak</Text>
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightNum}>{myStats.full}</Text>
                <Text style={styles.highlightLabel}>✅ Komplett</Text>
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightNum}>{myStats.withWorkout}</Text>
                <Text style={styles.highlightLabel}>💪 Sport</Text>
              </View>
              <View style={styles.highlightBox}>
                <Text style={styles.highlightNum}>{Math.round((myStats.full / daysElapsed) * 100)}%</Text>
                <Text style={styles.highlightLabel}>📊 Quote</Text>
              </View>
            </View>
          </View>

          {/* Workout summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sport Zusammenfassung</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{myStats.withWorkout}</Text>
                <Text style={styles.summaryLabel}>Einheiten</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{myStats.totalWorkoutMin}</Text>
                <Text style={styles.summaryLabel}>Gesamt Min</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{myStats.withWorkout > 0 ? Math.round(myStats.totalWorkoutMin / myStats.withWorkout) : 0}</Text>
                <Text style={styles.summaryLabel}>Ø Min/Tag</Text>
              </View>
            </View>
          </View>

          {/* Nutrition summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ernährung Durchschnitt</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: COLORS.calories }]}>{myStats.avgCal}</Text>
                <Text style={styles.summaryLabel}>Ø kcal/Tag</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: COLORS.protein }]}>{myStats.avgProtein}g</Text>
                <Text style={styles.summaryLabel}>Ø Protein</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: COLORS.success }]}>{myStats.withNutrition}</Text>
                <Text style={styles.summaryLabel}>Tage getrackt</Text>
              </View>
            </View>
          </View>

          {/* Leaderboard */}
          {displayUsers.length > 1 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏆 Leaderboard</Text>
              {displayUsers.map((u, i) => {
                const streak = calcStreak(u.id === currentUser?.id ? myEntries : todayEntries, u.id);
                const stats = calcStats(u.id === currentUser?.id ? myEntries : todayEntries, u.id);
                const pct = Math.round((stats.full / daysElapsed) * 100);
                return (
                  <View key={u.id} style={[styles.leaderRow, i === 0 && styles.leaderFirst]}>
                    <Text style={styles.leaderRank}>{['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`}</Text>
                    <View style={[styles.leaderAvatar, { backgroundColor: u.avatarColor + '33', borderColor: u.avatarColor }]}>
                      <Text style={styles.leaderAvatarText}>{u.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leaderName}>{u.name} {u.id === currentUser?.id ? '(du)' : ''}</Text>
                      <View style={styles.leaderBarBg}>
                        <View style={[styles.leaderBarFill, { width: `${pct}%` as any, backgroundColor: u.avatarColor }]} />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.leaderPct}>{pct}%</Text>
                      <Text style={styles.leaderStreak}>🔥 {streak}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.footer}>Challenge: 23. Juni – 30. September 2026</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  highlightRow: { flexDirection: 'row', gap: 8 },
  highlightBox: { flex: 1, backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 12, alignItems: 'center' },
  highlightNum: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  highlightLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 26, fontWeight: '900', color: COLORS.text },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: COLORS.cardLight, gap: 10 },
  leaderFirst: { borderWidth: 1, borderColor: COLORS.warning + '88' },
  leaderRank: { fontSize: 22, width: 32 },
  leaderAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  leaderAvatarText: { fontSize: 20 },
  leaderName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  leaderBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3 },
  leaderBarFill: { height: 6, borderRadius: 3 },
  leaderPct: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  leaderStreak: { fontSize: 12, color: COLORS.textSecondary },
  macroComp: { marginBottom: 16 },
  macroCompLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  macroCompRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  macroCompUser: { width: 44, fontSize: 11, color: COLORS.textSecondary },
  macroCompBg: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginRight: 8 },
  macroCompFill: { height: 8, borderRadius: 4 },
  macroCompVal: { width: 36, fontSize: 12, color: COLORS.text, textAlign: 'right' },
  footer: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});
