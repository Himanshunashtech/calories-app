
export interface DetailedNutrient {
  value: number;
  unit: string;
  rdaPercentage?: number;
}

export interface DetailedNutrients {
  [key: string]: DetailedNutrient;
}

export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface MealEntry {
  id: string; // For client-side identification, Supabase will have its own ID
  user_id?: string; // Foreign key to profiles table
  date: string; // ISO string
  category?: MealCategory;
  photoDataUri?: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  nutritionalInfo?: string; // General text info
  detailedNutrients?: DetailedNutrients;
  carbonFootprintEstimate?: number; // in kg CO2e
  mood?: 'happy' | 'neutral' | 'sad';
}

export interface FoodAnalysisResult {
  estimatedCalories: number;
  nutritionalInformation: string;
  detailedNutrients: DetailedNutrients;
  carbohydrates: number;
  fats: number;
  proteins: number;
}

export type UserPlan = 'free' | 'pro' | 'ecopro';

export interface AIScanUsage {
  count: number;
  limit: number;
  lastResetMonth: number;
}

export interface ReminderSettings {
  mealRemindersEnabled?: boolean;
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
  waterReminderEnabled?: boolean;
  waterReminderInterval?: number;
  snoozeDuration?: number;
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

// This represents the data collected during onboarding
// and also aligns with the `profiles` table structure in Supabase.
export interface UserProfile {
  id?: string; // Supabase user ID (from auth.users.id)
  email?: string;
  name?: string;
  age?: string;
  gender?: string;
  height?: string;
  height_unit?: 'cm' | 'in';
  weight?: string;
  weight_unit?: 'kg' | 'lbs';
  activity_level?: string;
  health_goals?: string[];
  also_track_sustainability?: boolean;
  exercise_frequency?: string;
  diet_type?: string;
  dietary_restrictions?: string[];
  favorite_cuisines?: string;
  disliked_ingredients?: string;
  enable_carbon_tracking?: boolean;
  sleep_hours?: string;
  stress_level?: string;
  water_goal?: number;
  macroSplit?: { carbs: number, protein: number, fat: number }; // Will need to decide how to store in Supabase (e.g., JSONB or separate columns)
  profile_image_url?: string | null;
  onboarding_complete?: boolean;
  selected_plan?: UserPlan; // Store selected plan here
  reminderSettings?: ReminderSettings; // Store as JSONB in Supabase
  appSettings?: AppSettings; // Store as JSONB in Supabase
  // Supabase audit columns
  created_at?: string;
  updated_at?: string;
}

// OnboardingData is now essentially UserProfile, but without Supabase 'id' for initial collection
export type OnboardingData = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;


export interface WaterIntakeData {
  current: number;
  goal: number;
  lastUpdatedDate: string;
}

export interface WeightEntry {
  id?: string; // Client-side or Supabase ID
  user_id?: string;
  date: string;
  weight: number;
  unit: 'kg' | 'lbs';
}

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
