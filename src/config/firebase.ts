import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBDPV7ppVjZQ6blpsWZ5EOfROw5U9FFL30',
  authDomain: 'challenge-84fde.firebaseapp.com',
  projectId: 'challenge-84fde',
  storageBucket: 'challenge-84fde.firebasestorage.app',
  messagingSenderId: '1025477610006',
  appId: '1:1025477610006:web:0e165454404bd154cc4337',
  databaseURL: 'https://challenge-84fde-default-rtdb.europe-west1.firebasedatabase.app',
};

export const firebaseProjectId = firebaseConfig.projectId;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const rtdb = getDatabase(app);
