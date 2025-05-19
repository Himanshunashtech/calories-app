
import type { MealEntry, UserPlan, AIScanUsage, WaterIntakeData, WeightEntry, UserProfile } from '@/types';
import type { GenerateEcoMealPlanOutput } from '@/ai/flows/generate-eco-meal-plan';

// LocalStorage Keys
const MEAL_LOGS_KEY = 'ecoAiCalorieTracker_mealLogs';
const AI_SCAN_USAGE_KEY = 'ecoAi_aiScanUsage';
const WATER_INTAKE_KEY = 'ecoAi_waterIntake';
const WEIGHT_ENTRIES_KEY = 'ecoAi_weightEntries';
const GENERATED_MEAL_PLAN_OUTPUT_KEY = 'ecoAi_generatedMealPlanOutput_v2';
const WEEKLY_MEAL_PLAN_KEY = 'ecoAi_weeklyMealPlan_v2';
const TEMP_ONBOARDING_DATA_KEY = 'ecoAi_onboardingTempData';

// User Profile (this is now primarily handled by Supabase, but defaults are useful for initial state)
export const defaultUserProfileData: UserProfile = {
  id: '', // Will be set by Supabase auth
  email: '',
  name: '',
  age: '',
  gender: '',
  height: '',
  height_unit: 'cm',
  weight: '',
  weight_unit: 'kg',
  activity_level: 'moderate',
  health_goals: [],
  also_track_sustainability: false,
  exercise_frequency: '1-2',
  diet_type: 'none',
  dietary_restrictions: [],
  dietary_restrictions_other: '',
  favorite_cuisines: '',
  disliked_ingredients: '',
  enable_carbon_tracking: false,
  sleep_hours: '7-8',
  stress_level: 'moderate',
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

// Temporary Onboarding Data (to pass data from social signup to onboarding if needed)
export function getLocalOnboardingData(): Partial<UserProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(TEMP_ONBOARDING_DATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error(`Error reading '${TEMP_ONBOARDING_DATA_KEY}' from localStorage:`, error);
    return {};
  }
}

export function saveLocalOnboardingData(data: Partial<UserProfile>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEMP_ONBOARDING_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing '${TEMP_ONBOARDING_DATA_KEY}' to localStorage:`, error);
  }
}

export function clearLocalOnboardingData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TEMP_ONBOARDING_DATA_KEY);
    // console.log("Cleared temporary local onboarding data.");
  } catch (error) {
    console.error(`Error removing '${TEMP_ONBOARDING_DATA_KEY}' from localStorage:`, error);
  }
}


// Function to clear all user-specific data from localStorage.
// Called on logout or account deletion.
export function clearAllLocalUserData(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove = [
    MEAL_LOGS_KEY,
    AI_SCAN_USAGE_KEY,
    WATER_INTAKE_KEY,
    WEIGHT_ENTRIES_KEY,
    GENERATED_MEAL_PLAN_OUTPUT_KEY,
    WEEKLY_MEAL_PLAN_KEY,
    TEMP_ONBOARDING_DATA_KEY,
    // Add any other app-specific keys here
  ];
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing '${key}' from localStorage:`, error);
    }
  });
  console.log("Cleared app-specific localStorage data.");
}


// Selected Plan (primarily for use before profile is fully synced or for UI hints)
export function getSelectedPlan(): UserPlan {
  if (typeof window === 'undefined') return 'free';
  try {
    const plan = localStorage.getItem('ecoAi_selectedPlan_v2') as UserPlan | null;
    return plan || 'free';
  } catch (error) {
    console.error('Error getting selected plan from LS:', error);
    return 'free';
  }
}

export function setSelectedPlan(plan: UserPlan): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('ecoAi_selectedPlan_v2', plan);
  } catch (error) {
    console.error('Error setting selected plan in LS:', error);
  }
}


// Meal Logs (To be migrated to Supabase)
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

export function addMealLog(entry: Omit<MealEntry, 'id' | 'date' | 'user_id' | 'created_at'>): MealEntry {
  const newEntry: MealEntry = {
    ...entry,
    id: Math.random().toString(36).substring(2, 15), // Temporary client-side ID
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

// AI Scan Usage (Consider moving to Supabase with user profile or a separate table)
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

// Water Intake (To be migrated to Supabase)
const DEFAULT_DAILY_WATER_GOAL_GLASSES = 8;
export function getWaterIntake(): WaterIntakeData {
  const today = new Date().toISOString().split('T')[0];
  // This should eventually get the goal from the user's Supabase profile
  const goal = DEFAULT_DAILY_WATER_GOAL_GLASSES; // Placeholder
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
  intake.goal = goal; // Use default or profile goal
  try { localStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(intake)); }
  catch (e) { console.error("Error saving initial water intake", e); }
  return intake;
}

export function addWater(amountInUnits: number = 1): WaterIntakeData {
  if (typeof window === 'undefined') return { current: 0, goal: DEFAULT_DAILY_WATER_GOAL_GLASSES, lastUpdatedDate: new Date().toISOString().split('T')[0] };
  const intake = getWaterIntake();
  const safeGoal = intake.goal > 0 ? intake.goal : DEFAULT_DAILY_WATER_GOAL_GLASSES;
  intake.current = Math.max(0, Math.min(intake.current + amountInUnits, safeGoal * 3)); // Cap at 3x goal to prevent absurd values
  try {
    localStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(intake));
  } catch (error) {
    console.error(`Error writing '${WATER_INTAKE_KEY}' to localStorage:`, error);
  }
  return intake;
}

// Utility getters for localStorage based data
export function getTodaysMealLogs(): MealEntry[] {
  if (typeof window === 'undefined') return [];
  const allLogs = getMealLogs();
  const todayISO = new Date().toISOString().split('T')[0];
  return allLogs.filter(log => log.date && log.date.startsWith(todayISO));
}

export function getRecentMealLogs(days: number = 7): MealEntry[] {
  if (typeof window === 'undefined') return [];
  const allLogs = getMealLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return allLogs.filter(log => log.date && new Date(log.date) >= cutoffDate);
}

// Weight Entries (To be migrated to Supabase)
export function getWeightEntries(): WeightEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const entriesJson = localStorage.getItem(WEIGHT_ENTRIES_KEY);
    return entriesJson ? JSON.parse(entriesJson).sort((a: WeightEntry, b: WeightEntry) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];
  } catch (error) {
    console.error(`Error reading '${WEIGHT_ENTRIES_KEY}' from localStorage:`, error);
    return [];
  }
}

export function addWeightEntry(weight: number, unit: 'kg' | 'lbs'): WeightEntry {
  const newEntry: WeightEntry = {
    id: Math.random().toString(36).substring(2, 15), // Client-gen ID
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

export function saveGeneratedMealPlanOutput(output: GenerateEcoMealPlanOutput): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GENERATED_MEAL_PLAN_OUTPUT_KEY, JSON.stringify(output));
  } catch (error) {
    console.error(`Error writing '${GENERATED_MEAL_PLAN_OUTPUT_KEY}' to localStorage:`, error);
  }
}

export function getGeneratedMealPlanOutput(): GenerateEcoMealPlanOutput | null {
  if (typeof window === 'undefined') return null;
  try {
    const outputJson = localStorage.getItem(GENERATED_MEAL_PLAN_OUTPUT_KEY);
    return outputJson ? JSON.parse(outputJson) : null;
  } catch (error) {
    console.error(`Error reading '${GENERATED_MEAL_PLAN_OUTPUT_KEY}' from localStorage:`, error);
    return null;
  }
}

export function saveWeeklyMealPlan(plan: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WEEKLY_MEAL_PLAN_KEY, JSON.stringify(plan));
  } catch (error) {
    console.error(`Error writing '${WEEKLY_MEAL_PLAN_KEY}' to localStorage:`, error);
  }
}

export function getWeeklyMealPlan(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const planJson = localStorage.getItem(WEEKLY_MEAL_PLAN_KEY);
    return planJson ? JSON.parse(planJson) : null;
  } catch (error) {
    console.error(`Error reading '${WEEKLY_MEAL_PLAN_KEY}' from localStorage:`, error);
    return null;
  }
}
