import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { User } from '../types';
import { useApp } from '../context/AppContext';
import { getUnlockedTitles, TitleDef } from '../constants/titles';

interface Props {
  user: User;
  onSave: (updates: { height?: number; gender?: 'male' | 'female'; age?: number }) => void;
  onClose: () => void;
}

export default function SettingsModal({ user, onSave, onClose }: Props) {
  const { mySportXp, updateTitle } = useApp();
  const [gender, setGender] = useState<'male' | 'female' | undefined>(user.gender);
  const [height, setHeight] = useState(user.height ? String(user.height) : '');
  const [age, setAge] = useState(user.age ? String(user.age) : '');
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>(user.title);

  const unlockedTitles = getUnlockedTitles(mySportXp);

  async function handleSave() {
    onSave({
      gender,
      height: height ? Number(height) : undefined,
      age: age ? Number(age) : undefined,
    });
    await updateTitle(selectedTitle);
    onClose();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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

            {/* Title selection */}
            <Text style={styles.sectionLabel}>🏅 Titel</Text>
            {unlockedTitles.length === 0 ? (
              <View style={styles.noTitleBox}>
                <Text style={styles.noTitleText}>
                  Noch keine Titel freigeschaltet.{'\n'}
                  Trainiere eine Sportart bis Level 5 um deinen ersten Titel zu erhalten!
                </Text>
              </View>
            ) : (
              <View style={styles.titlesGrid}>
                <TouchableOpacity
                  style={[styles.titleChip, !selectedTitle && styles.titleChipActive]}
                  onPress={() => setSelectedTitle(undefined)}
                >
                  <Text style={[styles.titleChipText, !selectedTitle && styles.titleChipTextActive]}>
                    — Kein Titel
                  </Text>
                </TouchableOpacity>
                {unlockedTitles.map((t: TitleDef) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.titleChip,
                      selectedTitle === t.key && styles.titleChipActive,
                      t.key === 'black' && styles.titleChipBlack,
                    ]}
                    onPress={() => setSelectedTitle(t.key)}
                  >
                    <Text style={[
                      styles.titleChipText,
                      selectedTitle === t.key && styles.titleChipTextActive,
                      t.key === 'black' && styles.titleChipTextBlack,
                    ]}>
                      {t.emoji} {t.label}
                    </Text>
                    {t.sport && <Text style={styles.titleChipSport}>{t.sport}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedTitle && (
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Vorschau</Text>
                <Text style={styles.previewName}>
                  {unlockedTitles.find(t => t.key === selectedTitle)?.label} {user.name}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* Body settings */}
            <Text style={styles.sectionLabel}>📐 Körperdaten</Text>

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
              Größe, Alter und Gewicht (täglich beim Check-in) werden für deinen
              Kalorienbedarf (Mifflin-St. Jeor) genutzt.
            </Text>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>✓ Speichern</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: {
    width: '100%',
    maxWidth: 420,
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
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  closeBtn: { fontSize: 22, color: COLORS.textSecondary, fontWeight: '700' },
  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 10, marginTop: 4,
  },
  noTitleBox: {
    backgroundColor: COLORS.cardLight, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 14,
  },
  noTitleText: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  titlesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  titleChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardLight,
  },
  titleChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '33' },
  titleChipBlack: { borderColor: '#555', backgroundColor: '#1a1a1a' },
  titleChipText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  titleChipTextActive: { color: COLORS.primaryLight },
  titleChipTextBlack: { color: '#fff' },
  titleChipSport: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  previewBox: {
    backgroundColor: COLORS.primary + '18', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: COLORS.primary + '44', marginBottom: 14, alignItems: 'center',
  },
  previewLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '600' },
  previewName: { fontSize: 18, fontWeight: '800', color: COLORS.primaryLight },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  label: {
    fontSize: 12, color: COLORS.textSecondary, fontWeight: '600',
    letterSpacing: 0.5, marginBottom: 8, marginTop: 4,
  },
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  genderBtn: {
    flex: 1, padding: 12, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.cardLight,
  },
  genderBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '28' },
  genderBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  genderBtnTextActive: { color: COLORS.primaryLight },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardLight,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, gap: 8,
  },
  input: { flex: 1, color: COLORS.text, fontSize: 20, fontWeight: '700' },
  unit: { color: COLORS.textSecondary, fontSize: 14 },
  hint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 20, marginTop: 4 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
