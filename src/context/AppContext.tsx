import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, DayEntry } from '../types';
import { loadUser, saveUser, clearUser } from '../utils/storage';
import { upsertUser, getUser, subscribeUsers, subscribeAllEntriesForDate, subscribeUserEntries } from '../services/firestoreService';
import { getTodayString } from '../utils/dateUtils';

interface AppContextType {
  currentUser: User | null;
  allUsers: User[];
  todayEntries: DayEntry[];
  myEntries: DayEntry[];
  todayMyEntry: DayEntry | null;
  setCurrentUser: (user: User) => Promise<void>;
  updateUserSettings: (updates: { height?: number; gender?: 'male' | 'female'; age?: number }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [todayEntries, setTodayEntries] = useState<DayEntry[]>([]);
  const [myEntries, setMyEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser().then(user => {
      if (user) setCurrentUserState(user);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const unsub = subscribeUsers(setAllUsers);
    return unsub;
  }, []);

  useEffect(() => {
    const today = getTodayString();
    const unsub = subscribeAllEntriesForDate(today, setTodayEntries);
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeUserEntries(currentUser.id, setMyEntries);
    return unsub;
  }, [currentUser?.id]);

  const todayMyEntry = todayEntries.find(e => e.userId === currentUser?.id) ?? null;

  async function setCurrentUser(user: User) {
    // Merge with existing data so settings (height/gender/age) survive re-login
    let merged = user;
    const existingInList = allUsers.find(u => u.id === user.id);
    if (existingInList) {
      merged = { ...existingInList, ...user };
    } else {
      // allUsers might not be loaded yet — fetch directly from Firebase
      try {
        const existing = await getUser(user.id);
        if (existing) merged = { ...existing, ...user };
      } catch {}
    }
    await saveUser(merged);
    setCurrentUserState(merged);
    upsertUser(merged).catch(() => {});
  }

  async function updateUserSettings(updates: { height?: number; gender?: 'male' | 'female'; age?: number }) {
    if (!currentUser) return;
    const updated: User = { ...currentUser, ...updates };
    await saveUser(updated);
    setCurrentUserState(updated);
    upsertUser(updated).catch(() => {});
  }

  function logout() {
    setCurrentUserState(null);
    clearUser();
  }

  return (
    <AppContext.Provider value={{
      currentUser, allUsers, todayEntries, myEntries, todayMyEntry,
      setCurrentUser, updateUserSettings, logout, loading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
