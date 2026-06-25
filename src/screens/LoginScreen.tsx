import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, AVATARS, AVATAR_COLORS } from '../constants/theme';
import { User } from '../types';
import { useApp } from '../context/AppContext';
import { getTodayDayNumber } from '../utils/dateUtils';
import { displayName } from '../utils/displayName';
import { getTitleByKey } from '../constants/titles';

const PRESET_USERS = [
  { name: 'FelsenFlade', avatar: AVATARS[0], avatarColor: AVATAR_COLORS[0] },
  { name: 'EisenMote', avatar: AVATARS[1], avatarColor: AVATAR_COLORS[1] },
  { name: 'Maximus', avatar: AVATARS[2], avatarColor: AVATAR_COLORS[2] },
];

export default function LoginScreen() {
  const { setCurrentUser, allUsers } = useApp();
  const [customName, setCustomName] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const dayNum = getTodayDayNumber();

  async function pickUser(name: string, avatar: string, color: string) {
    const user: User = {
      id: name.toLowerCase().trim(),
      name,
      avatar,
      avatarColor: color,
    };
    await setCurrentUser(user);
  }

  return (
    <LinearGradient colors={['#0f0f1a', '#1a0f2e', '#0f0f1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
              <Text style={styles.trophy}>🏆</Text>
              <Text style={styles.title}>100 Tage{'\n'}Challenge</Text>
              <Text style={styles.subtitle}>Tag {Math.max(1, dayNum)} von 100</Text>
              <Text style={styles.dates}>23. Juni – 30. September 2026</Text>
            </View>

            <Text style={styles.sectionLabel}>Wer bist du?</Text>

            {PRESET_USERS.map(u => {
              const fbUser = allUsers.find(fu => fu.id === u.name.toLowerCase().trim());
              const titleDef = fbUser?.title ? getTitleByKey(fbUser.title) : undefined;
              return (
                <TouchableOpacity key={u.name} style={styles.userCard} onPress={() => pickUser(u.name, u.avatar, u.avatarColor)}>
                  <View style={[styles.avatarCircle, { backgroundColor: u.avatarColor + '33', borderColor: u.avatarColor }]}>
                    <Text style={styles.avatarEmoji}>{u.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    {titleDef && (
                      <View style={[styles.titleBadge, titleDef.key === 'black' && styles.titleBadgeBlack]}>
                        <Text style={[styles.titleBadgeText, titleDef.key === 'black' && styles.titleBadgeTextBlack]}>
                          {titleDef.emoji} {titleDef.label}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.userName}>{u.name}</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.customBtn} onPress={() => setShowCustom(!showCustom)}>
              <Text style={styles.customBtnText}>+ Anderen Namen eingeben</Text>
            </TouchableOpacity>

            {showCustom && (
              <View style={styles.customRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Dein Name..."
                  placeholderTextColor={COLORS.textMuted}
                  value={customName}
                  onChangeText={setCustomName}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.goBtn, !customName.trim() && styles.goBtnDisabled]}
                  onPress={() => customName.trim() && pickUser(customName.trim(), '⚡', COLORS.primary)}
                  disabled={!customName.trim()}
                >
                  <Text style={styles.goBtnText}>Los</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  trophy: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: '800', color: COLORS.text, textAlign: 'center', lineHeight: 42 },
  subtitle: { fontSize: 18, color: COLORS.primary, fontWeight: '700', marginTop: 8 },
  dates: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  sectionLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 12, letterSpacing: 1 },
  userCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  avatarEmoji: { fontSize: 26 },
  userName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  titleBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, backgroundColor: COLORS.primary + '33',
    borderWidth: 1, borderColor: COLORS.primary + '66', marginBottom: 4,
  },
  titleBadgeBlack: { backgroundColor: '#111', borderColor: '#444' },
  titleBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.primaryLight },
  titleBadgeTextBlack: { color: '#ffd700' },
  arrow: { fontSize: 20, color: COLORS.primary },
  customBtn: { marginTop: 8, alignItems: 'center', padding: 12 },
  customBtnText: { color: COLORS.textSecondary, fontSize: 14 },
  customRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  input: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 12,
    padding: 14, color: COLORS.text, fontSize: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  goBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  goBtnDisabled: { opacity: 0.4 },
  goBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
