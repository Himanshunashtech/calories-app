
export interface DetailedNutrient {
  value: number;
  unit: string;
  rdaPercentage?: number;
}

export interface DetailedNutrients {
  [key: string]: DetailedNutrient; // Allows for various nutrient names
}

export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Fast Food';

export interface MealEntry {
  id: string; // UUID from Supabase or client-generated for localStorage
  user_id?: string; // Foreign key to Supabase auth.users.id
  date: string; // ISO string
  category?: MealCategory;
  photoDataUri?: string; // Or URL if using Supabase Storage
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  nutritionalInfo?: string; // General text info from AI
  detailedNutrients?: DetailedNutrients; // Structured micronutrient data
  carbonFootprintEstimate?: number; // in kg CO2e
  mood?: 'happy' | 'neutral' | 'sad';
  created_at?: string; // Supabase timestamp
}

export interface FoodAnalysisResult { // Output from AI flows
  estimatedCalories: number;
  nutritionalInformation: string;
  detailedNutrients: DetailedNutrients; // Ensure this is consistently an object
  carbohydrates: number;
  fats: number;
  proteins: number;
  carbonFootprintEstimate?: number;
}

export type UserPlan = 'free' | 'pro' | 'ecopro';

export interface AIScanUsage {
  count: number;
  limit: number;
  lastResetMonth: number; // To track monthly reset for free tier
}

export interface ReminderSettings {
  mealRemindersEnabled?: boolean;
  breakfastTime?: string; // e.g., "08:00"
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
    volume: 'ml' | 'fl oz'; // For water intake
  };
  hideNonCompliantRecipes?: boolean; // Filter recipes based on profile allergies
}

export interface UserProfile {
  id: string; // This will be the Supabase auth user ID (UUID)
  email: string;
  name?: string | null;
  age?: string | null; // Consider storing as number (year of birth) or date
  gender?: string | null;
  height?: string | null; // Store as string for flexibility, parse to number when needed
  height_unit?: 'cm' | 'in' | null;
  weight?: string | null; // Store as string, parse to number
  weight_unit?: 'kg' | 'lbs' | null;
  activity_level?: string | null; // E.g., 'sedentary', 'light', 'moderate', 'active'
  health_goals?: string[] | null; // Array of strings
  also_track_sustainability?: boolean | null;
  exercise_frequency?: string | null; // E.g., "0", "1-2", "3-4", "5+" days/week
  diet_type?: string | null;
  dietary_restrictions?: string[] | null;
  dietary_restrictions_other?: string | null;
  favorite_cuisines?: string | null; // Comma-separated or JSON array string
  disliked_ingredients?: string | null; // Comma-separated or JSON array string
  enable_carbon_tracking?: boolean | null;
  sleep_hours?: string | null; // E.g., "<5", "5-6", "7-8", "8+"
  stress_level?: string | null; // E.g., "low", "moderate", "high"
  water_goal?: number | null; // Number of glasses/units
  macroSplit?: { carbs: number; protein: number; fat: number } | null;
  profile_image_url?: string | null; // URL from Supabase Storage or Google
  onboarding_complete?: boolean; // Default false in DB
  selected_plan?: UserPlan | null; // Default 'free' in DB
  reminderSettings?: ReminderSettings | null; // Stored as JSONB in Supabase
  appSettings?: AppSettings | null; // Stored as JSONB in Supabase
  created_at?: string; // Supabase timestamp
  updated_at?: string; // Supabase timestamp
}

// Used for collecting onboarding data, can be partial
export type OnboardingData = Partial<UserProfile>;


export interface WaterIntakeData {
  // This might be managed differently with Supabase, e.g., daily logs or aggregated on profile
  id?: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  current: number;
  goal: number;
}

export interface WeightEntry {
  id?: string; // UUID from Supabase
  user_id?: string; // Foreign key
  date: string; // ISO string
  weight: number;
  unit: 'kg' | 'lbs';
  created_at?: string;
}

// ... other types for AI flow outputs remain largely the same ...
// NutrientTrendAnalysis, AICoachRecommendations, CarbonComparisonAnalysis, EcoMealPlan, FoodMoodCorrelation, RecipeNutritionDetails

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string; // ISO string
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
