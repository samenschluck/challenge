import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Meal } from '../types';
import BarcodeScanner from './BarcodeScanner';

interface Props {
  onMealAdded: (meal: Meal) => void;
  onClose: () => void;
  editMeal?: Meal;
}

type Stage = 'choose' | 'manual' | 'scanning';

export default function AddMealModal({ onMealAdded, onClose, editMeal }: Props) {
  const [stage, setStage] = useState<Stage>(editMeal ? 'manual' : 'choose');
  const [name, setName] = useState(editMeal?.name ?? '');
  const [kcal, setKcal] = useState(editMeal ? String(editMeal.calories) : '');
  const [protein, setProtein] = useState(editMeal ? String(editMeal.protein) : '');
  const [carbs, setCarbs] = useState(editMeal ? String(editMeal.carbs) : '');
  const [fat, setFat] = useState(editMeal ? String(editMeal.fat) : '');

  function handleManualSave() {
    if (!name.trim()) return;
    const meal: Meal = {
      id: editMeal?.id ?? Date.now().toString(),
      name: name.trim(),
      calories: Number(kcal) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      time: editMeal?.time ?? new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    };
    onMealAdded(meal);
    onClose();
  }

  return (
    <>
      <Modal
        visible={stage !== 'scanning'}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {stage === 'choose' ? '+ Mahlzeit hinzufügen'
                  : editMeal ? '✏️ Mahlzeit bearbeiten'
                  : '✏️ Manuell eingeben'}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {stage === 'choose' && (
              <View style={styles.choiceRow}>
                <TouchableOpacity style={styles.choiceBtn} onPress={() => setStage('scanning')}>
                  <Text style={styles.choiceIcon}>📷</Text>
                  <Text style={styles.choiceTitle}>Barcode</Text>
                  <Text style={styles.choiceSub}>scannen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.choiceBtn} onPress={() => setStage('manual')}>
                  <Text style={styles.choiceIcon}>✏️</Text>
                  <Text style={styles.choiceTitle}>Manuell</Text>
                  <Text style={styles.choiceSub}>eingeben</Text>
                </TouchableOpacity>
              </View>
            )}

            {stage === 'manual' && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <TextInput
                  style={styles.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Name (z.B. Hähnchenbrust, Haferflocken…)"
                  placeholderTextColor={COLORS.textMuted}
                  autoFocus={!editMeal}
                />

                <View style={styles.macroRow}>
                  <View style={styles.macroCell}>
                    <Text style={[styles.macroLabel, { color: COLORS.calories }]}>Kalorien</Text>
                    <View style={styles.macroInputRow}>
                      <TextInput
                        style={styles.macroInput}
                        value={kcal}
                        onChangeText={setKcal}
                        placeholder="0"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                      />
                      <Text style={styles.macroUnit}>kcal</Text>
                    </View>
                  </View>
                  <View style={styles.macroCell}>
                    <Text style={[styles.macroLabel, { color: COLORS.protein }]}>Protein</Text>
                    <View style={styles.macroInputRow}>
                      <TextInput
                        style={styles.macroInput}
                        value={protein}
                        onChangeText={setProtein}
                        placeholder="0"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                      />
                      <Text style={styles.macroUnit}>g</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.macroRow}>
                  <View style={styles.macroCell}>
                    <Text style={[styles.macroLabel, { color: COLORS.carbs }]}>Kohlenhydrate</Text>
                    <View style={styles.macroInputRow}>
                      <TextInput
                        style={styles.macroInput}
                        value={carbs}
                        onChangeText={setCarbs}
                        placeholder="0"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                      />
                      <Text style={styles.macroUnit}>g</Text>
                    </View>
                  </View>
                  <View style={styles.macroCell}>
                    <Text style={[styles.macroLabel, { color: COLORS.fat }]}>Fett</Text>
                    <View style={styles.macroInputRow}>
                      <TextInput
                        style={styles.macroInput}
                        value={fat}
                        onChangeText={setFat}
                        placeholder="0"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                      />
                      <Text style={styles.macroUnit}>g</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
                  onPress={handleManualSave}
                  disabled={!name.trim()}
                >
                  <Text style={styles.saveBtnText}>
                    {editMeal ? '✓ Änderungen speichern' : '✓ Fertig – Mahlzeit hinzufügen'}
                  </Text>
                </TouchableOpacity>

                {!editMeal && (
                  <TouchableOpacity style={styles.backBtn} onPress={() => setStage('choose')}>
                    <Text style={styles.backBtnText}>← Zurück zur Auswahl</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {stage === 'scanning' && (
        <BarcodeScanner
          onMealAdded={(meal) => { onMealAdded(meal); onClose(); }}
          onClose={() => setStage('choose')}
        />
      )}
    </>
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
    width: '94%',
    maxHeight: '90%' as any,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text, flex: 1 },
  closeBtn: { fontSize: 22, color: COLORS.textSecondary, fontWeight: '700', marginLeft: 10 },

  // Choose stage
  choiceRow: { flexDirection: 'row', gap: 14, paddingVertical: 8, paddingBottom: 12 },
  choiceBtn: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  choiceIcon: { fontSize: 40, marginBottom: 10 },
  choiceTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  choiceSub: { fontSize: 13, color: COLORS.textSecondary },

  // Manual stage
  nameInput: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  macroCell: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  macroLabel: { fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.3 },
  macroInputRow: { flexDirection: 'row', alignItems: 'baseline' },
  macroInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    padding: 0,
  },
  macroUnit: { color: COLORS.textSecondary, fontSize: 13, marginLeft: 4 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  backBtn: { alignItems: 'center', padding: 10 },
  backBtnText: { color: COLORS.textSecondary, fontSize: 14 },
});
