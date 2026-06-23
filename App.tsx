import React from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';
import { COLORS } from './src/constants/theme';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null; stack: string | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null, stack: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message, stack: error.stack ?? '' };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0f0f1a', padding: 20 }}>
          <Text style={{ color: '#FF5555', fontSize: 18, fontWeight: 'bold', marginTop: 60, marginBottom: 12 }}>
            ⚠️ App Fehler
          </Text>
          <Text style={{ color: '#FF9999', fontSize: 13, marginBottom: 16 }}>
            {this.state.error}
          </Text>
          <Text style={{ color: '#666', fontSize: 11, fontFamily: 'monospace' }}>
            {this.state.stack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <AppProvider>
        <StatusBar style="light" />
        <ErrorBoundary>
          <RootContent />
        </ErrorBoundary>
      </AppProvider>
    </ErrorBoundary>
  );
}
