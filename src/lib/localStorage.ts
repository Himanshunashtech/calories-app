import type { MealEntry, UserPlan, AIScanUsage, WaterIntakeData, WeightEntry, UserProfile } from '@/types';
import type { GenerateEcoMealPlanOutput } from '@/ai/flows/generate-eco-meal-plan';

// Keys for data not yet migrated to Supabase or for purely local settings
const MEAL_LOGS_KEY = 'ecoAiCalorieTracker_mealLogs'; // Will be migrated to Supabase
const AI_SCAN_USAGE_KEY = 'ecoAi_aiScanUsage'; // Might be managed differently with backend logic
const WATER_INTAKE_KEY = 'ecoAi_waterIntake'; // Will be migrated
const WEIGHT_ENTRIES_KEY = 'ecoAi_weightEntries'; // Will be migrated
const GENERATED_MEAL_PLAN_OUTPUT_KEY = 'ecoAi_generatedMealPlanOutput'; // Temporary local cache
const MEAL_PLAN_KEY = 'ecoAi_weeklyMealPlan'; // Temporary local cache for user's manual plan
const TEMP_ONBOARDING_DATA_KEY = 'ecoAi_onboardingTempData'; // For pre-filling onboarding after social signup

// --- User Profile & Auth ---
// These are now primarily handled by Supabase.
// Local flags might be used for quick client-side checks but session truth comes from Supabase.

export const defaultUserProfileData: UserProfile = {
  id: '', // Will be set by Supabase
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

// Temporary Onboarding Data (to pass data from signup to onboarding)
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
  } catch (error) {
    console.error(`Error removing '${TEMP_ONBOARDING_DATA_KEY}' from localStorage:`, error);
  }
}


// --- Data still managed by localStorage (to be migrated) ---

// Selected Plan (might be redundant if profile.selected_plan from Supabase is source of truth)
export function getSelectedPlan(): UserPlan {
  if (typeof window === 'undefined') return 'free';
  // This should ideally come from the fetched Supabase user profile
  // For now, keeping local as a fallback or for pre-auth state
  try {
    const plan = localStorage.getItem('ecoAi_selectedPlan_v2') as UserPlan | null; // Use a new key if old one exists
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
  intake.goal = goal;
  try { localStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(intake)); }
  catch (e) { console.error("Error saving initial water intake", e); }
  return intake;
}

export function addWater(amountInUnits: number = 1): WaterIntakeData {
  if (typeof window === 'undefined') return { current: 0, goal: DEFAULT_DAILY_WATER_GOAL_GLASSES, lastUpdatedDate: new Date().toISOString().split('T')[0] };
  const intake = getWaterIntake();
  const safeGoal = intake.goal > 0 ? intake.goal : DEFAULT_DAILY_WATER_GOAL_GLASSES;
  intake.current = Math.max(0, Math.min(intake.current + amountInUnits, safeGoal * 3));
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

// Weight Entries
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
    id: Math.random().toString(36).substring(2, 15),
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

// For saving and retrieving the AI-generated meal plan output locally
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

// For saving and retrieving the user's manually edited weekly meal plan locally
export function saveWeeklyMealPlan(plan: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(plan));
  } catch (error) {
    console.error(`Error writing '${MEAL_PLAN_KEY}' to localStorage:`, error);
  }
}

export function getWeeklyMealPlan(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const planJson = localStorage.getItem(MEAL_PLAN_KEY);
    return planJson ? JSON.parse(planJson) : null;
  } catch (error) {
    console.error(`Error reading '${MEAL_PLAN_KEY}' from localStorage:`, error);
    return null;
  }
}

// General LocalStorage clear, useful for testing or full data removal
export function clearAllUserData(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove = [
    MEAL_LOGS_KEY,
    'ecoAi_selectedPlan_v2', // Updated key
    AI_SCAN_USAGE_KEY,
    // USER_PROFILE_KEY, // This is now handled by Supabase logout essentially
    WATER_INTAKE_KEY,
    // ONBOARDING_COMPLETE_KEY, // Handled by Supabase profile
    // USER_LOGGED_IN_KEY, // Handled by Supabase session
    GENERATED_MEAL_PLAN_OUTPUT_KEY,
    MEAL_PLAN_KEY,
    WEIGHT_ENTRIES_KEY,
    TEMP_ONBOARDING_DATA_KEY,
  ];
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing '${key}' from localStorage:`, error);
    }
  });
  console.log("Cleared app-specific localStorage data (excluding Supabase session).");
}
