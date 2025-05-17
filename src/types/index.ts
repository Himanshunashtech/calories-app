
export interface MealEntry {
  id: string;
  date: string; // ISO string
  photoDataUri?: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  nutritionalInfo: string;
}

export interface FoodAnalysisResult {
  estimatedCalories: number;
  nutritionalInformation: string; // This is a string description
  carbohydrates: number; // in grams
  fats: number; // in grams
  proteins: number; // in grams
}

export type UserPlan = 'free' | 'pro' | 'ecopro';

export interface AIScanUsage {
  count: number;
  limit: number;
  lastResetMonth: number; // Stores the month (0-11) of the last reset
}

export interface OnboardingData {
  name: string;
  age: string;
  gender: string;
  height: string;
  heightUnit: string;
  weight: string;
  weightUnit: string;
  activityLevel: string;
  healthGoals: string[];
  exerciseFrequency: string;
  dietaryRestrictions: string;
  dietType: string;
  sleepHours: string;
  stressLevel: string;
  // Fields that might exist in old onboarding but not explicitly in new form:
  waterIntake?: string; // This was for onboarding, distinct from daily tracking
  enjoysCooking?: string;
}

export interface UserProfile extends OnboardingData {
  email?: string;
  phone?: string;
  profileImageUri?: string | null;
}

export interface WaterIntakeData {
  current: number; // in glasses or oz
  goal: number; // in glasses or oz
  lastUpdatedDate: string; // ISO date string YYYY-MM-DD
}
