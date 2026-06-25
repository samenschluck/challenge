export interface PatchNote {
  version: string;
  date: string;
  changes: string[];
}

export const PATCH_NOTES: PatchNote[] = [
  {
    version: '1.4.0',
    date: '25.06.2026',
    changes: [
      '32 Achievements in 4 Seltenheitsstufen (Gewöhnlich / Selten / Episch / Legendär) 🏅',
      'Toast-Benachrichtigung beim Freischalten eines neuen Achievements',
      'Achievements-Übersicht in den Statistiken',
      'Chat: Long-Press auf eine Nachricht öffnet Reaktions-Picker 👍❤️😂💪🔥😮',
      'Chat: Reaktionen werden live unter den Nachrichten angezeigt und sind antippbar',
    ],
  },
  {
    version: '1.3.0',
    date: '25.06.2026',
    changes: [
      'Patchnotes-Button auf dem Login-Screen 📋',
      'Gruppen-Chat hinzugefügt 💬 — neuer Tab für alle Challenge-Teilnehmer',
    ],
  },
  {
    version: '1.2.0',
    date: '25.06.2026',
    changes: [
      'Neue Sportarten: Kampfsport 🥋 und Vikings Training 🪓',
      'Kampfsport-Titel: Weißgurt → Blaugurt → Kämpfer → Krieger → Sensei',
      'Vikings-Titel: Wikingerkind → Schildträger → Berserker → Jarls Krieger → Nordmann',
      'XP-Balancing: Härtere Sportarten geben mehr XP pro Minute (HIIT 1.8×, Laufen/Kampfsport 1.4×, Krafttraining 1.0×)',
      'Intensitätsbonus: leicht 0.75×, mittel 1.0×, intensiv 1.3×',
    ],
  },
  {
    version: '1.1.0',
    date: '24.06.2026',
    changes: [
      'Rank-Up-System: Jede Sportart hat jetzt XP und Levels (max. Level 30)',
      'Titel freischalten alle 5 Level, z.B. "Gehender", "Sprinter", "Windbrecher"',
      'Titel-Auswahl in den Einstellungen — wird überall angezeigt',
      'Globaler Titel "BLACK" ⬛ für Level 30 in einer Sportart',
      'Mehrere Trainings pro Tag möglich (wie bei den Mahlzeiten)',
      'Jeden vergangenen Tag im Kalender bearbeitbar',
      'Heutiger Tag ohne Eintrag zählt nicht als Verpasst',
      'Streak bricht nicht, wenn heute noch kein Training eingetragen ist',
      'Yoga, Basketball und Fußball entfernt',
      'Versionsnummer auf Login- und Home-Screen',
    ],
  },
  {
    version: '1.0.0',
    date: '23.06.2026',
    changes: [
      'App-Start! 🎉 100 Tage Challenge beginnt',
      'Täglicher Check-in: Training & Nährwerte eintragen',
      'Mehrere Mahlzeiten pro Tag erfassen',
      'Gewicht & Stimmung tracken',
      'Kalender-Übersicht mit Streak-Zähler',
      'Leaderboard & persönliche Statistiken',
      'Personalisierte Kalorienziele basierend auf Gewicht, Größe, Alter',
      'Profil-Einstellungen',
    ],
  },
];
