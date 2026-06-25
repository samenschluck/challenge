import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Workout } from '../types';

const WORKOUT_TYPES = ['Krafttraining', 'Cardio', 'HIIT', 'Laufen', 'Radfahren', 'Schwimmen', 'Kampfsport', 'Vikings Training', 'Sonstiges'];
const INTENSITIES = [
  { key: 'leicht', label: 'Leicht 😌', color: COLORS.success },
  { key: 'mittel', label: 'Mittel 💪', color: COLORS.warning },
  { key: 'intensiv', label: 'Intensiv 🔥', color: COLORS.danger },
] as const;

interface Props {
  editWorkout?: Workout;
  onWorkoutAdded: (workout: Workout) => void;
  onClose: () => void;
}

export default function AddWorkoutModal({ editWorkout, onWorkoutAdded, onClose }: Props) {
  const [type, setType] = useState(editWorkout?.type ?? 'Krafttraining');
  const [duration, setDuration] = useState(editWorkout?.duration ? String(editWorkout.duration) : '');
  const [intensity, setIntensity] = useState<'leicht' | 'mittel' | 'intensiv'>(editWorkout?.intensity ?? 'mittel');
  const [notes, setNotes] = useState(editWorkout?.notes ?? '');

  function save() {
    const workout: Workout = {
      id: editWorkout?.id ?? Date.now().toString(),
      type,
      duration: Number(duration) || 0,
      intensity,
      ...(notes ? { notes } : {}),
    };
    onWorkoutAdded(workout);
    onClose();
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{editWorkout ? 'Training bearbeiten' : 'Training hinzufügen'}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Art des Trainings</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {WORKOUT_TYPES.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.pill, type === t && styles.pillActive]}
                      onPress={() => setType(t)}
                    >
                      <Text style={[styles.pillText, type === t && styles.pillTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>Dauer (Minuten)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
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
                style={[styles.input, { minHeight: 60 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="z.B. neues PR, Muskelkater..."
                placeholderTextColor={COLORS.textMuted}
                multiline
              />

              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveBtnText}>✓ {editWorkout ? 'Speichern' : 'Hinzufügen'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  closeBtn: { fontSize: 20, color: COLORS.textSecondary, padding: 4 },
  fieldLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardLight },
  pillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '33' },
  pillText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  pillTextActive: { color: COLORS.primaryLight },
  input: {
    backgroundColor: COLORS.cardLight, borderRadius: 10, padding: 12,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  intensityRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  intensityBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  intensityText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
