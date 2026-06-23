import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { saveDayEntry } from '../services/firestoreService';
import { firebaseConfigured } from '../config/firebase';
import { getTodayString, formatDate } from '../utils/dateUtils';
import { DayEntry, WorkoutEntry, NutritionEntry, Meal } from '../types';
import BarcodeScanner from '../components/BarcodeScanner';

const WORKOUT_TYPES = ['Krafttraining', 'Cardio', 'HIIT', 'Laufen', 'Radfahren', 'Schwimmen', 'Fußball', 'Basketball', 'Yoga', 'Sonstiges'];
const INTENSITIES = [
  { key: 'leicht', label: 'Leicht 😌', color: COLORS.success },
  { key: 'mittel', label: 'Mittel 💪', color: COLORS.warning },
  { key: 'intensiv', label: 'Intensiv 🔥', color: COLORS.danger },
] as const;
const MOODS = ['😴', '😐', '🙂', '😊', '🔥'];

interface Props {
  onDone: () => void;
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function NumberInput({ label, value, unit, onChange, color }: {
  label: string; value: string; unit: string; onChange: (v: string) => void; color?: string;
}) {
  return (
    <View style={styles.numberRow}>
      <Text style={[styles.numberLabel, color ? { color } : {}]}>{label}</Text>
      <View style={styles.numberInputWrap}>
        <TextInput
          style={styles.numberInput}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={COLORS.textMuted}
        />
        <Text style={styles.numberUnit}>{unit}</Text>
      </View>
    </View>
  );
}

export default function CheckinScreen({ onDone }: Props) {
  const { currentUser, todayMyEntry } = useApp();
  const today = getTodayString();

  // Sport
  const [hasWorkout, setHasWorkout] = useState(!!todayMyEntry?.workout);
  const [workoutType, setWorkoutType] = useState(todayMyEntry?.workout?.type ?? 'Krafttraining');
  const [workoutDuration, setWorkoutDuration] = useState(String(todayMyEntry?.workout?.duration ?? '60'));
  const [intensity, setIntensity] = useState<'leicht' | 'mittel' | 'intensiv'>(todayMyEntry?.workout?.intensity ?? 'mittel');
  const [workoutNotes, setWorkoutNotes] = useState(todayMyEntry?.workout?.notes ?? '');

  // Nutrition totals
  const [calories, setCalories] = useState(String(todayMyEntry?.nutrition?.calories ?? ''));
  const [protein, setProtein] = useState(String(todayMyEntry?.nutrition?.protein ?? ''));
  const [carbs, setCarbs] = useState(String(todayMyEntry?.nutrition?.carbs ?? ''));
  const [fat, setFat] = useState(String(todayMyEntry?.nutrition?.fat ?? ''));
  const [water, setWater] = useState(String(todayMyEntry?.nutrition?.water ?? ''));
  const [meals, setMeals] = useState<Meal[]>(todayMyEntry?.nutrition?.meals ?? []);

  // Manual meal form
  const [mealName, setMealName] = useState('');
  const [mealCal, setMealCal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  // Barcode scanner
  const [showScanner, setShowScanner] = useState(false);

  // Mood & notes
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>((todayMyEntry?.mood as any) ?? 3);
  const [notes, setNotes] = useState(todayMyEntry?.notes ?? '');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'done'>('idle');

  function recalcTotals(list: Meal[]) {
    setCalories(String(list.reduce((s, m) => s + m.calories, 0)));
    setProtein(String(+(list.reduce((s, m) => s + m.protein, 0)).toFixed(1)));
    setCarbs(String(+(list.reduce((s, m) => s + m.carbs, 0)).toFixed(1)));
    setFat(String(+(list.reduce((s, m) => s + m.fat, 0)).toFixed(1)));
  }

  function addManualMeal() {
    if (!mealName.trim()) return;
    const meal: Meal = {
      id: Date.now().toString(),
      name: mealName.trim(),
      calories: Number(mealCal) || 0,
      protein: Number(mealProtein) || 0,
      carbs: Number(mealCarbs) || 0,
      fat: Number(mealFat) || 0,
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [...meals, meal];
    setMeals(updated);
    recalcTotals(updated);
    setMealName(''); setMealCal(''); setMealProtein(''); setMealCarbs(''); setMealFat('');
  }

  function removeMeal(id: string) {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    if (updated.length > 0) recalcTotals(updated);
    else { setCalories(''); setProtein(''); setCarbs(''); setFat(''); }
  }

  function addScannedMeal(meal: Meal) {
    const updated = [...meals, meal];
    setMeals(updated);
    recalcTotals(updated);
    // Do not close here — BarcodeScanner stays open briefly (success stage)
    // to absorb ghost/phantom taps before calling onClose itself
  }

  async function save() {
    setSaveError(null);
    if (!currentUser) {
      setSaveError('Kein User eingeloggt – bitte neu einloggen.');
      return;
    }
    if (!hasWorkout && !calories && !protein && !carbs && !fat && !water && meals.length === 0) {
      setSaveError('Bitte mindestens Sport aktivieren oder Nährwerte eintragen.');
      return;
    }

    // Diagnostic: check which Firestore databases exist
    try {
      const r = await fetch(
        'https://firestore.googleapis.com/v1/projects/challenge-84fde/databases?key=AIzaSyBDPV7ppVjZQ6blpsWZ5EOfROw5U9FFL30'
      );
      const json = await r.json();
      if (!r.ok) {
        setSaveError(`Firebase API Fehler: ${json?.error?.message ?? r.status}`);
        return;
      }
      const dbs = (json.databases ?? []).map((d: any) => d.name).join(', ');
      if (!dbs) {
        setSaveError('Keine Firestore-Datenbank gefunden. Bitte in Firebase Console → Firestore eine Datenbank erstellen.');
        return;
      }
    } catch (e: any) {
      setSaveError(`Netzwerkfehler beim Firebase-Check: ${e?.message}`);
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    try {
      const workout: WorkoutEntry | null = hasWorkout ? {
        type: workoutType,
        duration: Number(workoutDuration) || 0,
        intensity,
        ...(workoutNotes ? { notes: workoutNotes } : {}),
      } : null;

      const hasNutrition = !!(calories || protein || carbs || fat || water || meals.length > 0);
      const nutrition: NutritionEntry | null = hasNutrition ? {
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        water: Number(water) || 0,
        meals,
      } : null;

      const entry: DayEntry = {
        id: `${currentUser.id}_${today}`,
        userId: currentUser.id,
        date: today,
        workout,
        nutrition,
        mood,
        ...(notes ? { notes } : {}),
        completedAt: new Date().toISOString(),
      };

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Verbindungs-Timeout (15s). Prüfe deine Internetverbindung.')), 15000)
      );
      await Promise.race([saveDayEntry(entry), timeout]);
      setSaveStatus('done');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e: any) {
      setSaveError(e?.message ?? 'Unbekannter Fehler');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  }

  return (
    <LinearGradient colors={['#0f0f1a', '#0f0f1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Tages-Check-in</Text>
            <Text style={styles.subtitle}>{formatDate(today)}</Text>

            {/* ── SPORT ── */}
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <SectionHeader icon="💪" title="Sport heute?" />
                <Switch
                  value={hasWorkout}
                  onValueChange={setHasWorkout}
                  trackColor={{ true: COLORS.success, false: COLORS.border }}
                  thumbColor={hasWorkout ? '#fff' : COLORS.textSecondary}
                />
              </View>

              {hasWorkout && (
                <>
                  <Text style={styles.fieldLabel}>Art der Einheit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {WORKOUT_TYPES.map(t => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.pill, workoutType === t && styles.pillActive]}
                          onPress={() => setWorkoutType(t)}
                        >
                          <Text style={[styles.pillText, workoutType === t && styles.pillTextActive]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <Text style={styles.fieldLabel}>Dauer (Minuten)</Text>
                  <TextInput
                    style={styles.singleInput}
                    value={workoutDuration}
                    onChangeText={setWorkoutDuration}
                    keyboardType="numeric"
                    placeholder="60"
                    placeholderTextColor={COLORS.textMuted}
                  />

                  <Text style={styles.fieldLabel}>Intensität</Text>
                  <View style={styles.intensityRow}>
                    {INTENSITIES.map(i => (
                      <TouchableOpacity
                        key={i.key}
                        style={[styles.intensityBtn, intensity === i.key && { backgroundColor: i.color + '33', borderColor: i.color }]}
                        onPress={() => setIntensity(i.key)}
                      >
                        <Text style={[styles.intensityText, intensity === i.key && { color: i.color }]}>{i.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Notizen (optional)</Text>
                  <TextInput
                    style={[styles.singleInput, { minHeight: 60 }]}
                    value={workoutNotes}
                    onChangeText={setWorkoutNotes}
                    placeholder="z.B. neues PR, Muskelkater..."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                  />
                </>
              )}
            </View>

            {/* ── NÄHRWERTE ── */}
            <View style={styles.card}>
              <SectionHeader icon="🥗" title="Mahlzeiten & Nährwerte" />

              {/* Barcode Scanner Button */}
              <TouchableOpacity style={styles.scanBtn} onPress={() => setShowScanner(true)}>
                <Text style={styles.scanBtnText}>📷  Barcode scannen</Text>
              </TouchableOpacity>

              {/* Meals list */}
              {meals.length > 0 && (
                <View style={styles.mealsList}>
                  <Text style={styles.fieldLabel}>Heutige Mahlzeiten ({meals.length})</Text>
                  {meals.map((m, i) => (
                    <View key={m.id} style={styles.mealChip}>
                      <View style={styles.mealChipNum}>
                        <Text style={styles.mealChipNumText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mealChipName}>{m.name} <Text style={styles.mealChipTime}>{m.time}</Text></Text>
                        <Text style={styles.mealChipMacros}>{m.calories} kcal · P:{m.protein}g · K:{m.carbs}g · F:{m.fat}g</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeMeal(m.id)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <Text style={styles.mealRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Manual meal form */}
              <View style={styles.divider} />
              <Text style={styles.fieldLabel}>Manuell hinzufügen</Text>
              <TextInput
                style={[styles.singleInput, { marginBottom: 8 }]}
                value={mealName}
                onChangeText={setMealName}
                placeholder="Name (z.B. Frühstück, Hähnchen…)"
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.mealMacroRow}>
                <TextInput style={styles.mealInput} value={mealCal} onChangeText={setMealCal} placeholder="kcal" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />
                <TextInput style={styles.mealInput} value={mealProtein} onChangeText={setMealProtein} placeholder="P(g)" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />
                <TextInput style={styles.mealInput} value={mealCarbs} onChangeText={setMealCarbs} placeholder="K(g)" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />
                <TextInput style={styles.mealInput} value={mealFat} onChangeText={setMealFat} placeholder="F(g)" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" />
                <TouchableOpacity style={styles.addMealBtn} onPress={addManualMeal}>
                  <Text style={styles.addMealText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Daily totals (auto-summed or manual) */}
              <View style={styles.divider} />
              <Text style={styles.fieldLabel}>Tages-Summe</Text>
              <NumberInput label="Kalorien" value={calories} unit="kcal" onChange={setCalories} color={COLORS.calories} />
              <NumberInput label="Protein" value={protein} unit="g" onChange={setProtein} color={COLORS.protein} />
              <NumberInput label="Kohlenhydrate" value={carbs} unit="g" onChange={setCarbs} color={COLORS.carbs} />
              <NumberInput label="Fett" value={fat} unit="g" onChange={setFat} color={COLORS.fat} />
              <NumberInput label="Wasser" value={water} unit="ml" onChange={setWater} />
            </View>

            {/* ── STIMMUNG ── */}
            <View style={styles.card}>
              <SectionHeader icon="🧠" title="Wie war dein Tag?" />
              <View style={styles.moodRow}>
                {MOODS.map((m, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.moodBtn, mood === i + 1 && styles.moodBtnActive]}
                    onPress={() => setMood((i + 1) as any)}
                  >
                    <Text style={styles.moodEmoji}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Notizen (optional)</Text>
              <TextInput
                style={[styles.singleInput, { minHeight: 60 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Wie lief der Tag?"
                placeholderTextColor={COLORS.textMuted}
                multiline
              />
            </View>

            {/* Success Box */}
            {saveStatus === 'done' && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>✅ Eintrag gespeichert! Du kannst weitere Mahlzeiten hinzufügen.</Text>
              </View>
            )}

            {/* Error Box */}
            {saveError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {saveError}</Text>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={save}
              disabled={saving}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={saveStatus === 'done' ? ['#22c55e', '#16a34a'] : [COLORS.primary, COLORS.primaryLight]}
                style={styles.saveBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveBtnText}>
                  {saveStatus === 'done' ? '✅ Gespeichert!' : saving ? '⏳ Speichern...' : '✓ Eintragen & Speichern'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.debugInfo}>
              User: {currentUser ? currentUser.name : '❌ KEIN USER'} | Mahlzeiten: {meals.length} | Kcal: {calories || '0'}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Barcode Scanner Overlay */}
        {showScanner && (
          <BarcodeScanner
            onMealAdded={addScannedMeal}
            onClose={() => setShowScanner(false)}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionIcon: { fontSize: 22, marginRight: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  fieldLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardLight },
  pillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '33' },
  pillText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  pillTextActive: { color: COLORS.primaryLight },
  singleInput: {
    backgroundColor: COLORS.cardLight, borderRadius: 10, padding: 12,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  intensityRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  intensityBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  intensityText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },

  // Barcode
  scanBtn: {
    backgroundColor: COLORS.primary + '22',
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary + '88', marginBottom: 14,
  },
  scanBtnText: { color: COLORS.primaryLight, fontWeight: '700', fontSize: 15 },

  // Meals
  mealsList: { marginBottom: 4 },
  mealChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 10,
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  mealChipNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primary + '33', alignItems: 'center', justifyContent: 'center',
  },
  mealChipNumText: { fontSize: 11, fontWeight: '800', color: COLORS.primaryLight },
  mealChipName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  mealChipTime: { fontSize: 11, color: COLORS.textMuted, fontWeight: '400' },
  mealChipMacros: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  mealRemove: { color: COLORS.danger, fontSize: 16, padding: 4 },
  mealMacroRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  mealInput: {
    flex: 1, backgroundColor: COLORS.cardLight, borderRadius: 8, padding: 9,
    color: COLORS.text, fontSize: 13, borderWidth: 1, borderColor: COLORS.border, textAlign: 'center' as any,
  },
  addMealBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  addMealText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },

  // Totals
  numberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  numberLabel: { width: 110, fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  numberInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardLight, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8,
  },
  numberInput: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: '700' },
  numberUnit: { color: COLORS.textSecondary, fontSize: 13 },

  // Mood
  moodRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  moodBtn: { padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  moodBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  moodEmoji: { fontSize: 32 },

  // Save
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  saveBtnGrad: { padding: 18, alignItems: 'center' },
  saveBtnText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  successBox: {
    backgroundColor: COLORS.success + '22', borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.success + '88',
  },
  successText: { color: COLORS.success, fontSize: 13, lineHeight: 20 },
  errorBox: {
    backgroundColor: '#ff000033', borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#ff4444',
  },
  errorText: { color: '#ff6666', fontSize: 13, lineHeight: 20 },
  debugInfo: { color: '#555', fontSize: 10, textAlign: 'center', marginTop: 8 },
});
