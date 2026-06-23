import { ref, set, get, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { rtdb } from '../config/firebase';
import { DayEntry, User } from '../types';

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: User): Promise<void> {
  await set(ref(rtdb, `users/${user.id}`), user);
}

export function subscribeUsers(cb: (users: User[]) => void) {
  return onValue(ref(rtdb, 'users'), snap => {
    const val = snap.val();
    cb(val ? (Object.values(val) as User[]) : []);
  });
}

// ─── Day Entries ──────────────────────────────────────────────────────────────

export function entryId(userId: string, date: string) {
  return `${userId}_${date}`;
}

export async function saveDayEntry(entry: DayEntry): Promise<void> {
  const id = entryId(entry.userId, entry.date);
  await set(ref(rtdb, `entries/${id}`), { ...entry, id });
}

export async function getDayEntry(userId: string, date: string): Promise<DayEntry | null> {
  const snap = await get(ref(rtdb, `entries/${entryId(userId, date)}`));
  return snap.exists() ? (snap.val() as DayEntry) : null;
}

export function subscribeAllEntriesForDate(date: string, cb: (entries: DayEntry[]) => void) {
  const q = query(ref(rtdb, 'entries'), orderByChild('date'), equalTo(date));
  return onValue(q, snap => {
    const val = snap.val();
    cb(val ? (Object.values(val) as DayEntry[]) : []);
  });
}

export function subscribeUserEntries(userId: string, cb: (entries: DayEntry[]) => void) {
  const q = query(ref(rtdb, 'entries'), orderByChild('userId'), equalTo(userId));
  return onValue(q, snap => {
    const val = snap.val();
    if (!val) { cb([]); return; }
    const entries = (Object.values(val) as DayEntry[]).sort((a, b) => b.date.localeCompare(a.date));
    cb(entries);
  });
}

export async function getAllEntriesForUser(userId: string): Promise<DayEntry[]> {
  const q = query(ref(rtdb, 'entries'), orderByChild('userId'), equalTo(userId));
  const snap = await get(q);
  if (!snap.exists()) return [];
  return Object.values(snap.val()) as DayEntry[];
}
