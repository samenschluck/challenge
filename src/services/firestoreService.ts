import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DayEntry, User } from '../types';

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.id), user, { merge: true });
}

export function subscribeUsers(cb: (users: User[]) => void) {
  return onSnapshot(collection(db, 'users'), snap => {
    cb(snap.docs.map(d => d.data() as User));
  });
}

// ─── Day Entries ──────────────────────────────────────────────────────────────

export function entryId(userId: string, date: string) {
  return `${userId}_${date}`;
}

export async function saveDayEntry(entry: DayEntry): Promise<void> {
  const id = entryId(entry.userId, entry.date);
  await setDoc(doc(db, 'entries', id), { ...entry, id }, { merge: true });
}

export async function getDayEntry(userId: string, date: string): Promise<DayEntry | null> {
  const snap = await getDoc(doc(db, 'entries', entryId(userId, date)));
  return snap.exists() ? (snap.data() as DayEntry) : null;
}

export function subscribeAllEntriesForDate(date: string, cb: (entries: DayEntry[]) => void) {
  const q = query(collection(db, 'entries'), where('date', '==', date));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => d.data() as DayEntry));
  });
}

export function subscribeUserEntries(userId: string, cb: (entries: DayEntry[]) => void) {
  const q = query(
    collection(db, 'entries'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => d.data() as DayEntry));
  });
}

export async function getAllEntriesForUser(userId: string): Promise<DayEntry[]> {
  const q = query(collection(db, 'entries'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as DayEntry);
}
