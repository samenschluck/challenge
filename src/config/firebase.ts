import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ⚠️  SETUP REQUIRED:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (e.g. "fitness-challenge-100")
// 3. Add a Web App and copy the config below
// 4. In Firestore → Rules, set:
//    allow read, write: if true;   (for now – add auth later if needed)

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
