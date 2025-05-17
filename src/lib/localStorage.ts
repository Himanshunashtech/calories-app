
import type { MealEntry, UserPlan, AIScanUsage, UserProfile, OnboardingData, WaterIntakeData, ReminderSettings, MealCategory, AppSettings } from '@/types';
import { ALLERGY_OPTIONS } from '@/types'; // Import ALLERGY_OPTIONS

const MEAL_LOGS_KEY = 'ecoAiCalorieTracker_mealLogs';
const SELECTED_PLAN_KEY = 'selectedPlan';
const AI_SCAN_USAGE_KEY = 'ecoAi_aiScanUsage';
const USER_PROFILE_KEY = 'userProfile';
const WATER_INTAKE_KEY = 'ecoAi_waterIntake';
const ONBOARDING_COMPLETE_KEY = 'onboardingComplete';
const USER_LOGGED_IN_KEY = 'userLoggedIn';
const GENERATED_MEAL_PLAN_OUTPUT_KEY = 'generatedMealPlanOutput';
const MEAL_PLAN_KEY = 'mealPlan';


// Meal Logs
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
    const newEntryStub: MealEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 15),
      date: new Date().toISOString(),
      category: entry.category || undefined,
    };
    console.warn("localStorage not available, meal log not saved:", newEntryStub);
    return newEntryStub;
  }
  const logs = getMealLogs();
  const newEntry: MealEntry = {
    ...entry,
    id: Math.random().toString(36).substring(2, 15),
    date: new Date().toISOString(),
    category: entry.category, // category should be passed
  };
  logs.push(newEntry);
  try {
    localStorage.setItem(MEAL_LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Error saving meal log to localStorage:", error);
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
      console.error("Error updating meal log mood in localStorage:", error);
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
    console.error("Error clearing meal logs from localStorage:", error);
  }
}

// User Plan
export function getSelectedPlan(): UserPlan {
  if (typeof window === 'undefined') return 'free';
  const plan = localStorage.getItem(SELECTED_PLAN_KEY) as UserPlan | null;
  return plan || 'free';
}

export function setSelectedPlan(plan: UserPlan): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTED_PLAN_KEY, plan);
}

// AI Scan Usage for Free Tier
const FREE_TIER_SCAN_LIMIT = 3; 

export function getAIScanUsage(): AIScanUsage {
  if (typeof window === 'undefined') {
    return { count: 0, limit: FREE_TIER_SCAN_LIMIT, lastResetMonth: new Date().getMonth() };
  }
  const usageJson = localStorage.getItem(AI_SCAN_USAGE_KEY);
  let usage: AIScanUsage;
  if (usageJson) {
    usage = JSON.parse(usageJson);
  } else {
    usage = { count: 0, limit: FREE_TIER_SCAN_LIMIT, lastResetMonth: new Date().getMonth() };
  }

  const currentMonth = new Date().getMonth();
  if (usage.lastResetMonth !== currentMonth) {
    usage.count = 0;
    usage.lastResetMonth = currentMonth;
    localStorage.setItem(AI_SCAN_USAGE_KEY, JSON.stringify(usage));
  }
  usage.limit = FREE_TIER_SCAN_LIMIT; 
  return usage;
}

export function incrementAIScanCount(): void {
  if (typeof window === 'undefined') return;
  const usage = getAIScanUsage();
  usage.count += 1;
  localStorage.setItem(AI_SCAN_USAGE_KEY, JSON.stringify(usage));
}

export function canUseAIScan(plan: UserPlan): boolean {
  if (plan === 'pro' || plan === 'ecopro') {
    return true;
  }
  if (typeof window === 'undefined') return false;
  const usage = getAIScanUsage();
  return usage.count < usage.limit;
}

// User Profile Data
const defaultReminderSettings: ReminderSettings = {
  mealRemindersEnabled: true,
  breakfastTime: '08:00',
  lunchTime: '12:30',
  dinnerTime: '18:30',
  waterReminderEnabled: false,
  waterReminderInterval: 60,
  snoozeDuration: 5,
};

const defaultAppSettings: AppSettings = {
  darkModeEnabled: false,
  unitPreferences: {
    weight: 'kg',
    height: 'cm',
    volume: 'ml',
  },
  hideNonCompliantRecipes: false,
};

export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const profileJson = localStorage.getItem(USER_PROFILE_KEY);
    if (profileJson) {
      // Ensure existing profile has all fields with defaults if missing
      const parsedProfile = JSON.parse(profileJson) as Partial<UserProfile>;
      const completeProfile: UserProfile = {
        name: parsedProfile.name || '',
        age: parsedProfile.age || '',
        gender: parsedProfile.gender || '',
        height: parsedProfile.height || '',
        heightUnit: parsedProfile.heightUnit || 'cm',
        weight: parsedProfile.weight || '',
        weightUnit: parsedProfile.weightUnit || 'kg',
        activityLevel: parsedProfile.activityLevel || '',
        healthGoals: parsedProfile.healthGoals || [],
        alsoTrackSustainability: parsedProfile.alsoTrackSustainability || false,
        exerciseFrequency: parsedProfile.exerciseFrequency || '',
        dietType: parsedProfile.dietType || '',
        dietaryRestrictions: Array.isArray(parsedProfile.dietaryRestrictions) ? parsedProfile.dietaryRestrictions : (parsedProfile.dietaryRestrictions ? [String(parsedProfile.dietaryRestrictions)] : []),
        favoriteCuisines: parsedProfile.favoriteCuisines || '',
        dislikedIngredients: parsedProfile.dislikedIngredients || '',
        enableCarbonTracking: parsedProfile.enableCarbonTracking === undefined ? false : parsedProfile.enableCarbonTracking,
        sleepHours: parsedProfile.sleepHours || '',
        stressLevel: parsedProfile.stressLevel || '',
        waterGoal: parsedProfile.waterGoal || 8,
        macroSplit: parsedProfile.macroSplit || { carbs: 50, protein: 25, fat: 25},
        email: parsedProfile.email || '',
        phone: parsedProfile.phone || '',
        profileImageUri: parsedProfile.profileImageUri || null,
        reminderSettings: {
          ...defaultReminderSettings,
          ...(parsedProfile.reminderSettings || {}),
        },
        appSettings: {
          ...defaultAppSettings,
          ...(parsedProfile.appSettings || {}),
          unitPreferences: {
            ...defaultAppSettings.unitPreferences!,
            ...(parsedProfile.appSettings?.unitPreferences || {}),
          }
        },
      };
      return completeProfile;
    }
    return null; // No profile exists
  } catch (error) {
    console.error("Error reading user profile from localStorage:", error);
    return null; // Return null on error or if no profile
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Error saving user profile to localStorage:", error);
  }
}

// Water Intake
const DEFAULT_DAILY_WATER_GOAL_GLASSES = 8; 

export function getWaterIntake(): WaterIntakeData {
  if (typeof window === 'undefined') {
    const profile = getUserProfile();
    return { current: 0, goal: profile?.waterGoal || DEFAULT_DAILY_WATER_GOAL_GLASSES, lastUpdatedDate: new Date().toISOString().split('T')[0] };
  }
  const intakeJson = localStorage.getItem(WATER_INTAKE_KEY);
  const today = new Date().toISOString().split('T')[0];
  let intake: WaterIntakeData;
  const profile = getUserProfile();
  const goalFromProfile = profile?.waterGoal || DEFAULT_DAILY_WATER_GOAL_GLASSES;


  if (intakeJson) {
    intake = JSON.parse(intakeJson);
    if (intake.lastUpdatedDate !== today) {
      intake.current = 0;
      intake.lastUpdatedDate = today;
    }
  } else {
    intake = { current: 0, goal: goalFromProfile, lastUpdatedDate: today };
  }
  intake.goal = goalFromProfile; 
  saveWaterIntake(intake); 
  return intake;
}

export function saveWaterIntake(intake: WaterIntakeData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(intake));
  } catch (error) {
    console.error("Error saving water intake to localStorage:", error);
  }
}

export function addWater(amountInGlasses: number = 1): WaterIntakeData {
  const intake = getWaterIntake();
  intake.current = Math.max(0, Math.min(intake.current + amountInGlasses, intake.goal * 3)); 
  saveWaterIntake(intake);
  return intake;
}

export function getTodaysMealLogs(): MealEntry[] {
  if (typeof window === 'undefined') return [];
  const allLogs = getMealLogs();
  const todayISO = new Date().toISOString().split('T')[0];
  return allLogs.filter(log => log.date.startsWith(todayISO));
}

export function getRecentMealLogs(days: number = 7): MealEntry[] {
  if (typeof window === 'undefined') return [];
  const allLogs = getMealLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return allLogs.filter(log => new Date(log.date) >= cutoffDate);
}

export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
}

export function fakeLogin(email: string): void {
    if (typeof window === 'undefined') return;
    let profile = getUserProfile();
    
    if (profile) {
        // Profile from onboarding exists, update its email
        profile = { ...profile, email: email };
    } else {
        // No profile from onboarding (edge case), create a new minimal one
        console.warn("fakeLogin: No existing profile found from onboarding. Creating a new minimal profile.");
        profile = { 
            email: email, 
            name: 'New User', // Default name
            age: '', gender: '', height: '', heightUnit: 'cm', weight: '', weightUnit: 'kg',
            activityLevel: '', healthGoals: [], alsoTrackSustainability: false, exerciseFrequency: '', dietaryRestrictions: [],
            dietType: '', favoriteCuisines: '', dislikedIngredients: '', enableCarbonTracking: false,
            sleepHours: '', stressLevel: '', waterGoal: 8, macroSplit: { carbs: 50, protein: 25, fat: 25}, 
            phone: '', profileImageUri: null,
            reminderSettings: { ...defaultReminderSettings },
            appSettings: { ...defaultAppSettings, unitPreferences: {...defaultAppSettings.unitPreferences!} }
        };
    }
    saveUserProfile(profile);
    localStorage.setItem(USER_LOGGED_IN_KEY, 'true');
    // Ensure onboarding is marked complete, as this step follows plan selection
    if (!isOnboardingComplete()) {
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    }
}

export function fakeSignup(email: string, name: string): void {
    if (typeof window === 'undefined') return;
    // Create a new profile. If user goes through onboarding later, this will be updated.
    const newProfile: UserProfile = { 
        email: email, 
        name: name, 
        age: '', gender: '', height: '', heightUnit: 'cm', weight: '', weightUnit: 'kg',
        activityLevel: '', healthGoals: [], alsoTrackSustainability: false, exerciseFrequency: '', dietaryRestrictions: [],
        dietType: '', favoriteCuisines: '', dislikedIngredients: '', enableCarbonTracking: false,
        sleepHours: '', stressLevel: '', waterGoal: 8, macroSplit: { carbs: 50, protein: 25, fat: 25}, 
        phone: '', profileImageUri: null,
        reminderSettings: { ...defaultReminderSettings },
        appSettings: { ...defaultAppSettings, unitPreferences: {...defaultAppSettings.unitPreferences!} }
    };
    saveUserProfile(newProfile);
    localStorage.setItem(USER_LOGGED_IN_KEY, 'true');
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'false'); // User signed up directly, needs onboarding
}


export function fakeLogout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_LOGGED_IN_KEY);
}

export function isUserLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(USER_LOGGED_IN_KEY) === 'true';
}

export function clearAllUserData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MEAL_LOGS_KEY);
    localStorage.removeItem(SELECTED_PLAN_KEY);
    localStorage.removeItem(AI_SCAN_USAGE_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(WATER_INTAKE_KEY);
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    localStorage.removeItem(USER_LOGGED_IN_KEY);
    localStorage.removeItem(GENERATED_MEAL_PLAN_OUTPUT_KEY);
    localStorage.removeItem(MEAL_PLAN_KEY);
    console.log("All user data cleared from localStorage.");
  } catch (error) {
    console.error("Error clearing all user data from localStorage:", error);
  }
}
