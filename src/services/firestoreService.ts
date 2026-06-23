import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DayEntry, User } from '../types';

const PROJECT_ID = 'challenge-84fde';
const API_KEY = 'AIzaSyBDPV7ppVjZQ6blpsWZ5EOfROw5U9FFL30';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Convert a JS value to Firestore REST API typed format
function toFsValue(v: any): any {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsValue) } };
  if (typeof v === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) {
      if (val !== undefined) fields[k] = toFsValue(val);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

function objToFsFields(obj: Record<string, any>) {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toFsValue(v);
  }
  return fields;
}

// Save via Firestore REST API (bypasses SDK transport entirely)
async function patchDocument(collection: string, docId: string, data: Record<string, any>) {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: objToFsFields(data) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: User): Promise<void> {
  await patchDocument('users', user.id, user);
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
  await patchDocument('entries', id, { ...entry, id });
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
  const q = query(collection(db, 'entries'), where('userId', '==', userId));
  return onSnapshot(q, snap => {
    const entries = snap.docs.map(d => d.data() as DayEntry);
    entries.sort((a, b) => b.date.localeCompare(a.date));
    cb(entries);
  });
}

export async function getAllEntriesForUser(userId: string): Promise<DayEntry[]> {
  const q = query(collection(db, 'entries'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as DayEntry);
}
