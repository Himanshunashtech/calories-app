
import type { MealEntry, UserPlan, AIScanUsage, UserProfile, OnboardingData, WaterIntakeData, ReminderSettings, MealCategory, AppSettings } from '@/types';
import { ALLERGY_OPTIONS } from '@/types';

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
    console.warn("localStorage not available, meal log not saved:", newEntry);
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

// AI Scan Usage for Free Tier
const FREE_TIER_SCAN_LIMIT = 3; 

export function getAIScanUsage(): AIScanUsage {
  const defaultUsage = { count: 0, limit: FREE_TIER_SCAN_LIMIT, lastResetMonth: new Date().getMonth() };
  if (typeof window === 'undefined') {
    return defaultUsage;
  }

  let usage: AIScanUsage;
  try {
    const usageJson = localStorage.getItem(AI_SCAN_USAGE_KEY);
    if (usageJson) {
      usage = JSON.parse(usageJson);
    } else {
      usage = { ...defaultUsage };
    }
  } catch (error) {
    console.error(`Error reading '${AI_SCAN_USAGE_KEY}' from localStorage:`, error);
    usage = { ...defaultUsage };
  }
  
  const currentMonth = new Date().getMonth();
  if (usage.lastResetMonth !== currentMonth) {
    usage.count = 0;
    usage.lastResetMonth = currentMonth;
    try {
      localStorage.setItem(AI_SCAN_USAGE_KEY, JSON.stringify(usage));
    } catch (error) {
      console.error(`Error resetting and writing '${AI_SCAN_USAGE_KEY}' to localStorage:`, error);
    }
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
    console.error(`Error incrementing and writing '${AI_SCAN_USAGE_KEY}' to localStorage:`, error);
  }
}

export function canUseAIScan(plan: UserPlan): boolean {
  if (plan === 'pro' || plan === 'ecopro') {
    return true;
  }
  
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

const defaultUserProfile: UserProfile = {
  name: '',
  age: '',
  gender: '',
  height: '',
  heightUnit: 'cm',
  weight: '',
  weightUnit: 'kg',
  activityLevel: '',
  healthGoals: [],
  alsoTrackSustainability: false,
  exerciseFrequency: '',
  dietType: '',
  dietaryRestrictions: [],
  favoriteCuisines: '',
  dislikedIngredients: '',
  enableCarbonTracking: false,
  sleepHours: '',
  stressLevel: '',
  waterGoal: 8,
  macroSplit: { carbs: 50, protein: 25, fat: 25},
  email: '',
  phone: '',
  profileImageUri: null,
  reminderSettings: { ...defaultReminderSettings },
  appSettings: { 
    ...defaultAppSettings, 
    unitPreferences: {...defaultAppSettings.unitPreferences!} 
  },
};

export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const profileJson = localStorage.getItem(USER_PROFILE_KEY);
    if (profileJson) {
      const parsedProfile = JSON.parse(profileJson) as Partial<UserProfile>;
      
      const completeProfile: UserProfile = {
        ...defaultUserProfile,
        ...parsedProfile,
        dietaryRestrictions: Array.isArray(parsedProfile.dietaryRestrictions) ? parsedProfile.dietaryRestrictions : (parsedProfile.dietaryRestrictions ? [String(parsedProfile.dietaryRestrictions)] : []),
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
    return null; 
  } catch (error) {
    console.error(`Error reading '${USER_PROFILE_KEY}' from localStorage:`, error);
    return null; 
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

// Water Intake
const DEFAULT_DAILY_WATER_GOAL_GLASSES = 8; 

export function getWaterIntake(): WaterIntakeData {
  const today = new Date().toISOString().split('T')[0];
  const profile = getUserProfile(); 
  const goalFromProfile = profile?.waterGoal || DEFAULT_DAILY_WATER_GOAL_GLASSES;
  const defaultIntake = { current: 0, goal: goalFromProfile, lastUpdatedDate: today };

  if (typeof window === 'undefined') {
    return defaultIntake;
  }

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
  
  intake.goal = goalFromProfile; 
  saveWaterIntake(intake); 
  return intake;
}

export function saveWaterIntake(intake: WaterIntakeData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WATER_INTAKE_KEY, JSON.stringify(intake));
  } catch (error) {
    console.error(`Error writing '${WATER_INTAKE_KEY}' to localStorage:`, error);
  }
}

export function addWater(amountInUnits: number = 1): WaterIntakeData {
  const intake = getWaterIntake(); 
  
  const safeGoal = intake.goal > 0 ? intake.goal : DEFAULT_DAILY_WATER_GOAL_GLASSES;
  intake.current = Math.max(0, Math.min(intake.current + amountInUnits, safeGoal * 3)); 
  saveWaterIntake(intake); 
  return intake;
}

export function getTodaysMealLogs(): MealEntry[] {
  
  const allLogs = getMealLogs();
  const todayISO = new Date().toISOString().split('T')[0];
  return allLogs.filter(log => log.date.startsWith(todayISO));
}

export function getRecentMealLogs(days: number = 7): MealEntry[] {
  
  const allLogs = getMealLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return allLogs.filter(log => new Date(log.date) >= cutoffDate);
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

export function fakeLogin(email: string): void {
    if (typeof window === 'undefined') return;
    
    let profile = getUserProfile(); 
    
    if (profile) {
        profile = { ...profile, email: email };
    } else {
        // If no profile exists at all, create a very basic one.
        // This might happen if a user tries to log in without ever signing up or onboarding.
        console.warn("fakeLogin: No existing profile found. Creating a new minimal profile for login.");
        profile = { 
            ...defaultUserProfile,
            email: email, 
            name: 'User', // Or derive from email if possible
        };
    }
    saveUserProfile(profile); 

    try {
        localStorage.setItem(USER_LOGGED_IN_KEY, 'true');
    } catch (error) {
        console.error(`Error writing '${USER_LOGGED_IN_KEY}' to localStorage:`, error);
    }
}

export function fakeSignup(email: string, name: string): void {
    if (typeof window === 'undefined') return;

    // Check if a profile with this email already exists. For a fake system, we might overwrite or just log.
    // For simplicity, we'll create/overwrite.
    const newProfile: UserProfile = { 
      ...defaultUserProfile, // Start with defaults
      email: email, 
      name: name,
    };
    saveUserProfile(newProfile); 

    try {
        localStorage.setItem(USER_LOGGED_IN_KEY, 'true');
    } catch (error) {
        console.error(`Error writing '${USER_LOGGED_IN_KEY}' to localStorage:`, error);
    }
    try {
        // Crucially, set onboarding to false after signup, so they are directed to onboarding.
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'false'); 
    } catch (error) {
        console.error(`Error writing '${ONBOARDING_COMPLETE_KEY}' to localStorage:`, error);
    }
}


export function fakeLogout(): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(USER_LOGGED_IN_KEY);
        // Optionally, you might want to clear other session-specific data here,
        // but not the entire user profile or meal logs unless that's the desired behavior.
    } catch (error) {
        console.error(`Error removing '${USER_LOGGED_IN_KEY}' from localStorage:`, error);
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
  ];
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing '${key}' from localStorage:`, error);
    }
  });
  console.log("Attempted to clear all user data from localStorage.");
}
