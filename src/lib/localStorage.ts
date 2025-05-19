
import type { MealEntry, UserPlan, AIScanUsage, WaterIntakeData, WeightEntry, UserProfile, AppSettings, ReminderSettings } from '@/types';
import type { GenerateEcoMealPlanOutput } from '@/ai/flows/generate-eco-meal-plan';

// LocalStorage Keys
const USER_PROFILE_KEY = 'ecoAiCalorieTracker_userProfile_v3'; // Incremented version
const SELECTED_PLAN_KEY = 'ecoAi_selectedPlan_v2';
const AI_SCAN_USAGE_KEY = 'ecoAi_aiScanUsage';
const WATER_INTAKE_KEY = 'ecoAi_waterIntake';
const WEIGHT_ENTRIES_KEY = 'ecoAi_weightEntries';
const ONBOARDING_COMPLETE_KEY = 'ecoAi_onboardingComplete_v2';
const USER_LOGGED_IN_KEY = 'ecoAi_userLoggedIn_v2';
const GENERATED_MEAL_PLAN_OUTPUT_KEY = 'ecoAi_generatedMealPlanOutput_v2';
const WEEKLY_MEAL_PLAN_KEY = 'ecoAi_weeklyMealPlan_v2';
const MEAL_LOGS_KEY = 'ecoAiCalorieTracker_mealLogs_v2';
const TEMP_ONBOARDING_DATA_KEY = 'ecoAi_onboardingTempData_v2';

export const defaultUserProfileData: UserProfile = {
  id: '', // Will be set client-side if new
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
  macroSplit: { carbs: 50, protein: 25, fat: 25 },
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

export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') return { ...defaultUserProfileData };
  try {
    const profileJson = localStorage.getItem(USER_PROFILE_KEY);
    if (profileJson) {
      const storedProfile = JSON.parse(profileJson);
      // Deep merge with defaults to ensure all properties are present
      return {
        ...defaultUserProfileData,
        ...storedProfile,
        id: storedProfile.id || defaultUserProfileData.id || Math.random().toString(36).substring(2, 15), // Ensure ID
        reminderSettings: {
          ...(defaultUserProfileData.reminderSettings || {}),
          ...(storedProfile.reminderSettings || {}),
        },
        appSettings: {
          ...(defaultUserProfileData.appSettings || {}),
          ...(storedProfile.appSettings || {}),
          unitPreferences: {
            ...(defaultUserProfileData.appSettings?.unitPreferences || {}),
            ...(storedProfile.appSettings?.unitPreferences || {}),
          }
        },
        macroSplit: {
            ...(defaultUserProfileData.macroSplit || { carbs: 50, protein: 25, fat: 25 }),
            ...(storedProfile.macroSplit || {}),
        },
      };
    }
    // If no profile, return default with a new generated ID
    return { ...defaultUserProfileData, id: Math.random().toString(36).substring(2, 15) };
  } catch (error) {
    console.error(`Error reading '${USER_PROFILE_KEY}' from localStorage:`, error);
    return { ...defaultUserProfileData, id: Math.random().toString(36).substring(2, 15) };
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const profileToSave = { ...profile };
    if (!profileToSave.id) { // Ensure an ID exists if it's a new profile being saved
        profileToSave.id = Math.random().toString(36).substring(2, 15);
    }
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileToSave));
  } catch (error) {
    console.error(`Error writing '${USER_PROFILE_KEY}' to localStorage:`, error);
  }
}

export function getSelectedPlan(): UserPlan {
  if (typeof window === 'undefined') return 'free';
  try {
    const plan = localStorage.getItem(SELECTED_PLAN_KEY) as UserPlan | null;
    return plan || 'free';
  } catch (error) {
    console.error('Error getting selected plan from LS:', error);
    return 'free';
  }
}

export function setSelectedPlan(plan: UserPlan): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SELECTED_PLAN_KEY, plan);
  } catch (error) {
    console.error('Error setting selected plan in LS:', error);
  }
}

export function getAIScanUsage(): AIScanUsage {
  const defaultUsage = { count: 0, limit: 3, lastResetMonth: new Date().getMonth() };
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

export function getWaterIntake(): WaterIntakeData {
  const today = new Date().toISOString().split('T')[0];
  const profile = getUserProfile(); // Get user's goal from their profile
  const goal = profile?.water_goal || defaultUserProfileData.water_goal || 8;
  const defaultIntake = { current: 0, goal, lastUpdatedDate: today };

  if (typeof window === 'undefined') return defaultIntake;
  let intake: WaterIntakeData;
  try {
    const intakeJson = localStorage.getItem(WATER_INTAKE_KEY);
    if (intakeJson) {
      intake = JSON.parse(intakeJson);
      if (intake.lastUpdatedDate !== today) {
        intake.current = 0; // Reset current for new day
        intake.lastUpdatedDate = today;
      }
      intake.goal = goal; // Always update with latest goal from profile
    } else {
      intake = { ...defaultIntake };
    }
    localStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(intake));
  } catch (error) {
    console.error(`Error managing '${WATER_INTAKE_KEY}' in localStorage:`, error);
    intake = { ...defaultIntake, goal }; // Ensure goal is set even on error
  }
  return intake;
}

export function addWater(amountInUnits: number = 1): WaterIntakeData {
  if (typeof window === 'undefined') {
    const profile = getUserProfile();
    return { current: amountInUnits, goal: profile.water_goal || 8, lastUpdatedDate: new Date().toISOString().split('T')[0] };
  }
  const intake = getWaterIntake(); // This already updates goal and resets if new day
  const safeGoal = intake.goal > 0 ? intake.goal : 8;
  intake.current = Math.max(0, Math.min(intake.current + amountInUnits, safeGoal * 3));
  try {
    localStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(intake));
  } catch (error) {
    console.error(`Error writing '${WATER_INTAKE_KEY}' to localStorage:`, error);
  }
  return intake;
}

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
    id: Math.random().toString(36).substring(2, 15),
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

export function getWeightEntries(): WeightEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const entriesJson = localStorage.getItem(WEIGHT_ENTRIES_KEY);
    const entries = entriesJson ? JSON.parse(entriesJson) : [];
    return entries.sort((a: WeightEntry, b: WeightEntry) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

export function saveGeneratedMealPlanOutput(output: GenerateEcoMealPlanOutput): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GENERATED_MEAL_PLAN_OUTPUT_KEY, JSON.stringify(output));
  } catch (error) {
    console.error(`Error writing '${GENERATED_MEAL_PLAN_OUTPUT_KEY}' to localStorage:`, error);
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

export function saveWeeklyMealPlan(plan: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WEEKLY_MEAL_PLAN_KEY, JSON.stringify(plan));
  } catch (error) {
    console.error(`Error writing '${WEEKLY_MEAL_PLAN_KEY}' to localStorage:`, error);
  }
}

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

export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
  } catch (error) {
    console.error(`Error reading '${ONBOARDING_COMPLETE_KEY}' from localStorage:`, error);
    return false;
  }
}

export function setOnboardingComplete(status: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, status.toString());
  } catch (error) {
    console.error(`Error writing '${ONBOARDING_COMPLETE_KEY}' to localStorage:`, error);
  }
}

export function isUserLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(USER_LOGGED_IN_KEY) === 'true';
  } catch (error) {
    console.error(`Error reading '${USER_LOGGED_IN_KEY}' from localStorage:`, error);
    return false;
  }
}

export function fakeLogin(email: string): UserProfile {
  if (typeof window === 'undefined') return {...defaultUserProfileData, email};
  let profile = getUserProfile(); // Get existing profile (could have onboarding data)
  profile.email = email; // Associate email
  
  try {
    localStorage.setItem(USER_LOGGED_IN_KEY, 'true');
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true'); // Finalize onboarding
    saveUserProfile(profile); // Save updated profile
  } catch (error) {
    console.error("Error during fakeLogin localStorage operations:", error);
  }
  return profile;
}

export function fakeSignup(email: string, name: string): UserProfile {
  if (typeof window === 'undefined') return {...defaultUserProfileData, email, name, onboarding_complete: false};
  const newProfile: UserProfile = {
    ...defaultUserProfileData,
    id: Math.random().toString(36).substring(2, 15), // Generate a new ID
    email: email,
    name: name,
    onboarding_complete: false, // Onboarding is NOT complete yet
  };
  try {
    saveUserProfile(newProfile);
    localStorage.setItem(USER_LOGGED_IN_KEY, 'true');
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'false');
  } catch (error) {
    console.error("Error during fakeSignup localStorage operations:", error);
  }
  return newProfile;
}

export function fakeLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_LOGGED_IN_KEY);
    // Optionally, keep ONBOARDING_COMPLETE_KEY and USER_PROFILE_KEY
    // if you want to prefill data on next login.
    // Or clear them for a full reset:
    // localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    // localStorage.removeItem(USER_PROFILE_KEY);
  } catch (error) {
    console.error("Error during fakeLogout localStorage operations:", error);
  }
}

export function checkEmailExists(email: string): boolean {
  if (typeof window === 'undefined' || !email) return false;
  const profile = getUserProfile();
  // In a real app, this would query a database. Here, we check the single stored profile.
  // If there's no profile yet (e.g. first run), profile.email would be '', so it's "new"
  return profile.email === email && email !== '';
}


export function clearAllLocalUserData(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove = [
    USER_PROFILE_KEY,
    SELECTED_PLAN_KEY,
    AI_SCAN_USAGE_KEY,
    WATER_INTAKE_KEY,
    WEIGHT_ENTRIES_KEY,
    ONBOARDING_COMPLETE_KEY,
    USER_LOGGED_IN_KEY,
    GENERATED_MEAL_PLAN_OUTPUT_KEY,
    WEEKLY_MEAL_PLAN_KEY,
    MEAL_LOGS_KEY,
    TEMP_ONBOARDING_DATA_KEY,
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

    