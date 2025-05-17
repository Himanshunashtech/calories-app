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
