import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import CheckinScreen from '../screens/CheckinScreen';
import CalendarScreen from '../screens/CalendarScreen';
import StatsScreen from '../screens/StatsScreen';
import ChatScreen from '../screens/ChatScreen';

type Tab = 'home' | 'checkin' | 'calendar' | 'stats' | 'chat';

const TABS = [
  { key: 'home', icon: '🏠', label: 'Home' },
  { key: 'checkin', icon: '⚡', label: 'Check-in' },
  { key: 'calendar', icon: '📅', label: 'Kalender' },
  { key: 'stats', icon: '📊', label: 'Stats' },
  { key: 'chat', icon: '💬', label: 'Chat' },
] as const;

export default function TabNavigator() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [checkinDate, setCheckinDate] = useState<string | undefined>(undefined);

  function goCheckin(date?: string) {
    setCheckinDate(date);
    setActiveTab('checkin');
  }

  function handleTabPress(tab: Tab) {
    if (tab !== 'checkin') setCheckinDate(undefined);
    setActiveTab(tab);
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {activeTab === 'home' && <HomeScreen onGoCheckin={() => goCheckin()} />}
        {activeTab === 'checkin' && <CheckinScreen date={checkinDate} onDone={() => { setCheckinDate(undefined); setActiveTab('home'); }} />}
        {activeTab === 'calendar' && <CalendarScreen onEditDay={(date) => goCheckin(date)} />}
        {activeTab === 'stats' && <StatsScreen />}
        {activeTab === 'chat' && <ChatScreen />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => handleTabPress(tab.key as Tab)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#12121f',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  tabLabelActive: { color: COLORS.primaryLight },
  tabIndicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 3 },
});
