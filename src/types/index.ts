
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
  id: string; // client-generated for localStorage, or UUID from Supabase
  user_id?: string; // Foreign key to Supabase auth.users.id if using Supabase
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
  detailedNutrients: DetailedNutrients;
  carbohydrates: number;
  fats: number;
  proteins: number;
  carbonFootprintEstimate?: number;
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
    volume: 'ml' | 'fl oz';
  };
  hideNonCompliantRecipes?: boolean;
}

// This UserProfile should align with your Supabase 'profiles' table columns
export interface UserProfile {
  id: string; // Supabase auth user ID (UUID)
  email?: string | null; // From Supabase auth, can be null if not set
  name?: string | null;
  age?: string | null; // Year of birth
  gender?: string | null;
  height?: string | null;
  height_unit?: 'cm' | 'in' | null;
  weight?: string | null;
  weight_unit?: 'kg' | 'lbs' | null;
  activity_level?: string | null;
  health_goals?: string[] | null;
  also_track_sustainability?: boolean | null;
  exercise_frequency?: string | null;
  diet_type?: string | null;
  dietary_restrictions?: string[] | null;
  dietary_restrictions_other?: string | null;
  favorite_cuisines?: string | null;
  disliked_ingredients?: string | null;
  enable_carbon_tracking?: boolean | null;
  sleep_hours?: string | null;
  stress_level?: string | null;
  water_goal?: number | null;
  macroSplit?: { carbs: number; protein: number; fat: number } | null;
  profile_image_url?: string | null;
  onboarding_complete?: boolean;
  selected_plan?: UserPlan | null;
  reminderSettings?: ReminderSettings | null; // Stored as JSONB
  appSettings?: AppSettings | null; // Stored as JSONB
  created_at?: string; // Supabase timestamp
  updated_at?: string; // Supabase timestamp
}

export type OnboardingData = Partial<UserProfile>;


export interface WaterIntakeData {
  id?: string; // client-gen or Supabase UUID
  user_id?: string;
  date: string; // YYYY-MM-DD
  current: number;
  goal: number;
  lastUpdatedDate?: string; // To track daily reset
}

export interface WeightEntry {
  id?: string; // client-gen or Supabase UUID
  user_id?: string;
  date: string; // ISO string
  weight: number;
  unit: 'kg' | 'lbs';
  created_at?: string;
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
