import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { AchievementDef, RARITY_COLORS, RARITY_LABELS } from '../constants/achievements';

interface Props {
  achievement: AchievementDef;
  unlocked: boolean;
}

export default function AchievementBadge({ achievement, unlocked }: Props) {
  const rarityColor = RARITY_COLORS[achievement.rarity];
  const accentColor = unlocked ? achievement.color : '#3a3a4a';

  return (
    <View style={[
      styles.card,
      unlocked
        ? { borderColor: accentColor + 'aa', shadowColor: accentColor, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 }
        : styles.cardLocked,
    ]}>
      {/* Emoji circle */}
      <View style={[styles.emojiCircle, { backgroundColor: accentColor + (unlocked ? '22' : '11') }]}>
        <Text style={styles.emoji}>{unlocked ? achievement.emoji : '🔒'}</Text>
      </View>

      {/* Rarity chip */}
      <View style={[styles.rarityChip, { backgroundColor: unlocked ? rarityColor + '28' : '#2a2a3a' }]}>
        <Text style={[styles.rarityText, { color: unlocked ? rarityColor : COLORS.textMuted }]}>
          {RARITY_LABELS[achievement.rarity].toUpperCase()}
        </Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, !unlocked && styles.textLocked]} numberOfLines={2}>
        {achievement.title}
      </Text>

      {/* Description */}
      <Text style={[styles.desc, !unlocked && styles.textLocked]} numberOfLines={2}>
        {achievement.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    gap: 6,
  },
  cardLocked: {
    borderColor: COLORS.border,
    opacity: 0.45,
  },
  emojiCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  emoji: { fontSize: 28 },
  rarityChip: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  title: {
    fontSize: 13, fontWeight: '800', color: COLORS.text,
    textAlign: 'center', lineHeight: 17,
  },
  textLocked: { color: COLORS.textMuted },
  desc: {
    fontSize: 10, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 14,
  },
});
