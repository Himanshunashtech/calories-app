
import type { MealEntry, UserPlan, AIScanUsage, UserProfile, OnboardingData, WaterIntakeData, ReminderSettings, MealCategory } from '@/types';

const MEAL_LOGS_KEY = 'ecoAiCalorieTracker_mealLogs';
const SELECTED_PLAN_KEY = 'selectedPlan';
const AI_SCAN_USAGE_KEY = 'ecoAi_aiScanUsage';
const ONBOARDING_DATA_KEY = 'onboardingData'; // Old key
const USER_PROFILE_KEY = 'userProfile'; // New consolidated key
const WATER_INTAKE_KEY = 'ecoAi_waterIntake';

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
    category: entry.category || undefined,
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
  breakfastTime: '08:00',
  lunchTime: '12:30',
  dinnerTime: '18:30',
  waterReminderEnabled: false,
  waterReminderInterval: 60,
};

export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const profileJson = localStorage.getItem(USER_PROFILE_KEY);
    let existingProfile: Partial<UserProfile> = {};

    if (profileJson) {
      existingProfile = JSON.parse(profileJson) as UserProfile;
    } else {
      const onboardingJson = localStorage.getItem(ONBOARDING_DATA_KEY);
      if (onboardingJson) {
        const onboardingData = JSON.parse(onboardingJson) as OnboardingData;
        existingProfile = {
          ...onboardingData,
          email: '',
          phone: '',
          profileImageUri: null,
        };
        // localStorage.removeItem(ONBOARDING_DATA_KEY); // Optional: remove old key after migration
      }
    }
    
    const completeProfile: UserProfile = {
      name: existingProfile.name || '',
      age: existingProfile.age || '',
      gender: existingProfile.gender || '',
      height: existingProfile.height || '',
      heightUnit: existingProfile.heightUnit || 'cm',
      weight: existingProfile.weight || '',
      weightUnit: existingProfile.weightUnit || 'kg',
      activityLevel: existingProfile.activityLevel || '',
      healthGoals: existingProfile.healthGoals || [],
      exerciseFrequency: existingProfile.exerciseFrequency || '',
      dietaryRestrictions: existingProfile.dietaryRestrictions || '',
      dietType: existingProfile.dietType || '',
      sleepHours: existingProfile.sleepHours || '',
      stressLevel: existingProfile.stressLevel || '',
      email: existingProfile.email || '',
      phone: existingProfile.phone || '',
      profileImageUri: existingProfile.profileImageUri || null,
      reminderSettings: {
        ...defaultReminderSettings,
        ...(existingProfile.reminderSettings || {}),
      },
    };
    
    // Save the potentially migrated/defaulted profile back to ensure it's always complete
    if (!profileJson && existingProfile.name) { // Only save if we migrated from onboarding
         saveUserProfile(completeProfile);
    }


    return completeProfile;

  } catch (error) {
    console.error("Error reading user profile from localStorage:", error);
    const fallbackProfile: UserProfile = {
        name: '', age: '', gender: '', height: '', heightUnit: 'cm', weight: '', weightUnit: 'kg',
        activityLevel: '', healthGoals: [], exerciseFrequency: '', dietaryRestrictions: '',
        dietType: '', sleepHours: '', stressLevel: '', email: '', phone: '', profileImageUri: null,
        reminderSettings: defaultReminderSettings
    };
    return fallbackProfile;
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
const DAILY_WATER_GOAL_GLASSES = 8; 

export function getWaterIntake(): WaterIntakeData {
  if (typeof window === 'undefined') {
    return { current: 0, goal: DAILY_WATER_GOAL_GLASSES, lastUpdatedDate: new Date().toISOString().split('T')[0] };
  }
  const intakeJson = localStorage.getItem(WATER_INTAKE_KEY);
  const today = new Date().toISOString().split('T')[0];
  let intake: WaterIntakeData;

  if (intakeJson) {
    intake = JSON.parse(intakeJson);
    if (intake.lastUpdatedDate !== today) {
      intake.current = 0;
      intake.lastUpdatedDate = today;
    }
  } else {
    intake = { current: 0, goal: DAILY_WATER_GOAL_GLASSES, lastUpdatedDate: today };
  }
  intake.goal = DAILY_WATER_GOAL_GLASSES; 
  saveWaterIntake(intake); // Save to ensure lastUpdatedDate is current if reset
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
  intake.current = Math.max(0, Math.min(intake.current + amountInGlasses, intake.goal * 3)); // Cap at triple goal, ensure not negative
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
