
export interface DetailedNutrient {
  value: number;
  unit: string;
  rdaPercentage?: number;
}

export interface DetailedNutrients {
  [key: string]: DetailedNutrient;
}

export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Fast Food';

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
  waterReminderInterval?: number; // in minutes
  snoozeDuration?: number; // in minutes
}

export interface AppSettings {
  darkModeEnabled?: boolean;
  unitPreferences?: {
    weight: 'kg' | 'lbs';
    height: 'cm' | 'in';
    volume: 'ml' | 'fl oz';
  };
  hideNonCompliantRecipes?: boolean;
}

export interface UserProfile {
  id?: string; // Simple client-side ID for localStorage, can be Supabase UUID later
  email?: string;
  name?: string;
  age?: string; // Year of birth as string
  gender?: string;
  height?: string;
  height_unit?: 'cm' | 'in';
  weight?: string;
  weight_unit?: 'kg' | 'lbs';
  activity_level?: string;
  health_goals?: string[];
  also_track_sustainability?: boolean;
  exercise_frequency?: string; // e.g., "0", "1-2", "3-4", "5+" days/week
  diet_type?: string;
  dietary_restrictions?: string[]; // From ALLERGY_OPTIONS
  dietary_restrictions_other?: string; // Comma-separated custom restrictions
  favorite_cuisines?: string; // Comma-separated
  disliked_ingredients?: string; // Comma-separated
  enable_carbon_tracking?: boolean;
  sleep_hours?: string; // e.g., "<5", "5-6", "7-8", "8+"
  stress_level?: string; // e.g., "low", "moderate", "high"
  water_goal?: number; // number of glasses/units
  macroSplit?: { carbs: number, protein: number, fat: number };
  profile_image_url?: string | null; // Data URI or placeholder URL
  onboarding_complete?: boolean;
  selected_plan?: UserPlan;
  reminderSettings?: ReminderSettings;
  appSettings?: AppSettings;
  // Supabase specific fields (optional for localStorage, but good to define)
  // created_at?: string;
  // updated_at?: string;
}

export type OnboardingData = Partial<UserProfile>;


export interface WaterIntakeData {
  current: number;
  goal: number;
  lastUpdatedDate: string; // YYYY-MM-DD to reset daily
}

export interface WeightEntry {
  id?: string; // Added optional ID for potential future database use
  date: string; // ISO string
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
