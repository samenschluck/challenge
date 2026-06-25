import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { PATCH_NOTES } from '../constants/patchnotes';

interface Props {
  onClose: () => void;
}

export default function PatchNotesModal({ onClose }: Props) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>📋 Patchnotes</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {PATCH_NOTES.map((note, i) => (
              <View key={note.version} style={[styles.releaseBlock, i > 0 && styles.releaseBlockBorder]}>
                <View style={styles.releaseHeader}>
                  <View style={[styles.versionBadge, i === 0 && styles.versionBadgeLatest]}>
                    <Text style={[styles.versionText, i === 0 && styles.versionTextLatest]}>
                      v{note.version}
                    </Text>
                  </View>
                  {i === 0 && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEU</Text>
                    </View>
                  )}
                  <Text style={styles.dateText}>{note.date}</Text>
                </View>

                <View style={styles.changesList}>
                  {note.changes.map((change, j) => (
                    <View key={j} style={styles.changeRow}>
                      <Text style={styles.changeBullet}>·</Text>
                      <Text style={styles.changeText}>{change}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  closeBtn: { fontSize: 20, color: COLORS.textSecondary, padding: 4 },
  releaseBlock: { paddingVertical: 16 },
  releaseBlockBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  releaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  versionBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
    backgroundColor: COLORS.cardLight, borderWidth: 1, borderColor: COLORS.border,
  },
  versionBadgeLatest: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary + '88' },
  versionText: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
  versionTextLatest: { color: COLORS.primaryLight },
  newBadge: {
    backgroundColor: COLORS.success + '33', borderRadius: 8, paddingHorizontal: 7,
    paddingVertical: 2, borderWidth: 1, borderColor: COLORS.success + '66',
  },
  newBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.successLight ?? COLORS.success },
  dateText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 'auto' },
  changesList: { gap: 6 },
  changeRow: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  changeBullet: { fontSize: 16, color: COLORS.primary, lineHeight: 20, marginTop: 1 },
  changeText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
