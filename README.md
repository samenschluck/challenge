# 100 Tage Fitness Challenge App
**23. Juni – 30. September 2026**

## Features
- 📱 Läuft auf iOS & Android (via Expo)
- 🔄 Echtzeit-Sync für alle 3 Teilnehmer (Firebase)
- 💪 Sport-Tracking (Art, Dauer, Intensität)
- 🥗 Nährwerte-Tracking (Kalorien, Protein, Kohlenhydrate, Fett, Wasser)
- 🍽️ Einzelne Mahlzeiten erfassen mit Auto-Summierung
- 📅 100-Tage Kalender mit Farbcodierung
- 📊 Stats & Leaderboard
- 🔥 Streak-Counter

## Setup (PFLICHT vor dem Start)

### 1. Firebase Projekt erstellen
1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
2. Neues Projekt erstellen (z.B. `fitness-challenge-100`)
3. **Firestore Database** aktivieren → "In Production mode" starten
4. **Firestore Regeln** anpassen (Temporär für den Anfang):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
5. **Web-App hinzufügen** → Config kopieren

### 2. Firebase Config eintragen
Öffne `src/config/firebase.ts` und ersetze die Platzhalter:
```typescript
const firebaseConfig = {
  apiKey: "dein-api-key",
  authDomain: "dein-projekt.firebaseapp.com",
  projectId: "dein-projekt-id",
  // ...
};
```

### 3. App starten
```bash
npm install
npx expo start
```

Dann mit der **Expo Go** App auf iPhone/Android scannen → fertig!

## Benutzernamen anpassen
In `src/screens/LoginScreen.tsx` die drei Namen ändern:
```typescript
const PRESET_USERS = [
  { name: 'Euer Name 1', ... },
  { name: 'Euer Name 2', ... },
  { name: 'Euer Name 3', ... },
];
```

## APK/IPA bauen (optional)
```bash
npx eas build --platform android  # Android APK
npx eas build --platform ios      # iOS IPA
```
Benötigt ein [Expo EAS Account](https://expo.dev).
