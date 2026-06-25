import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { saveDayEntry } from '../services/firestoreService';
import { getTodayString, formatDate } from '../utils/dateUtils';
import { DayEntry, Workout, WorkoutEntry, NutritionEntry, Meal } from '../types';
import AddMealModal from '../components/AddMealModal';
import AddWorkoutModal from '../components/AddWorkoutModal';

const MOODS = ['😴', '😐', '🙂', '😊', '🔥'];

interface Props {
  onDone: () => void;
  date?: string;
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function CheckinScreen({ onDone, date }: Props) {
  const { currentUser, todayMyEntry, myEntries } = useApp();
  const today = getTodayString();
  const targetDate = date ?? today;
  const isEditingPast = targetDate !== today;
  const targetEntry = isEditingPast
    ? (myEntries.find(e => e.date === targetDate) ?? null)
    : todayMyEntry;

  // Workouts
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    const w = targetEntry?.workout;
    if (!w) return [];
    if (w.workouts?.length) return w.workouts;
    // Migrate legacy single-workout format
    if (w.type) return [{ id: 'legacy', type: w.type, duration: w.duration ?? 0, intensity: w.intensity ?? 'mittel', notes: w.notes }];
    return [];
  });
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Meals & water
  const [meals, setMeals] = useState<Meal[]>(targetEntry?.nutrition?.meals ?? []);
  const [water, setWater] = useState(targetEntry?.nutrition?.water ? String(targetEntry.nutrition.water) : '');

  // Weight
  const [weight, setWeight] = useState(targetEntry?.weight ? String(targetEntry.weight) : '');

  // Workout handlers
  function handleWorkoutAdded(workout: Workout) {
    if (editingWorkout) {
      setWorkouts(prev => prev.map(w => w.id === editingWorkout.id ? workout : w));
    } else {
      setWorkouts(prev => [...prev, workout]);
    }
    setEditingWorkout(null);
  }
  function removeWorkout(id: string) { setWorkouts(prev => prev.filter(w => w.id !== id)); }
  function openEditWorkout(w: Workout) { setEditingWorkout(w); setShowAddWorkout(true); }
  function openAddWorkout() { setEditingWorkout(null); setShowAddWorkout(true); }

  // Meal modal state
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  // Mood & notes
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>((targetEntry?.mood as any) ?? 3);
  const [notes, setNotes] = useState(targetEntry?.notes ?? '');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'done'>('idle');

  // Inline totals
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = +meals.reduce((s, m) => s + m.protein, 0).toFixed(1);
  const totalCarbs = +meals.reduce((s, m) => s + m.carbs, 0).toFixed(1);
  const totalFat = +meals.reduce((s, m) => s + m.fat, 0).toFixed(1);

  function handleMealAdded(meal: Meal) {
    if (editingMeal) {
      setMeals(prev => prev.map(m => m.id === editingMeal.id ? meal : m));
    } else {
      setMeals(prev => [...prev, meal]);
    }
    setEditingMeal(null);
  }

  function removeMeal(id: string) {
    setMeals(prev => prev.filter(m => m.id !== id));
  }

  function openEdit(meal: Meal) {
    setEditingMeal(meal);
    setShowAddMeal(true);
  }

  function openAdd() {
    setEditingMeal(null);
    setShowAddMeal(true);
  }

  async function save() {
    setSaveError(null);
    if (!currentUser) {
      setSaveError('Kein User eingeloggt – bitte neu einloggen.');
      return;
    }
    if (workouts.length === 0 && meals.length === 0 && !water && !weight) {
      setSaveError('Bitte mindestens ein Training hinzufügen, eine Mahlzeit eintragen oder Gewicht eintragen.');
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    try {
      const workout: WorkoutEntry | null = workouts.length > 0 ? { workouts } : null;

      const hasNutrition = meals.length > 0 || !!water;
      const nutrition: NutritionEntry | null = hasNutrition ? {
        calories: totalCal,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        water: Number(water) || 0,
        meals,
      } : null;

      const entry: DayEntry = {
        id: `${currentUser.id}_${targetDate}`,
        userId: currentUser.id,
        date: targetDate,
        workout,
        nutrition,
        mood,
        weight: weight ? Number(weight) : undefined,
        ...(notes ? { notes } : {}),
        completedAt: new Date().toISOString(),
      };

      await saveDayEntry(entry);
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
            <Text style={styles.title}>{isEditingPast ? '✏️ Eintrag bearbeiten' : 'Tages-Check-in'}</Text>
            <Text style={styles.subtitle}>{formatDate(targetDate)}</Text>

            {/* ── GEWICHT ── */}
            <View style={styles.card}>
              <SectionHeader icon="⚖️" title="Heutiges Gewicht" />
              <View style={styles.weightRow}>
                <TextInput
                  style={styles.weightInput}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="80.5"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.weightUnit}>kg</Text>
              </View>
            </View>

            {/* ── SPORT ── */}
            <View style={styles.card}>
              <SectionHeader icon="💪" title="Training" />

              {workouts.length > 0 && (
                <View style={styles.mealsList}>
                  {workouts.map((w, i) => (
                    <TouchableOpacity key={w.id} style={styles.mealChip} onPress={() => openEditWorkout(w)} activeOpacity={0.7}>
                      <View style={styles.mealChipNum}>
                        <Text style={styles.mealChipNumText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mealChipName}>{w.type}</Text>
                        <Text style={styles.mealChipMacros}>{w.duration} Min · {w.intensity}{w.notes ? ` · ${w.notes}` : ''}</Text>
                      </View>
                      <View style={styles.mealEditHint}>
                        <Text style={styles.mealEditIcon}>✏️</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeWorkout(w.id)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <Text style={styles.mealRemove}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.addMealBtn} onPress={openAddWorkout}>
                <Text style={styles.addMealBtnText}>+ Training hinzufügen</Text>
              </TouchableOpacity>
            </View>

            {/* ── MAHLZEITEN ── */}
            <View style={styles.card}>
              <SectionHeader icon="🥗" title="Mahlzeiten" />

              {/* Meals list */}
              {meals.length > 0 && (
                <View style={styles.mealsList}>
                  {meals.map((m, i) => (
                    <TouchableOpacity key={m.id} style={styles.mealChip} onPress={() => openEdit(m)} activeOpacity={0.7}>
                      <View style={styles.mealChipNum}>
                        <Text style={styles.mealChipNumText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mealChipName}>
                          {m.name} <Text style={styles.mealChipTime}>{m.time}</Text>
                        </Text>
                        <Text style={styles.mealChipMacros}>
                          {m.calories} kcal · P:{m.protein}g · K:{m.carbs}g · F:{m.fat}g
                        </Text>
                      </View>
                      <View style={styles.mealEditHint}>
                        <Text style={styles.mealEditIcon}>✏️</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeMeal(m.id)}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      >
                        <Text style={styles.mealRemove}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}

                  {/* Totals row */}
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Gesamt</Text>
                    <Text style={styles.totalsKcal}>{totalCal} kcal</Text>
                    <Text style={styles.totalsMacros}>
                      P:{totalProtein}g · K:{totalCarbs}g · F:{totalFat}g
                    </Text>
                  </View>
                </View>
              )}

              {/* Add meal button */}
              <TouchableOpacity style={styles.addMealBtn} onPress={openAdd}>
                <Text style={styles.addMealBtnText}>+ Mahlzeit hinzufügen</Text>
              </TouchableOpacity>

              {/* Water */}
              <View style={styles.divider} />
              <Text style={styles.fieldLabel}>Wasser</Text>
              <View style={styles.waterRow}>
                <TextInput
                  style={styles.waterInput}
                  value={water}
                  onChangeText={setWater}
                  keyboardType="numeric"
                  placeholder="2000"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.waterUnit}>ml</Text>
              </View>
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
          </ScrollView>
        </KeyboardAvoidingView>

        {showAddWorkout && (
          <AddWorkoutModal
            editWorkout={editingWorkout ?? undefined}
            onWorkoutAdded={handleWorkoutAdded}
            onClose={() => { setShowAddWorkout(false); setEditingWorkout(null); }}
          />
        )}
        {showAddMeal && (
          <AddMealModal
            editMeal={editingMeal ?? undefined}
            onMealAdded={handleMealAdded}
            onClose={() => { setShowAddMeal(false); setEditingMeal(null); }}
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionIcon: { fontSize: 22, marginRight: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  fieldLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  singleInput: {
    backgroundColor: COLORS.cardLight, borderRadius: 10, padding: 12,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },

  // Weight
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  weightInput: { flex: 1, color: COLORS.text, fontSize: 26, fontWeight: '800' },
  weightUnit: { color: COLORS.textSecondary, fontSize: 16 },

  // Meals
  mealsList: { marginBottom: 10 },
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
  mealEditHint: { paddingHorizontal: 4 },
  mealEditIcon: { fontSize: 14 },
  mealRemove: { color: COLORS.danger, fontSize: 16, padding: 4 },
  totalsRow: {
    backgroundColor: COLORS.primary + '18',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  totalsLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 4 },
  totalsKcal: { fontSize: 20, fontWeight: '800', color: COLORS.primaryLight, marginBottom: 2 },
  totalsMacros: { fontSize: 12, color: COLORS.textSecondary },
  addMealBtn: {
    backgroundColor: COLORS.primary + '22',
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary + '88',
  },
  addMealBtnText: { color: COLORS.primaryLight, fontWeight: '700', fontSize: 15 },

  // Water
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  waterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  waterInput: { flex: 1, color: COLORS.text, fontSize: 18, fontWeight: '700' },
  waterUnit: { color: COLORS.textSecondary, fontSize: 14 },

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
});
