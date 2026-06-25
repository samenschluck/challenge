import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, CHALLENGE_START, CHALLENGE_END } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { subscribeUserEntries } from '../services/firestoreService';
import { DayEntry, User, Workout, WorkoutEntry } from '../types';
import { getDayNumber, formatDate, getTodayString } from '../utils/dateUtils';
import { displayName } from '../utils/displayName';

function getWorkouts(w: WorkoutEntry): Workout[] {
  if (w.workouts?.length) return w.workouts;
  if (w.type) return [{ id: 'legacy', type: w.type, duration: w.duration ?? 0, intensity: w.intensity ?? 'mittel', notes: w.notes }];
  return [];
}

function getDayStatus(entries: DayEntry[], userId: string, date: string): 'full' | 'none' | 'future' {
  const today = getTodayString();
  if (date > today) return 'future';
  if (date < CHALLENGE_START || date > CHALLENGE_END) return 'future';
  const entry = entries.find(e => e.userId === userId && e.date === date);
  if (entry?.workout) return 'full';
  return 'none';
}

function generateCalendarDays(): string[] {
  const days: string[] = [];
  const start = new Date(CHALLENGE_START);
  const end = new Date(CHALLENGE_END);
  const cur = new Date(start);
  while (cur <= end) {
    days.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function groupByWeek(days: string[]): string[][] {
  const weeks: string[][] = [];
  let week: string[] = [];
  const firstDay = new Date(days[0]);
  const dayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  for (let i = 0; i < dayOfWeek; i++) week.push('');
  for (const d of days) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(''); weeks.push(week); }
  return weeks;
}

// Use local date to match how users think about "today" and "yesterday"
function getLocalDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

const STATUS_COLORS = {
  full: COLORS.success,
  none: COLORS.danger,
  future: COLORS.cardLight,
};

interface Props {
  onEditDay?: (date: string) => void;
}

export default function CalendarScreen({ onEditDay }: Props) {
  const { currentUser, myEntries, allUsers } = useApp();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [otherUserEntries, setOtherUserEntries] = useState<DayEntry[]>([]);

  const allDays = useMemo(() => generateCalendarDays(), []);
  const weeks = useMemo(() => groupByWeek(allDays), [allDays]);

  const viewUser = selectedUser ?? currentUser;
  const today = getTodayString();

  // Subscribe to the viewed user's full entry history when it's not the current user
  useEffect(() => {
    if (!viewUser || viewUser.id === currentUser?.id) {
      setOtherUserEntries([]);
      return;
    }
    const unsub = subscribeUserEntries(viewUser.id, setOtherUserEntries);
    return unsub;
  }, [viewUser?.id, currentUser?.id]);

  const relevantEntries = viewUser?.id === currentUser?.id ? myEntries : otherUserEntries;

  function getEntry(date: string) {
    return relevantEntries.find(e => e.userId === viewUser?.id && e.date === date) ?? null;
  }

  const totalDays = allDays.filter(d => d <= today && d >= CHALLENGE_START).length;
  const fullDays = allDays.filter(d =>
    getDayStatus(relevantEntries, viewUser?.id ?? '', d) === 'full'
  ).length;

  const streak = useMemo(() => {
    let s = 0;
    const cur = new Date(today);
    while (true) {
      const d = cur.toISOString().split('T')[0];
      if (d < CHALLENGE_START) break;
      if (getDayStatus(relevantEntries, viewUser?.id ?? '', d) === 'full') {
        s++;
        cur.setDate(cur.getDate() - 1);
      } else break;
    }
    return s;
  }, [relevantEntries, viewUser]);

  const dayEntry = selectedDay ? getEntry(selectedDay) : null;
  const canEditSelected = !!selectedDay && selectedDay <= today && selectedDay >= CHALLENGE_START && viewUser?.id === currentUser?.id && !!onEditDay;

  return (
    <LinearGradient colors={['#0f0f1a', '#0f0f1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Kalender</Text>

          {/* User switcher */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[...(currentUser ? [currentUser] : []), ...allUsers.filter(u => u.id !== currentUser?.id)].map(u => (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.userPill, viewUser?.id === u.id && styles.userPillActive]}
                  onPress={() => { setSelectedUser(u.id === currentUser?.id ? null : u); setSelectedDay(null); }}
                >
                  <Text style={styles.userPillAvatar}>{u.avatar}</Text>
                  <Text style={[styles.userPillName, viewUser?.id === u.id && styles.userPillNameActive]}>{displayName(u)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{streak}</Text>
              <Text style={styles.statLabel}>🔥 Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{fullDays}</Text>
              <Text style={styles.statLabel}>✅ Trainiert</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{totalDays - fullDays}</Text>
              <Text style={styles.statLabel}>❌ Verpasst</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{totalDays > 0 ? Math.round((fullDays / totalDays) * 100) : 0}%</Text>
              <Text style={styles.statLabel}>📊 Quote</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {[
              { color: STATUS_COLORS.full, label: 'Trainiert' },
              { color: STATUS_COLORS.none, label: 'Verpasst' },
              { color: STATUS_COLORS.future, label: 'Ausstehend' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>

          {/* Weekday header */}
          <View style={styles.weekHeader}>
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
              <Text key={d} style={styles.weekDay}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((date, di) => {
                if (!date) return <View key={di} style={styles.dayEmpty} />;
                const status = getDayStatus(relevantEntries, viewUser?.id ?? '', date);
                const dayNum = getDayNumber(date);
                const isToday = date === today;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dayCell,
                      { backgroundColor: STATUS_COLORS[status] + '33', borderColor: STATUS_COLORS[status] },
                      isToday && styles.dayCellToday,
                      selectedDay === date && styles.dayCellSelected,
                    ]}
                    onPress={() => setSelectedDay(selectedDay === date ? null : date)}
                  >
                    <Text style={[styles.dayNum, status === 'future' && styles.dayNumFuture]}>{dayNum}</Text>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Day detail */}
          {selectedDay && (
            <View style={styles.dayDetail}>
              <View style={styles.dayDetailHeader}>
                <Text style={styles.dayDetailTitle}>{formatDate(selectedDay)}</Text>
                {canEditSelected && (
                  <TouchableOpacity style={styles.editBtn} onPress={() => onEditDay!(selectedDay)}>
                    <Text style={styles.editBtnText}>✏️ Bearbeiten</Text>
                  </TouchableOpacity>
                )}
              </View>

              {dayEntry ? (
                <>
                  {dayEntry.workout && getWorkouts(dayEntry.workout).map((w, i) => (
                    <View key={i} style={styles.detailRow}>
                      <Text style={styles.detailIcon}>💪</Text>
                      <Text style={styles.detailText}>{w.type} · {w.duration} Min · {w.intensity}{w.notes ? ` · ${w.notes}` : ''}</Text>
                    </View>
                  ))}
                  {dayEntry.nutrition && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>🥗</Text>
                      <Text style={styles.detailText}>
                        {dayEntry.nutrition.calories} kcal · P:{dayEntry.nutrition.protein}g · K:{dayEntry.nutrition.carbs}g · F:{dayEntry.nutrition.fat}g
                      </Text>
                    </View>
                  )}
                  {dayEntry.weight && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>⚖️</Text>
                      <Text style={styles.detailText}>{dayEntry.weight} kg</Text>
                    </View>
                  )}
                  {dayEntry.mood && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>{'😴😐🙂😊🔥'[dayEntry.mood - 1]}</Text>
                      <Text style={styles.detailText}>Stimmung: {['Müde', 'OK', 'Gut', 'Super', 'Feuer'][dayEntry.mood - 1]}</Text>
                    </View>
                  )}
                  {dayEntry.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📝</Text>
                      <Text style={styles.detailText}>{dayEntry.notes}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.noEntryText}>
                  {selectedDay > today ? 'Noch in der Zukunft' : 'Kein Eintrag für diesen Tag'}
                </Text>
              )}

              {canEditSelected && !dayEntry && (
                <TouchableOpacity style={[styles.editBtn, { marginTop: 10, alignSelf: 'center' }]} onPress={() => onEditDay!(selectedDay)}>
                  <Text style={styles.editBtnText}>✏️ Eintrag nachtragen</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  userPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  userPillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  userPillAvatar: { fontSize: 18 },
  userPillName: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  userPillNameActive: { color: COLORS.primaryLight },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statNum: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
  weekHeader: { flexDirection: 'row', marginBottom: 4 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, color: COLORS.textSecondary, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 3 },
  dayEmpty: { flex: 1, height: 44 },
  dayCell: { flex: 1, height: 44, margin: 1.5, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayCellToday: { borderWidth: 2, borderColor: COLORS.primaryLight },
  dayCellSelected: { borderWidth: 2 },
  dayNum: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  dayNumFuture: { color: COLORS.textMuted },
  statusDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  dayDetail: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
  dayDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayDetailTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, flex: 1 },
  editBtn: { backgroundColor: COLORS.primary + '22', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.primary + '66' },
  editBtnText: { color: COLORS.primaryLight, fontSize: 13, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  detailIcon: { fontSize: 18 },
  detailText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  noEntryText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', padding: 12 },
});
