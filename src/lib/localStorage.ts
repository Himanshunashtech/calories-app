
import type { MealEntry, UserPlan, AIScanUsage, UserProfile, WaterIntakeData, ReminderSettings, MealCategory, AppSettings, WeightEntry, OnboardingData } from '@/types';
// Supabase will handle user profile and auth state, so these are removed or modified:
// const USER_PROFILE_KEY = 'ecoAi_userProfile';
// const ONBOARDING_COMPLETE_KEY = 'ecoAi_onboardingComplete';
// const USER_LOGGED_IN_KEY = 'ecoAi_userLoggedIn';

const MEAL_LOGS_KEY = 'ecoAiCalorieTracker_mealLogs'; // Keep for now, migrate later
const SELECTED_PLAN_KEY = 'ecoAi_selectedPlan'; // Keep for now, migrate to profile later
const AI_SCAN_USAGE_KEY = 'ecoAi_aiScanUsage'; // Keep for now, migrate later
const WATER_INTAKE_KEY = 'ecoAi_waterIntake'; // Keep for now, migrate later
const GENERATED_MEAL_PLAN_OUTPUT_KEY = 'ecoAi_generatedMealPlanOutput'; // Temporary client-side storage
const MEAL_PLAN_KEY = 'ecoAi_mealPlan'; // Temporary client-side storage
const WEIGHT_ENTRIES_KEY = 'ecoAi_weightEntries'; // Keep for now, migrate later


// --- User Profile & Auth (To be mostly handled by Supabase) ---
// These functions are now simplified or will be phased out.

export const defaultUserProfileData: OnboardingData = {
  email: '',
  name: '',
  age: '',
  gender: '',
  height: '',
  height_unit: 'cm',
  weight: '',
  weight_unit: 'kg',
  activity_level: '',
  health_goals: [],
  also_track_sustainability: false,
  exercise_frequency: '',
  diet_type: '',
  dietary_restrictions: [],
  favorite_cuisines: '',
  disliked_ingredients: '',
  enable_carbon_tracking: false,
  sleep_hours: '',
  stress_level: '',
  water_goal: 8,
  macroSplit: { carbs: 50, protein: 25, fat: 25},
  profile_image_url: null,
  onboarding_complete: false,
  selected_plan: 'free',
  reminderSettings: {
    mealRemindersEnabled: true,
    breakfastTime: '08:00',
    lunchTime: '12:30',
    dinnerTime: '18:30',
    waterReminderEnabled: false,
    waterReminderInterval: 60,
    snoozeDuration: 5,
  },
  appSettings: {
    darkModeEnabled: false,
    unitPreferences: {
      weight: 'kg',
      height: 'cm',
      volume: 'ml',
    },
    hideNonCompliantRecipes: false,
  }
};

// This function will be less used as profile data comes from Supabase
// but can be a fallback or for initial non-logged-in onboarding state.
export function getLocalOnboardingData(): OnboardingData {
  if (typeof window === 'undefined') return { ...defaultUserProfileData };
  try {
    const data = localStorage.getItem('ecoAi_onboardingTempData');
    return data ? JSON.parse(data) : { ...defaultUserProfileData };
  } catch (error) {
    console.error("Error reading onboardingTempData from localStorage:", error);
    return { ...defaultUserProfileData };
  }
}

export function saveLocalOnboardingData(data: OnboardingData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ecoAi_onboardingTempData', JSON.stringify(data));
  } catch (error) {
    console.error("Error writing onboardingTempData to localStorage:", error);
  }
}

export function clearLocalOnboardingData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('ecoAi_onboardingTempData');
  } catch (error) {
    console.error("Error removing onboardingTempData from localStorage:", error);
  }
}


// --- Features still using localStorage temporarily (to be migrated) ---

// Meal Logs
export function getMealLogs(): MealEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const logsJson = localStorage.getItem(MEAL_LOGS_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (error) {
    console.error(`Error reading '${MEAL_LOGS_KEY}' from localStorage:`, error);
    return [];
  }
}

export function addMealLog(entry: Omit<MealEntry, 'id' | 'date'>): MealEntry {
  const newEntry: MealEntry = {
    ...entry,
    id: Math.random().toString(36).substring(2, 15), // Client-side temp ID
    date: new Date().toISOString(),
    category: entry.category,
  };

  if (typeof window === 'undefined') {
    console.warn("localStorage not available, meal log not saved locally:", newEntry);
    return newEntry;
  }

  const logs = getMealLogs();
  logs.push(newEntry);
  try {
    localStorage.setItem(MEAL_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error(`Error writing '${MEAL_LOGS_KEY}' to localStorage:`, error);
  }
  return newEntry;
}

export function updateMealLogWithMood(mealId: string, mood: 'happy' | 'neutral' | 'sad'): MealEntry | null {
  if (typeof window === 'undefined') return null;
  const logs = getMealLogs();
  const mealIndex = logs.findIndex(log => log.id === mealId);
  if (mealIndex !== -1) {
    logs[mealIndex].mood = mood;
    try {
      localStorage.setItem(MEAL_LOGS_KEY, JSON.stringify(logs));
      return logs[mealIndex];
    } catch (error) {
      console.error(`Error updating mood in '${MEAL_LOGS_KEY}' in localStorage:`, error);
      return null;
    }
  }
  return null;
}

export function clearMealLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MEAL_LOGS_KEY);
  } catch (error) {
    console.error(`Error removing '${MEAL_LOGS_KEY}' from localStorage:`, error);
  }
}

// User Plan (temporary, should move to Supabase profile)
export function getSelectedPlan(): UserPlan {
  if (typeof window === 'undefined') return 'free';
  try {
    const plan = localStorage.getItem(SELECTED_PLAN_KEY) as UserPlan | null;
    return plan || 'free';
  } catch (error) {
    console.error(`Error reading '${SELECTED_PLAN_KEY}' from localStorage:`, error);
    return 'free';
  }
}

export function setSelectedPlan(plan: UserPlan): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SELECTED_PLAN_KEY, plan);
  } catch (error) {
    console.error(`Error writing '${SELECTED_PLAN_KEY}' to localStorage:`, error);
  }
}

// AI Scan Usage
const FREE_TIER_SCAN_LIMIT = 3;
export function getAIScanUsage(): AIScanUsage {
  const defaultUsage = { count: 0, limit: FREE_TIER_SCAN_LIMIT, lastResetMonth: new Date().getMonth() };
  if (typeof window === 'undefined') return defaultUsage;
  let usage: AIScanUsage;
  try {
    const usageJson = localStorage.getItem(AI_SCAN_USAGE_KEY);
    usage = usageJson ? JSON.parse(usageJson) : { ...defaultUsage };
  } catch (error) {
    console.error(`Error reading '${AI_SCAN_USAGE_KEY}' from localStorage:`, error);
    usage = { ...defaultUsage };
  }
  const currentMonth = new Date().getMonth();
  if (usage.lastResetMonth !== currentMonth) {
    usage.count = 0;
    usage.lastResetMonth = currentMonth;
    try { localStorage.setItem(AI_SCAN_USAGE_KEY, JSON.stringify(usage)); }
    catch (e) { console.error("Error resetting AI Scan Usage", e); }
  }
  usage.limit = FREE_TIER_SCAN_LIMIT;
  return usage;
}

export function incrementAIScanCount(): void {
  if (typeof window === 'undefined') return;
  const usage = getAIScanUsage();
  usage.count += 1;
  try {
    localStorage.setItem(AI_SCAN_USAGE_KEY, JSON.stringify(usage));
  } catch (error) {
    console.error(`Error writing '${AI_SCAN_USAGE_KEY}' to localStorage:`, error);
  }
}

export function canUseAIScan(plan: UserPlan): boolean {
  if (plan === 'pro' || plan === 'ecopro') return true;
  const usage = getAIScanUsage();
  return usage.count < usage.limit;
}

// Water Intake
const DEFAULT_DAILY_WATER_GOAL_GLASSES = 8;
export function getWaterIntake(profileGoal?: number): WaterIntakeData {
  const today = new Date().toISOString().split('T')[0];
  const goal = profileGoal || DEFAULT_DAILY_WATER_GOAL_GLASSES;
  const defaultIntake = { current: 0, goal, lastUpdatedDate: today };
  if (typeof window === 'undefined') return defaultIntake;
  let intake: WaterIntakeData;
  try {
    const intakeJson = localStorage.getItem(WATER_INTAKE_KEY);
    if (intakeJson) {
      intake = JSON.parse(intakeJson);
      if (intake.lastUpdatedDate !== today) {
        intake.current = 0;
        intake.lastUpdatedDate = today;
      }
    } else {
      intake = { ...defaultIntake };
    }
  } catch (error) {
    console.error(`Error reading '${WATER_INTAKE_KEY}' from localStorage:`, error);
    intake = { ...defaultIntake };
  }
  intake.goal = goal;
  try { localStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(intake)); }
  catch (e) { console.error("Error saving initial water intake", e); }
  return intake;
}

export function addWater(amountInUnits: number = 1, profileGoal?: number): WaterIntakeData {
  const intake = getWaterIntake(profileGoal);
  const safeGoal = intake.goal > 0 ? intake.goal : DEFAULT_DAILY_WATER_GOAL_GLASSES;
  intake.current = Math.max(0, Math.min(intake.current + amountInUnits, safeGoal * 3));
  try {
    localStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(intake));
  } catch (error) {
    console.error(`Error writing '${WATER_INTAKE_KEY}' to localStorage:`, error);
  }
  return intake;
}

// Utility getters
export function getTodaysMealLogs(): MealEntry[] {
  const allLogs = getMealLogs();
  const todayISO = new Date().toISOString().split('T')[0];
  return allLogs.filter(log => log.date && log.date.startsWith(todayISO));
}

export function getRecentMealLogs(days: number = 7): MealEntry[] {
  const allLogs = getMealLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return allLogs.filter(log => log.date && new Date(log.date) >= cutoffDate);
}

// Weight Entries
export function getWeightEntries(): WeightEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const entriesJson = localStorage.getItem(WEIGHT_ENTRIES_KEY);
    return entriesJson ? JSON.parse(entriesJson) : [];
  } catch (error) {
    console.error(`Error reading '${WEIGHT_ENTRIES_KEY}' from localStorage:`, error);
    return [];
  }
}

export function addWeightEntry(weight: number, unit: 'kg' | 'lbs'): WeightEntry {
  const newEntry: WeightEntry = {
    date: new Date().toISOString(),
    weight,
    unit,
  };
  if (typeof window === 'undefined') {
    console.warn("localStorage not available, weight entry not saved:", newEntry);
    return newEntry;
  }
  const entries = getWeightEntries();
  entries.push(newEntry);
  try {
    localStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error(`Error writing '${WEIGHT_ENTRIES_KEY}' to localStorage:`, error);
  }
  return newEntry;
}


// General LocalStorage clear for testing or full data removal
export function clearAllNonAuthLocalStorage(): void {
  if (typeof window === 'undefined') return;
  const keysToKeep = []; // Add any keys here you DON'T want to clear
  const keysToRemove = [
    MEAL_LOGS_KEY,
    SELECTED_PLAN_KEY,
    AI_SCAN_USAGE_KEY,
    // USER_PROFILE_KEY, // Managed by Supabase
    WATER_INTAKE_KEY,
    // ONBOARDING_COMPLETE_KEY, // Managed by Supabase
    // USER_LOGGED_IN_KEY, // Managed by Supabase session
    GENERATED_MEAL_PLAN_OUTPUT_KEY,
    MEAL_PLAN_KEY,
    WEIGHT_ENTRIES_KEY,
    'ecoAi_onboardingTempData',
  ];
  keysToRemove.forEach(key => {
    if (!keysToKeep.includes(key)) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing '${key}' from localStorage:`, error);
      }
    }
  });
  console.log("Attempted to clear app-specific (non-auth) localStorage data.");
}
