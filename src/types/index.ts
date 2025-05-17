
export interface DetailedNutrient {
  value: number;
  unit: string;
  rdaPercentage?: number; // Optional, AI might not always provide this
}

export interface DetailedNutrients {
  [key: string]: DetailedNutrient; // e.g., iron, vitaminD, fiber, calcium
}

export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface MealEntry {
  id: string;
  date: string; // ISO string
  category?: MealCategory;
  photoDataUri?: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  nutritionalInfo: string; // General text info
  detailedNutrients?: DetailedNutrients; // Structured nutrient data
  carbonFootprintEstimate?: number; // in kg CO2e
  mood?: 'happy' | 'neutral' | 'sad'; // Optional mood logging
}

export interface FoodAnalysisResult {
  estimatedCalories: number;
  nutritionalInformation: string; // General text info for compatibility
  detailedNutrients: DetailedNutrients;
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

export interface ReminderSettings {
  breakfastTime?: string; // e.g., "08:00"
  lunchTime?: string;     // e.g., "12:30"
  dinnerTime?: string;    // e.g., "18:30"
  waterReminderEnabled?: boolean;
  waterReminderInterval?: number; // in minutes, e.g., 60
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
  waterIntake?: string;
  enjoysCooking?: string;
}

export interface UserProfile extends OnboardingData {
  email?: string;
  phone?: string;
  profileImageUri?: string | null;
  reminderSettings?: ReminderSettings;
}

export interface WaterIntakeData {
  current: number;
  goal: number;
  lastUpdatedDate: string; // ISO date string YYYY-MM-DD
}

// AI Flow Output Types
export interface NutrientTrendAnalysis {
  trendInsight: string;
}

export interface AICoachRecommendations {
  goalAdjustments: string[];
  mealTimingSuggestions: string[];
}

export interface CarbonComparisonAnalysis {
  comparisonText: string;
  userAverageCF: number;
  regionalAverageCF: number; // This will be an LLM-provided general estimate
}

export interface EcoMealPlan {
  mealPlan: Array<{
    day: string;
    meals: Array<{ name: string; description: string; lowCarbonScore: number }>;
  }>;
  groceryList: string[];
}

export interface FoodMoodCorrelation {
  insights: string[];
}

// Chatbot types
export interface ChatMessage {
  id: string; // For React keys in the UI
  role: 'user' | 'assistant';
  text: string;
  timestamp: string; // ISO string
}

export interface FlowChatMessage { // For passing to/from AI flow
  role: 'user' | 'model';
  content: string;
}
