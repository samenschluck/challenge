import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Modal,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { User } from '../types';

interface Props {
  user: User;
  onSave: (updates: { height?: number; gender?: 'male' | 'female'; age?: number }) => void;
  onClose: () => void;
}

export default function SettingsModal({ user, onSave, onClose }: Props) {
  const [gender, setGender] = useState<'male' | 'female' | undefined>(user.gender);
  const [height, setHeight] = useState(user.height ? String(user.height) : '');
  const [age, setAge] = useState(user.age ? String(user.age) : '');

  function handleSave() {
    onSave({
      gender,
      height: height ? Number(height) : undefined,
      age: age ? Number(age) : undefined,
    });
    onClose();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>⚙️ Einstellungen</Text>
              <Text style={styles.subtitle}>{user.avatar} {user.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Geschlecht</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
              onPress={() => setGender('male')}
            >
              <Text style={[styles.genderBtnText, gender === 'male' && styles.genderBtnTextActive]}>
                ♂ Männlich
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
              onPress={() => setGender('female')}
            >
              <Text style={[styles.genderBtnText, gender === 'female' && styles.genderBtnTextActive]}>
                ♀ Weiblich
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Körpergröße</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="175"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.unit}>cm</Text>
          </View>

          <Text style={styles.label}>Alter</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="25"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.unit}>Jahre</Text>
          </View>

          <Text style={styles.hint}>
            Größe, Alter und Gewicht (täglich beim Check-in) werden genutzt, um deinen
            Kalorienbedarf (Mifflin-St. Jeor) zu berechnen.
          </Text>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>✓ Speichern</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  closeBtn: { fontSize: 22, color: COLORS.textSecondary, fontWeight: '700' },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  genderBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
  },
  genderBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '28' },
  genderBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  genderBtnTextActive: { color: COLORS.primaryLight },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  input: { flex: 1, color: COLORS.text, fontSize: 20, fontWeight: '700' },
  unit: { color: COLORS.textSecondary, fontSize: 14 },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 20,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
