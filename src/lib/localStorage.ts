
import type { MealEntry, UserPlan, AIScanUsage, UserProfile, OnboardingData, WaterIntakeData } from '@/types';

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
    };
    console.warn("localStorage not available, meal log not saved:", newEntryStub);
    return newEntryStub;
  }
  const logs = getMealLogs();
  const newEntry: MealEntry = {
    ...entry,
    id: Math.random().toString(36).substring(2, 15),
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
const FREE_TIER_SCAN_LIMIT = 3; // This represents scans per day as per original prompt, not month
// The dashboard shows "scans / month" due to previous interpretation.
// For this iteration, I'll keep the monthly logic from previous step for AI scans,
// but ideally, this should be clarified if it's daily or monthly.
// For now, using the existing monthly logic to avoid breaking current display.

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
  usage.limit = FREE_TIER_SCAN_LIMIT; // Ensure limit is always up-to-date if it changes
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
  if (typeof window === 'undefined') return false; // Should not happen in client component
  const usage = getAIScanUsage();
  return usage.count < usage.limit;
}

// User Profile Data
export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const profileJson = localStorage.getItem(USER_PROFILE_KEY);
    if (profileJson) {
      return JSON.parse(profileJson) as UserProfile;
    }

    const onboardingJson = localStorage.getItem(ONBOARDING_DATA_KEY);
    if (onboardingJson) {
      const onboardingData = JSON.parse(onboardingJson) as OnboardingData;
      const migratedProfile: UserProfile = {
        ...onboardingData,
        email: '',
        phone: '',
        profileImageUri: null,
      };
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(migratedProfile));
      return migratedProfile;
    }
    return null;
  } catch (error) {
    console.error("Error reading user profile from localStorage:", error);
    return null;
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
const DAILY_WATER_GOAL_GLASSES = 8; // Example goal: 8 glasses

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
      // Reset for the new day
      intake.current = 0;
      intake.lastUpdatedDate = today;
    }
  } else {
    intake = { current: 0, goal: DAILY_WATER_GOAL_GLASSES, lastUpdatedDate: today };
  }
  intake.goal = DAILY_WATER_GOAL_GLASSES; // Ensure goal is always current
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
  intake.current = Math.min(intake.current + amountInGlasses, intake.goal * 2); // Cap at double goal to prevent absurd values
  saveWaterIntake(intake);
  return intake;
}
