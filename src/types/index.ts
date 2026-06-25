export interface User {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  height?: number;
  gender?: 'male' | 'female';
  age?: number;
}

export interface Workout {
  id: string;
  type: string;
  duration: number;
  intensity: 'leicht' | 'mittel' | 'intensiv';
  notes?: string;
}

export interface WorkoutEntry {
  workouts: Workout[];
  // Legacy fields kept for backward compat with old saved data
  type?: string;
  duration?: number;
  intensity?: 'leicht' | 'mittel' | 'intensiv';
  notes?: string;
}

export interface NutritionEntry {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  meals: Meal[];
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export interface DayEntry {
  id: string;
  userId: string;
  date: string;
  workout: WorkoutEntry | null;
  nutrition: NutritionEntry | null;
  mood: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  weight?: number;
  completedAt: string;
}

export type Screen = 'login' | 'home' | 'checkin' | 'calendar' | 'stats' | 'nutrition';
