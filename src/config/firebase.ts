import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBDPV7ppVjZQ6blpsWZ5EOfROw5U9FFL30',
  authDomain: 'challenge-84fde.firebaseapp.com',
  projectId: 'challenge-84fde',
  storageBucket: 'challenge-84fde.firebasestorage.app',
  messagingSenderId: '1025477610006',
  appId: '1:1025477610006:web:0e165454404bd154cc4337',
};

export const firebaseProjectId = firebaseConfig.projectId;
export const firebaseConfigured = true;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use HTTP long-polling (no WebSockets) + memory-only cache so writes
// fail immediately with a real error instead of hanging indefinitely
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache(),
});
