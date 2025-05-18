
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
    volume?: 'ml' | 'fl oz'; // Added volume
  };
  hideNonCompliantRecipes?: boolean; // For allergy/dietary restriction filtering
}

export interface OnboardingData {
  email?: string; // Added email field
  name: string;
  age: string;
  gender: string;
  height: string;
  heightUnit: 'cm' | 'in';
  weight: string;
  weightUnit: 'kg' | 'lbs';
  activityLevel: string;
  healthGoals: string[];
  alsoTrackSustainability?: boolean; // New for eco-focus
  exerciseFrequency: string;
  // Diet Preferences
  dietType: string;
  dietaryRestrictions: string[]; // Changed to array for multi-select
  favoriteCuisines?: string;
  dislikedIngredients?: string;
  enableCarbonTracking?: boolean;
  // Lifestyle
  sleepHours: string;
  stressLevel: string;
  waterGoal?: number; // For custom water goal
  // Placeholders from detailed list
  macroSplit?: { carbs: number, protein: number, fat: number }; // Placeholder
  reminderSettings?: ReminderSettings; // Added to onboarding data for initial setup
}

export interface UserProfile extends OnboardingData {
  // email is now part of OnboardingData, but kept here for explicit UserProfile structure
  email?: string;
  phone?: string;
  profileImageUri?: string | null;
  // reminderSettings are part of OnboardingData
  appSettings?: AppSettings;
  // selectedPlan?: UserPlan; // This could be part of UserProfile if persisted on a backend
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
