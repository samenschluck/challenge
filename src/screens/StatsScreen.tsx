import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, CHALLENGE_START } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { DayEntry, User } from '../types';
import { getTodayString } from '../utils/dateUtils';
import { displayName } from '../utils/displayName';
import {
  SPORT_TITLES, getTitleByKey, getLevelFromXp, getXpProgress,
  totalXp, computeSportXp, MAX_LEVEL,
} from '../constants/titles';

const SPORT_EMOJIS: Record<string, string> = {
  'Krafttraining': '🏋️', 'Cardio': '❤️', 'HIIT': '⚡',
  'Laufen': '🏃', 'Radfahren': '🚴', 'Schwimmen': '🏊',
  'Sonstiges': '🤸',
};

function calcStreak(entries: DayEntry[], userId: string): number {
  const today = getTodayString();
  let streak = 0;
  const cur = new Date(today);
  while (true) {
    const d = cur.toISOString().split('T')[0];
    if (d < CHALLENGE_START) break;
    const e = entries.find(x => x.userId === userId && x.date === d);
    if (e?.workout) { streak++; cur.setDate(cur.getDate() - 1); }
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
  return { withWorkout, withNutrition, full, avgCal, avgProtein };
}

function XpBar({ xp, color }: { xp: number; color: string }) {
  const { level, currentXp, neededXp, pct } = getXpProgress(xp);
  const isMax = level >= MAX_LEVEL;
  return (
    <View style={xpBarStyles.wrap}>
      <View style={xpBarStyles.row}>
        <Text style={[xpBarStyles.level, { color }]}>Lvl {level}</Text>
        {!isMax && <Text style={xpBarStyles.xpText}>{currentXp}/{neededXp} XP</Text>}
        {isMax && <Text style={[xpBarStyles.xpText, { color: '#ffd700' }]}>MAX</Text>}
      </View>
      <View style={xpBarStyles.bg}>
        <View style={[xpBarStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}
const xpBarStyles = StyleSheet.create({
  wrap: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  level: { fontSize: 13, fontWeight: '800' },
  xpText: { fontSize: 11, color: COLORS.textMuted },
  bg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});

export default function StatsScreen() {
  const { currentUser, allUsers, myEntries, mySportXp } = useApp();

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

  // For each user, get their sportXp (current user uses live mySportXp, others use stored)
  function getUserSportXp(u: User): Record<string, number> {
    if (u.id === currentUser?.id) return mySportXp;
    return u.sportXp ?? {};
  }

  // Rank users by total XP
  const rankedUsers = useMemo(() => {
    return [...displayUsers].sort((a, b) => totalXp(getUserSportXp(b)) - totalXp(getUserSportXp(a)));
  }, [displayUsers, mySportXp]);

  // Collect all sports anyone has trained in
  const activeSports = useMemo(() => {
    const sports = new Set<string>();
    for (const u of displayUsers) {
      const xp = getUserSportXp(u);
      Object.keys(xp).forEach(s => { if (xp[s] > 0) sports.add(s); });
    }
    return Array.from(sports).sort();
  }, [displayUsers, mySportXp]);

  const RANK_ICONS = ['🥇', '🥈', '🥉'];

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
                <Text style={styles.highlightNum}>{myStats.avgCal > 0 ? myStats.avgCal : '—'}</Text>
                <Text style={styles.highlightLabel}>🍽️ Ø kcal</Text>
              </View>
            </View>
          </View>

          {/* My sport levels */}
          {Object.keys(mySportXp).length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚔️ Deine Sport-Level</Text>
              {Object.entries(mySportXp)
                .filter(([, xp]) => xp > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([sport, xp]) => {
                  const { level } = getXpProgress(xp);
                  const nextTitle = (SPORT_TITLES[sport] ?? []).find(t => t.levelRequired > level);
                  return (
                    <View key={sport} style={styles.sportLevelRow}>
                      <Text style={styles.sportEmoji}>{SPORT_EMOJIS[sport] ?? '🏅'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sportName}>{sport}</Text>
                        {nextTitle && (
                          <Text style={styles.nextTitleHint}>
                            Nächster Titel: {nextTitle.emoji} {nextTitle.label} (Lvl {nextTitle.levelRequired})
                          </Text>
                        )}
                        <XpBar xp={xp} color={COLORS.primary} />
                      </View>
                      <Text style={styles.sportXpTotal}>{xp} XP</Text>
                    </View>
                  );
                })}
            </View>
          )}

          {/* Leaderboard */}
          {rankedUsers.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏆 Leaderboard</Text>
              {rankedUsers.map((u, i) => {
                const sportXp = getUserSportXp(u);
                const total = totalXp(sportXp);
                const topSport = Object.entries(sportXp).sort(([, a], [, b]) => b - a)[0];
                const topLevel = topSport ? getLevelFromXp(topSport[1]) : 0;
                const titleDef = u.title ? getTitleByKey(u.title) : undefined;
                const isMe = u.id === currentUser?.id;
                const streak = isMe ? myStreak : 0;
                return (
                  <View key={u.id} style={[styles.leaderRow, i === 0 && styles.leaderFirst]}>
                    <Text style={styles.leaderRank}>{RANK_ICONS[i] ?? `${i + 1}.`}</Text>
                    <View style={[styles.leaderAvatar, { backgroundColor: u.avatarColor + '33', borderColor: u.avatarColor }]}>
                      <Text style={styles.leaderAvatarText}>{u.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.leaderNameRow}>
                        {titleDef && (
                          <View style={[styles.titleBadge, titleDef.key === 'black' && styles.titleBadgeBlack]}>
                            <Text style={[styles.titleBadgeText, titleDef.key === 'black' && styles.titleBadgeTextBlack]}>
                              {titleDef.emoji} {titleDef.label}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.leaderName}>
                        {u.name} {isMe ? '(du)' : ''}
                      </Text>
                      <View style={styles.leaderMeta}>
                        <Text style={styles.leaderXp}>{total} XP</Text>
                        {topSport && topLevel > 0 && (
                          <Text style={styles.leaderTopSport}>
                            · {SPORT_EMOJIS[topSport[0]] ?? '🏅'} Lvl {topLevel} {topSport[0]}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {streak > 0 && <Text style={styles.leaderStreak}>🔥 {streak}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Per-sport rankings */}
          {activeSports.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚔️ Sport-Ränge</Text>
              {activeSports.map(sport => {
                const sorted = [...displayUsers]
                  .map(u => ({ u, xp: getUserSportXp(u)[sport] ?? 0 }))
                  .filter(x => x.xp > 0)
                  .sort((a, b) => b.xp - a.xp);
                if (sorted.length === 0) return null;
                return (
                  <View key={sport} style={styles.sportRankSection}>
                    <Text style={styles.sportRankTitle}>{SPORT_EMOJIS[sport] ?? '🏅'} {sport}</Text>
                    {sorted.map(({ u, xp }, si) => {
                      const isMe = u.id === currentUser?.id;
                      return (
                        <View key={u.id} style={styles.sportRankRow}>
                          <Text style={styles.sportRankNum}>{si + 1}.</Text>
                          <Text style={styles.sportRankAvatar}>{u.avatar}</Text>
                          <Text style={[styles.sportRankName, isMe && { color: COLORS.primaryLight }]}>
                            {displayName(u)}
                          </Text>
                          <XpBar xp={xp} color={u.avatarColor} />
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}

          {/* Nutrition avg */}
          {(myStats.avgCal > 0 || myStats.avgProtein > 0) && (
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
  highlightNum: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  highlightLabel: { fontSize: 9, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },

  // Sport levels card
  sportLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sportEmoji: { fontSize: 22, width: 30 },
  sportName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  nextTitleHint: { fontSize: 10, color: COLORS.textMuted, marginBottom: 4 },
  sportXpTotal: { fontSize: 11, color: COLORS.textMuted, width: 48, textAlign: 'right' },

  // Leaderboard
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: COLORS.cardLight, gap: 10 },
  leaderFirst: { borderWidth: 1, borderColor: COLORS.warning + '88' },
  leaderRank: { fontSize: 22, width: 32 },
  leaderAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  leaderAvatarText: { fontSize: 20 },
  leaderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  titleBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    backgroundColor: COLORS.primary + '33', borderWidth: 1, borderColor: COLORS.primary + '66',
  },
  titleBadgeBlack: { backgroundColor: '#111', borderColor: '#444' },
  titleBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.primaryLight },
  titleBadgeTextBlack: { color: '#ffd700' },
  leaderName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  leaderMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  leaderXp: { fontSize: 12, fontWeight: '700', color: COLORS.primaryLight },
  leaderTopSport: { fontSize: 11, color: COLORS.textMuted, marginLeft: 4 },
  leaderStreak: { fontSize: 12, color: COLORS.textSecondary },

  // Sport rankings
  sportRankSection: { marginBottom: 16 },
  sportRankTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  sportRankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sportRankNum: { fontSize: 12, color: COLORS.textMuted, width: 18 },
  sportRankAvatar: { fontSize: 16, width: 22 },
  sportRankName: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, width: 90 },

  // Nutrition
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  footer: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});
