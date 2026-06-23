import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';
import { COLORS } from './src/constants/theme';

function RootContent() {
  const { currentUser, loading } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return currentUser ? <TabNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <RootContent />
    </AppProvider>
  );
}
