import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import UserDayCard from '../components/UserDayCard';
import { formatDate, getTodayString, getTodayDayNumber, getDaysRemaining, getProgressPercent } from '../utils/dateUtils';

interface Props {
  onGoCheckin: () => void;
}

export default function HomeScreen({ onGoCheckin }: Props) {
  const { currentUser, allUsers, todayEntries, logout } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);
  const today = getTodayString();
  const dayNum = getTodayDayNumber();
  const remaining = getDaysRemaining();
  const progress = getProgressPercent();

  function getUserEntry(userId: string) {
    return todayEntries.find(e => e.userId === userId) ?? null;
  }

  const myEntry = currentUser ? getUserEntry(currentUser.id) : null;
  const myDone = !!myEntry?.workout && !!myEntry?.nutrition;

  return (
    <LinearGradient colors={['#0f0f1a', '#0f0f1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={COLORS.primary} />}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Hey {currentUser?.name} {currentUser?.avatar}</Text>
              <Text style={styles.dateText}>{formatDate(today)}</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.dayLabel}>Tag {dayNum} / 100</Text>
              <Text style={styles.remainLabel}>{remaining} Tage übrig</Text>
            </View>
            <View style={styles.progressBg}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` as any }]}
              />
            </View>
            <Text style={styles.progressPct}>{Math.round(progress)}% geschafft</Text>
          </View>

          {/* My Check-in CTA */}
          {!myDone && (
            <TouchableOpacity style={styles.checkinCta} onPress={onGoCheckin}>
              <LinearGradient colors={[COLORS.primary, '#9C27B0']} style={styles.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.ctaIcon}>⚡</Text>
                <View>
                  <Text style={styles.ctaTitle}>Heute eintragen</Text>
                  <Text style={styles.ctaSubtitle}>
                    {!myEntry ? 'Sport & Nährwerte noch offen' :
                     !myEntry.workout ? 'Sport noch offen' : 'Nährwerte noch offen'}
                  </Text>
                </View>
                <Text style={styles.ctaArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {myDone && (
            <View style={styles.doneBanner}>
              <Text style={styles.doneText}>✅ Heute komplett – weiter so!</Text>
            </View>
          )}

          {/* Section Title */}
          <Text style={styles.sectionTitle}>Alle heute</Text>

          {/* Users */}
          {allUsers.length === 0 && (
            <Text style={styles.emptyHint}>Noch keine Mitglieder – warte bis alle einloggen.</Text>
          )}

          {allUsers.map(user => (
            <UserDayCard
              key={user.id}
              user={user}
              entry={getUserEntry(user.id)}
              isMe={user.id === currentUser?.id}
            />
          ))}

          {currentUser && !allUsers.find(u => u.id === currentUser.id) && (
            <UserDayCard user={currentUser} entry={myEntry} isMe />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  dateText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { color: COLORS.textSecondary, fontSize: 18 },
  progressCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dayLabel: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  remainLabel: { fontSize: 13, color: COLORS.textSecondary },
  progressBg: { height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 10, borderRadius: 5 },
  progressPct: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'right' },
  checkinCta: { borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  ctaIcon: { fontSize: 28 },
  ctaTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  ctaSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  ctaArrow: { marginLeft: 'auto', fontSize: 22, color: '#fff' },
  doneBanner: { backgroundColor: COLORS.success + '22', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.success + '44', alignItems: 'center' },
  doneText: { color: COLORS.successLight, fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  emptyHint: { color: COLORS.textMuted, textAlign: 'center', fontSize: 14, marginTop: 20 },
});
