import type { MealEntry } from '@/types';

const MEAL_LOGS_KEY = 'ecoAiCalorieTracker_mealLogs';

export function getMealLogs(): MealEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const logsJson = localStorage.getItem(MEAL_LOGS_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (error) {
    console.error("Error reading meal logs from localStorage:", error);
    return [];
  }
}

export function addMealLog(entry: Omit<MealEntry, 'id' | 'date'>): MealEntry {
  if (typeof window === 'undefined') {
    // This should ideally not happen if called from client components correctly
    const newEntryStub: MealEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 15),
      date: new Date().toISOString(),
    };
    console.warn("localStorage not available, meal log not saved:", newEntryStub);
    return newEntryStub; 
  }
  const logs = getMealLogs();
  const newEntry: MealEntry = {
    ...entry,
    id: Math.random().toString(36).substring(2, 15), // Simple unique ID
    date: new Date().toISOString(),
  };
  logs.push(newEntry);
  try {
    localStorage.setItem(MEAL_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Error saving meal log to localStorage:", error);
  }
  return newEntry;
}

export function clearMealLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MEAL_LOGS_KEY);
  } catch (error) {
    console.error("Error clearing meal logs from localStorage:", error);
  }
}
