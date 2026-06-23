import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, DayEntry } from '../types';
import { loadUser, saveUser, clearUser } from '../utils/storage';
import { upsertUser, subscribeUsers, subscribeAllEntriesForDate, subscribeUserEntries } from '../services/firestoreService';
import { getTodayString } from '../utils/dateUtils';

interface AppContextType {
  currentUser: User | null;
  allUsers: User[];
  todayEntries: DayEntry[];
  myEntries: DayEntry[];
  todayMyEntry: DayEntry | null;
  setCurrentUser: (user: User) => Promise<void>;
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
    await saveUser(user);
    await upsertUser(user);
    setCurrentUserState(user);
  }

  function logout() {
    setCurrentUserState(null);
    clearUser();
  }

  return (
    <AppContext.Provider value={{ currentUser, allUsers, todayEntries, myEntries, todayMyEntry, setCurrentUser, logout, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
