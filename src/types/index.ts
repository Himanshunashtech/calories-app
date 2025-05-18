
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
  mealRemindersEnabled?: boolean; // New general toggle
  snoozeDuration?: number; // in minutes, e.g., 5
}

export interface AppSettings {
  darkModeEnabled?: boolean;
  unitPreferences?: {
    weight: 'kg' | 'lbs';
    height: 'cm' | 'in';
    volume?: 'ml' | 'fl oz';
  };
  hideNonCompliantRecipes?: boolean;
}

export interface OnboardingData {
  email?: string;
  name: string;
  age: string;
  gender: string;
  height: string;
  heightUnit: 'cm' | 'in';
  weight: string;
  weightUnit: 'kg' | 'lbs';
  activityLevel: string;
  healthGoals: string[];
  alsoTrackSustainability?: boolean;
  exerciseFrequency: string;
  dietType: string;
  dietaryRestrictions: string[];
  favoriteCuisines?: string;
  dislikedIngredients?: string;
  enableCarbonTracking?: boolean;
  sleepHours: string;
  stressLevel: string;
  waterGoal?: number;
  macroSplit?: { carbs: number, protein: number, fat: number };
  reminderSettings?: ReminderSettings;
}

export interface UserProfile extends OnboardingData {
  email?: string;
  phone?: string;
  profileImageUri?: string | null;
  appSettings?: AppSettings;
}

export interface WaterIntakeData {
  current: number;
  goal: number;
  lastUpdatedDate: string; // ISO date string YYYY-MM-DD
}

export interface WeightEntry {
  date: string; // ISO string
  weight: number; // in user's preferred unit from profile (for storage, consider always kg and convert for display)
  unit: 'kg' | 'lbs';
}

// AI Flow Output Types
export interface NutrientTrendAnalysis {
  trendInsight: string;
}

export interface AICoachRecommendations {
  goalAdjustments: string[];
  mealTimingSuggestions: string[];
  generalTips?: string[];
}

export interface CarbonComparisonAnalysis {
  comparisonText: string;
  userAverageDailyCF: number;
  generalAverageDailyCF: number;
}

export interface EcoMealPlan {
  mealPlan: Array<{
    day: string;
    meals: Array<{ name: string; description: string; lowCarbonScore: number }>;
  }>;
  groceryList: string[];
  planTitle?: string;
}

export interface FoodMoodCorrelation {
  insights: string[];
  sufficientData: boolean;
}

export interface RecipeNutritionDetails {
    estimatedCalories: number;
    detailedNutrients: DetailedNutrients;
    generalSummary: string;
    protein: number;
    carbs: number;
    fat: number;
}


// Chatbot types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface FlowChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const ALLERGY_OPTIONS = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'nuts', label: 'Nuts' },
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'soy', label: 'Soy' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'fish', label: 'Fish' },
  { id: 'eggs', label: 'Eggs' },
];
