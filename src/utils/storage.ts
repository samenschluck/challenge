import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const USER_KEY = 'challenge_user';

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}
