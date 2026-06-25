import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { AchievementDef, RARITY_COLORS, RARITY_LABELS } from '../constants/achievements';

interface Props {
  achievement: AchievementDef;
  onDismiss: () => void;
}

export default function AchievementToast({ achievement, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 8 }),
      Animated.timing(opacity,    { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,    duration: 300, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const rarityColor = RARITY_COLORS[achievement.rarity];

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <View style={[styles.toast, { borderColor: achievement.color + 'aa', shadowColor: achievement.color }]}>
        <View style={[styles.emojiCircle, { backgroundColor: achievement.color + '22' }]}>
          <Text style={styles.emoji}>{achievement.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>🏅 Achievement freigeschaltet!</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <View style={[styles.rarityChip, { backgroundColor: rarityColor + '28' }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {RARITY_LABELS[achievement.rarity].toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e35',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  emojiCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  label: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 2 },
  title: { fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  rarityChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 7 },
  rarityText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
});
