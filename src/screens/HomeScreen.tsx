import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import UserDayCard from '../components/UserDayCard';
import SettingsModal from '../components/SettingsModal';
import { formatDate, getTodayString, getTodayDayNumber, getDaysRemaining, getProgressPercent } from '../utils/dateUtils';
import { User } from '../types';
import { displayName } from '../utils/displayName';
import { VERSION } from '../constants/version';

interface Props {
  onGoCheckin: () => void;
}

function calcTargets(user: User, weightKg: number) {
  if (!user.height || !user.gender || !user.age || !weightKg) return null;
  // Mifflin-St Jeor
  const bmr = user.gender === 'male'
    ? 10 * weightKg + 6.25 * user.height - 5 * user.age + 5
    : 10 * weightKg + 6.25 * user.height - 5 * user.age - 161;
  return {
    kcalMin: Math.round(bmr),
    kcalMax: Math.round(bmr * 1.55),
    proteinMin: Math.round(weightKg * 1.6),
    proteinMax: Math.round(weightKg * 2.2),
  };
}

function MacroChip({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={macroChipStyles.wrap}>
      <Text style={[macroChipStyles.value, { color }]}>{value}</Text>
      <Text style={macroChipStyles.unit}>{unit}</Text>
      <Text style={macroChipStyles.label}>{label}</Text>
    </View>
  );
}

const macroChipStyles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  value: { fontSize: 20, fontWeight: '800' },
  unit: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  label: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});

export default function HomeScreen({ onGoCheckin }: Props) {
  const { currentUser, allUsers, todayEntries, updateUserSettings, logout } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const today = getTodayString();
  const dayNum = getTodayDayNumber();
  const remaining = getDaysRemaining();
  const progress = getProgressPercent();

  function getUserEntry(userId: string) {
    return todayEntries.find(e => e.userId === userId) ?? null;
  }

  const myEntry = currentUser ? getUserEntry(currentUser.id) : null;
  const myDone = !!myEntry?.workout && !!myEntry?.nutrition;
  const myNutrition = myEntry?.nutrition;
  const myWeight = myEntry?.weight ?? 0;
  const targets = currentUser ? calcTargets(currentUser, myWeight) : null;

  const settingsComplete = !!(currentUser?.height && currentUser?.gender && currentUser?.age);

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
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Hey {displayName(currentUser)} {currentUser?.avatar}</Text>
              <Text style={styles.dateText}>{formatDate(today)}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.iconBtn}>
              <Text style={styles.logoutText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Settings nudge if incomplete */}
          {!settingsComplete && (
            <TouchableOpacity style={styles.settingsNudge} onPress={() => setShowSettings(true)}>
              <Text style={styles.settingsNudgeText}>
                ⚙️ Einstellungen vervollständigen für personalisierte Kalorienziele →
              </Text>
            </TouchableOpacity>
          )}

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

          {/* My nutrition summary */}
          <View style={styles.nutritionCard}>
            <View style={styles.nutritionCardHeader}>
              <Text style={styles.nutritionCardTitle}>🥗 Meine Nährwerte heute</Text>
              {myEntry?.weight ? (
                <Text style={styles.weightBadge}>⚖️ {myEntry.weight} kg</Text>
              ) : null}
            </View>

            {myNutrition ? (
              <>
                <Text style={styles.kcalBig}>{myNutrition.calories} <Text style={styles.kcalUnit}>kcal</Text></Text>
                <View style={styles.macroChipsRow}>
                  <MacroChip label="Protein" value={myNutrition.protein} unit="g" color={COLORS.protein} />
                  <MacroChip label="Kohlenhydr." value={myNutrition.carbs} unit="g" color={COLORS.carbs} />
                  <MacroChip label="Fett" value={myNutrition.fat} unit="g" color={COLORS.fat} />
                  {myNutrition.water > 0 && (
                    <MacroChip label="Wasser" value={myNutrition.water} unit="ml" color={COLORS.protein} />
                  )}
                </View>
              </>
            ) : (
              <Text style={styles.noNutritionHint}>
                Noch keine Mahlzeiten heute →{' '}
                <Text style={{ color: COLORS.primaryLight }} onPress={onGoCheckin}>Eintragen</Text>
              </Text>
            )}

            {/* Target range */}
            {targets && (
              <View style={styles.targetsBox}>
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>Kalorien-Zielbereich</Text>
                  <Text style={styles.targetValue}>{targets.kcalMin} – {targets.kcalMax} kcal</Text>
                </View>
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>Protein-Zielbereich</Text>
                  <Text style={styles.targetValue}>{targets.proteinMin} – {targets.proteinMax} g</Text>
                </View>
                {myNutrition && (
                  <View style={styles.targetProgressRow}>
                    <View style={styles.targetProgressBg}>
                      <View style={[
                        styles.targetProgressFill,
                        {
                          width: `${Math.min(100, (myNutrition.calories / targets.kcalMax) * 100)}%` as any,
                          backgroundColor: myNutrition.calories < targets.kcalMin ? COLORS.warning
                            : myNutrition.calories <= targets.kcalMax ? COLORS.success
                            : COLORS.danger,
                        },
                      ]} />
                    </View>
                    <Text style={styles.targetProgressLabel}>
                      {myNutrition.calories < targets.kcalMin ? '↑ Mehr essen' :
                       myNutrition.calories <= targets.kcalMax ? '✓ Im Bereich' :
                       '↓ Über Ziel'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!targets && settingsComplete && !myWeight && (
              <Text style={styles.noWeightHint}>⚖️ Gewicht heute eintragen für Kalorienziel</Text>
            )}
          </View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>Alle heute</Text>

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

          <Text style={styles.versionText}>v{VERSION}</Text>
        </ScrollView>
      </SafeAreaView>

      {showSettings && currentUser && (
        <SettingsModal
          user={currentUser}
          onSave={updateUserSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 8 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  dateText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  iconBtn: { padding: 8 },
  iconBtnText: { fontSize: 20 },
  logoutText: { color: COLORS.textSecondary, fontSize: 18 },

  settingsNudge: {
    backgroundColor: COLORS.primary + '18',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  settingsNudgeText: { color: COLORS.primaryLight, fontSize: 13, fontWeight: '600' },

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

  doneBanner: {
    backgroundColor: COLORS.success + '22', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.success + '44', alignItems: 'center',
  },
  doneText: { color: COLORS.successLight, fontWeight: '700', fontSize: 15 },

  // Nutrition card
  nutritionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nutritionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  nutritionCardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  weightBadge: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  kcalBig: { fontSize: 36, fontWeight: '800', color: COLORS.calories, marginBottom: 12 },
  kcalUnit: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary },
  macroChipsRow: { flexDirection: 'row', marginBottom: 14 },
  noNutritionHint: { color: COLORS.textMuted, fontSize: 14, marginBottom: 8 },
  noWeightHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 8, fontStyle: 'italic' },

  // Targets box
  targetsBox: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  targetLabel: { fontSize: 12, color: COLORS.textSecondary },
  targetValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  targetProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  targetProgressBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  targetProgressFill: { height: 6, borderRadius: 3 },
  targetProgressLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, width: 80 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  emptyHint: { color: COLORS.textMuted, textAlign: 'center', fontSize: 14, marginTop: 20 },
  versionText: { textAlign: 'center', fontSize: 11, color: COLORS.textMuted, marginTop: 16, opacity: 0.5 },
});
