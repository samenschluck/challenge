import { ref, set, get, push, onValue, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { rtdb } from '../config/firebase';
import { ChatMessage, DayEntry, User } from '../types';

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: User): Promise<void> {
  await set(ref(rtdb, `users/${user.id}`), user);
}

export async function getUser(userId: string): Promise<User | null> {
  const snap = await get(ref(rtdb, `users/${userId}`));
  return snap.exists() ? (snap.val() as User) : null;
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

export function subscribeAllEntries(cb: (entries: DayEntry[]) => void) {
  return onValue(ref(rtdb, 'entries'), snap => {
    const val = snap.val();
    cb(val ? (Object.values(val) as DayEntry[]) : []);
  });
}

export async function getAllEntriesForUser(userId: string): Promise<DayEntry[]> {
  const q = query(ref(rtdb, 'entries'), orderByChild('userId'), equalTo(userId));
  const snap = await get(q);
  if (!snap.exists()) return [];
  return Object.values(snap.val()) as DayEntry[];
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(msg: Omit<ChatMessage, 'id'>): Promise<void> {
  const newRef = push(ref(rtdb, 'chat'));
  await set(newRef, { ...msg, id: newRef.key });
}

export function subscribeChatMessages(cb: (messages: ChatMessage[]) => void, limit = 100) {
  const q = query(ref(rtdb, 'chat'), orderByChild('timestamp'), limitToLast(limit));
  return onValue(q, snap => {
    const val = snap.val();
    if (!val) { cb([]); return; }
    const msgs = (Object.values(val) as ChatMessage[]).sort((a, b) => a.timestamp - b.timestamp);
    cb(msgs);
  });
}

export async function toggleChatReaction(messageId: string, emoji: string, userId: string): Promise<void> {
  const r = ref(rtdb, `chat/${messageId}/reactions/${emoji}/${userId}`);
  const snap = await get(r);
  await set(r, snap.exists() ? null : true);
}
