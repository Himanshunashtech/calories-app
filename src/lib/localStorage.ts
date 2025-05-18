
import type { MealEntry, UserPlan, AIScanUsage, UserProfile, WaterIntakeData, ReminderSettings, MealCategory, AppSettings, WeightEntry, OnboardingData } from '@/types';

const USER_PROFILE_KEY = 'ecoAi_userProfile';
const ONBOARDING_COMPLETE_KEY = 'ecoAi_onboardingComplete';
const USER_LOGGED_IN_KEY = 'ecoAi_userLoggedIn'; // Simple flag for session

const MEAL_LOGS_KEY = 'ecoAiCalorieTracker_mealLogs';
const SELECTED_PLAN_KEY = 'ecoAi_selectedPlan';
const AI_SCAN_USAGE_KEY = 'ecoAi_aiScanUsage';
const WATER_INTAKE_KEY = 'ecoAi_waterIntake';
const GENERATED_MEAL_PLAN_OUTPUT_KEY = 'ecoAi_generatedMealPlanOutput';
const MEAL_PLAN_KEY = 'ecoAi_mealPlan';
const WEIGHT_ENTRIES_KEY = 'ecoAi_weightEntries';
const TEMP_ONBOARDING_DATA_KEY = 'ecoAi_onboardingTempData';


export const defaultUserProfileData: UserProfile = {
  id: Math.random().toString(36).substring(2, 15), // Simple client-side ID
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

// User Profile
export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') return { ...defaultUserProfileData };
  try {
    const profileJson = localStorage.getItem(USER_PROFILE_KEY);
    if (profileJson) {
      const parsedProfile = JSON.parse(profileJson);
      // Ensure all default fields exist
      return { ...defaultUserProfileData, ...parsedProfile };
    }
    // If no profile, save a default one
    saveUserProfile({ ...defaultUserProfileData });
    return { ...defaultUserProfileData };
  } catch (error) {
    console.error(`Error reading '${USER_PROFILE_KEY}' from localStorage:`, error);
    return { ...defaultUserProfileData };
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error(`Error writing '${USER_PROFILE_KEY}' to localStorage:`, error);
  }
}

// Onboarding Status
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

// Login Status
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
  if (typeof window === 'undefined') return { ...defaultUserProfileData, email };
  let profile = getUserProfile();
  
  // If current profile's email is different, or no email, update it.
  // This simulates finding or associating the profile with this email.
  if (profile.email !== email || !profile.email) {
    profile.email = email;
  }
  // If onboarding was completed with a temp profile (no email),
  // this login finalizes it with an email.
  if (!profile.id) { // ensure ID if somehow missing
      profile.id = Math.random().toString(36).substring(2, 15);
  }

  saveUserProfile(profile);
  try {
    localStorage.setItem(USER_LOGGED_IN_KEY, 'true');
  } catch (error) {
    console.error(`Error writing '${USER_LOGGED_IN_KEY}' to localStorage:`, error);
  }
  return profile;
}

export function fakeSignup(email: string, name: string): UserProfile {
   if (typeof window === 'undefined') {
    return { ...defaultUserProfileData, email, name, onboarding_complete: false };
  }
  // For signup, we create a new default profile but set the email and name.
  // Onboarding is considered incomplete.
  const newProfile: UserProfile = {
    ...defaultUserProfileData,
    id: Math.random().toString(36).substring(2, 15),
    email: email,
    name: name,
    onboarding_complete: false, // Explicitly false for new signups
  };
  saveUserProfile(newProfile);
  setOnboardingComplete(false); // Ensure this is also set
  try {
    localStorage.setItem(USER_LOGGED_IN_KEY, 'true');
  } catch (error) {
    console.error(`Error writing '${USER_LOGGED_IN_KEY}' to localStorage:`, error);
  }
  return newProfile;
}

export function fakeLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_LOGGED_IN_KEY);
    // Optional: Do NOT clear USER_PROFILE_KEY on logout, so data persists if they log back in.
    // If you want to clear profile on logout: localStorage.removeItem(USER_PROFILE_KEY);
    // Do NOT clear ONBOARDING_COMPLETE_KEY, as that's tied to the profile data.
  } catch (error) {
    console.error(`Error during logout from localStorage:`, error);
  }
}


// Temporary Onboarding Data (used by onboarding flow before final "login/account setup")
export function getLocalOnboardingData(): OnboardingData {
  if (typeof window === 'undefined') return { ...defaultUserProfileData }; // Use UserProfile structure as base
  try {
    const data = localStorage.getItem(TEMP_ONBOARDING_DATA_KEY);
    if (data) {
      return { ...defaultUserProfileData, ...JSON.parse(data) };
    }
    return { ...defaultUserProfileData }; // Ensure all fields from UserProfile are present
  } catch (error) {
    console.error(`Error reading '${TEMP_ONBOARDING_DATA_KEY}' from localStorage:`, error);
    return { ...defaultUserProfileData };
  }
}

export function saveLocalOnboardingData(data: OnboardingData): void {
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

export function checkEmailExists(email: string): boolean {
  if (typeof window === 'undefined') return false;
  const profile = getUserProfile(); // In localStorage, there's effectively one "main" profile
  return !!profile.email && profile.email.toLowerCase() === email.toLowerCase();
}


// --- Other app data using localStorage ---

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

// User Plan
export function getSelectedPlan(): UserPlan {
  if (typeof window === 'undefined') return 'free';
  // Try to get from profile first, then fallback to direct localStorage item
  const profile = getUserProfile();
  if (profile.selected_plan) return profile.selected_plan;

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
  // Save to profile AND direct localStorage item for robustness during transition
  const profile = getUserProfile();
  profile.selected_plan = plan;
  saveUserProfile(profile);
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
export function getWaterIntake(): WaterIntakeData { // Removed profileGoal param as it's on profile
  const today = new Date().toISOString().split('T')[0];
  const profile = getUserProfile();
  const goal = profile.water_goal || DEFAULT_DAILY_WATER_GOAL_GLASSES;
  const defaultIntake = { current: 0, goal, lastUpdatedDate: today };

  if (typeof window === 'undefined') return defaultIntake;
  let intake: WaterIntakeData;
  try {
    const intakeJson = localStorage.getItem(WATER_INTAKE_KEY);
    if (intakeJson) {
      intake = JSON.parse(intakeJson);
      if (intake.lastUpdatedDate !== today) { // Reset if date changed
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
  intake.goal = goal; // Ensure goal matches profile
  try { localStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(intake)); }
  catch (e) { console.error("Error saving initial water intake", e); }
  return intake;
}

export function addWater(amountInUnits: number = 1): WaterIntakeData { // Removed profileGoal param
  const intake = getWaterIntake();
  const safeGoal = intake.goal > 0 ? intake.goal : DEFAULT_DAILY_WATER_GOAL_GLASSES;
  intake.current = Math.max(0, Math.min(intake.current + amountInUnits, safeGoal * 3)); // Allow up to 3x goal
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
    return entriesJson ? JSON.parse(entriesJson).sort((a: WeightEntry, b: WeightEntry) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];
  } catch (error) {
    console.error(`Error reading '${WEIGHT_ENTRIES_KEY}' from localStorage:`, error);
    return [];
  }
}

export function addWeightEntry(weight: number, unit: 'kg' | 'lbs'): WeightEntry {
  const newEntry: WeightEntry = {
    id: Math.random().toString(36).substring(2, 15), // Add client-side ID
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
export function clearAllUserData(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove = [
    MEAL_LOGS_KEY,
    SELECTED_PLAN_KEY,
    AI_SCAN_USAGE_KEY,
    USER_PROFILE_KEY,
    WATER_INTAKE_KEY,
    ONBOARDING_COMPLETE_KEY,
    USER_LOGGED_IN_KEY,
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
  console.log("Cleared all app-specific localStorage data.");
}
