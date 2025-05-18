
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  getSelectedPlan, 
  getAIScanUsage, 
  getWaterIntake,
  addWater,
  getTodaysMealLogs, 
  getRecentMealLogs, 
  updateMealLogWithMood, 
  getUserProfile,
  type UserPlan, 
  type AIScanUsage as AIScanUsageType,
  type WaterIntakeData,
  type MealEntry,
  type UserProfile as UserProfileType,
  type ReminderSettings,
  addWeightEntry,
  getWeightEntries,
  type WeightEntry,
  getMealLogs, 
} from '@/lib/localStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, Camera, Leaf, Utensils, ShieldCheck, Zap, Brain, Trees, BarChartBig, Users, MessageSquareHeart, 
  CheckCircle, AlertTriangle, Info, Droplet, Footprints, TrendingUp, PlusCircle, Target as TargetIcon, 
  Maximize2, Grape, Fish, Shell, SmilePlus, Smile, Meh, Frown, Globe2, Loader2, Edit3, BellRing, Clock3, Cog, Search, Filter, CalendarDays, Activity, Bike, Weight as WeightIcon, Download, PieChartIcon, User
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter as ModalFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select as RadixSelect, SelectContent as RadixSelectContent, SelectItem as RadixSelectItem, SelectTrigger as RadixSelectTrigger, SelectValue as RadixSelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'; 


import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// AI Flow Imports
import { analyzeNutrientTrends, type AnalyzeNutrientTrendsOutput } from '@/ai/flows/analyze-nutrient-trends';
import { getAICoachRecommendations, type GetAICoachRecommendationsOutput } from '@/ai/flows/get-ai-coach-recommendations';
import { getCarbonComparison, type GetCarbonComparisonOutput } from '@/ai/flows/get-carbon-comparison';
import { generateEcoMealPlan, type GenerateEcoMealPlanOutput } from '@/ai/flows/generate-eco-meal-plan';
import { analyzeFoodMoodCorrelation, type AnalyzeFoodMoodCorrelationOutput } from '@/ai/flows/analyze-food-mood-correlation';


const DAILY_CALORIE_GOAL_BASE = 2000; 

export default function DashboardPage() {
  const [plan, setPlan] = useState<UserPlan>('free');
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [aiScanUsage, setAiScanUsage] = useState<AIScanUsageType | null>(null);
  const [waterIntake, setWaterIntake] = useState<WaterIntakeData | null>(null);
  const [todaysMealLogs, setTodaysMealLogs] = useState<MealEntry[]>([]);
  const [allMealLogs, setAllMealLogs] = useState<MealEntry[]>([]); 
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [nutrientTrend, setNutrientTrend] = useState<AnalyzeNutrientTrendsOutput | null>(null);
  const [coachRecommendations, setCoachRecommendations] = useState<GetAICoachRecommendationsOutput | null>(null);
  const [carbonComparison, setCarbonComparison] = useState<GetCarbonComparisonOutput | null>(null);
  const [ecoMealPlan, setEcoMealPlan] = useState<GenerateEcoMealPlanOutput | null>(null);
  const [foodMoodInsights, setFoodMoodInsights] = useState<AnalyzeFoodMoodCorrelationOutput | null>(null);
  
  const [isLoadingAI, setIsLoadingAI] = useState({
    trends: false, coach: false, carbon: false, mealPlan: false, mood: false
  });

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isDetailedProgressReportModalOpen, setIsDetailedProgressReportModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);


  useEffect(() => {
    // Effect 1: Set isClient
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Effect 2: Load initial data from localStorage when isClient is true
    if (isClient) {
      const initialPlan = getSelectedPlan();
      setPlan(initialPlan);
      const initialProfile = getUserProfile();
      setUserProfile(initialProfile);
      setWeightUnit(initialProfile?.appSettings?.unitPreferences?.weight || 'kg');
      setWeightEntries(getWeightEntries());
      setAiScanUsage(getAIScanUsage());
      setWaterIntake(getWaterIntake());
      const initialTodaysLogs = getTodaysMealLogs();
      setTodaysMealLogs(initialTodaysLogs);
      setAllMealLogs(getMealLogs()); 
    }
  }, [isClient]);
  
  const fetchDashboardData = useCallback(async (currentPlan: UserPlan, profile: UserProfileType | null, mealsForAI: MealEntry[]) => {
    if (!isClient || !profile) {
      setIsLoadingAI({ trends: false, coach: false, carbon: false, mealPlan: false, mood: false });
      return;
    }

    const recentMealsForTrends = mealsForAI; 
    const allMealsForCarbon = getRecentMealLogs(30); 
    const mealsWithMood = getRecentMealLogs(14).filter(m => m.mood);

    if (currentPlan === 'pro' || currentPlan === 'ecopro') {
      setIsLoadingAI(prev => ({ ...prev, trends: true, coach: true }));
      analyzeNutrientTrends({ recentMeals: recentMealsForTrends.map(m => ({...m, date: m.date, detailedNutrients: m.detailedNutrients || {}})), userHealthGoals: profile.healthGoals })
        .then(setNutrientTrend).catch(err => {
            console.error("Error fetching nutrient trends:", err);
            toast({variant: 'destructive', title:'AI Error', description:'Could not fetch nutrient trends.'});
        })
        .finally(() => setIsLoadingAI(prev => ({ ...prev, trends: false })));
      
      getAICoachRecommendations({ userProfile: profile, recentMeals: mealsForAI.slice(0, 10) }) 
        .then(setCoachRecommendations).catch(err => {
            console.error("Error fetching coach recommendations:", err);
            toast({variant: 'destructive', title:'AI Error', description:'Could not fetch coach recommendations.'});
        })
        .finally(() => setIsLoadingAI(prev => ({ ...prev, coach: false })));
    }

    if (currentPlan === 'ecopro') {
      setIsLoadingAI(prev => ({ ...prev, carbon: true, mood: true }));
      
      if (profile.enable_carbon_tracking) { 
        getCarbonComparison({ userMeals: allMealsForCarbon.filter(m => m.carbonFootprintEstimate !== undefined).map(m => ({...m, date: m.date, carbonFootprintEstimate: m.carbonFootprintEstimate})) })
          .then(setCarbonComparison).catch(err => {
            console.error("Error fetching carbon comparison:", err);
            toast({variant: 'destructive', title:'AI Error', description:'Could not fetch carbon comparison.'});
          })
          .finally(() => setIsLoadingAI(prev => ({ ...prev, carbon: false })));
      } else {
        setCarbonComparison({ comparisonText: "Carbon tracking is disabled. Enable it in your profile.", userAverageDailyCF: 0, generalAverageDailyCF: 2.5});
        setIsLoadingAI(prev => ({ ...prev, carbon: false }));
      }

      if(mealsWithMood.length >= 3) { 
        analyzeFoodMoodCorrelation({ mealsWithMood: mealsWithMood.map(m => ({...m, date:m.date, mood: m.mood!, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat})) })
          .then(setFoodMoodInsights).catch(err => {
            console.error("Error fetching food-mood insights:", err);
            toast({variant: 'destructive', title:'AI Error', description:'Could not fetch food-mood insights.'});
          })
          .finally(() => setIsLoadingAI(prev => ({ ...prev, mood: false })));
      } else {
         setFoodMoodInsights({ insights: ["Log mood after meals to see correlations."], sufficientData: false });
         setIsLoadingAI(prev => ({ ...prev, mood: false }));
      }
    }
  }, [isClient, toast]);

  useEffect(() => {
    // Effect 3: Fetch AI data once client is ready and essential profile/log data is loaded
    if (isClient && userProfile && plan && todaysMealLogs) { 
      fetchDashboardData(plan, userProfile, todaysMealLogs);
    }
  }, [isClient, userProfile, plan, todaysMealLogs, fetchDashboardData]);


  const refreshMealLogs = useCallback(() => {
    if (!isClient) return;
    const refreshedTodayLogs = getTodaysMealLogs();
    setTodaysMealLogs(refreshedTodayLogs);
    setAllMealLogs(getMealLogs()); 
    if(userProfile && plan) {
        fetchDashboardData(plan, userProfile, refreshedTodayLogs);
    }
  }, [isClient, userProfile, plan, fetchDashboardData]);
  
  const actualDailyCalorieGoal = useMemo(() => {
    if (!isClient || !userProfile) return DAILY_CALORIE_GOAL_BASE;
    let goal = DAILY_CALORIE_GOAL_BASE;
    if (userProfile.health_goals?.includes('Lose Weight')) {
      goal *= 0.8;
    } else if (userProfile.health_goals?.includes('Gain Muscle')) {
      goal *= 1.2;
    }
    return Math.round(goal);
  }, [isClient, userProfile]);

  const totalCaloriesToday = useMemo(() => {
    if (!isClient) return 0;
    return todaysMealLogs.reduce((sum, log) => sum + log.calories, 0);
  }, [isClient, todaysMealLogs]
  );

  const calorieProgressPercentage = useMemo(() => {
    if (!isClient || actualDailyCalorieGoal === 0) return 0;
    return Math.min((totalCaloriesToday / actualDailyCalorieGoal) * 100, 100);
  }, [isClient, totalCaloriesToday, actualDailyCalorieGoal]);

  const getCalorieProgressColor = () => {
    if (calorieProgressPercentage < 75) return 'bg-primary';
    if (calorieProgressPercentage < 100) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  const handleAddWater = useCallback((amount: number) => {
    if (!isClient) return;
    const newIntake = addWater(amount);
    setWaterIntake(newIntake);
    const volumeUnit = userProfile?.appSettings?.unitPreferences?.volume === 'fl oz' ? 'fl oz' : 'glasses';
    const unitName = volumeUnit === 'glasses' ? (amount === 1 ? 'Glass' : 'Glasses') : volumeUnit;
    const addedAmountDisplay = volumeUnit === 'glasses' ? amount : Math.round(amount * 8); 

    toast({
      title: `+${addedAmountDisplay} ${unitName} Water Logged`,
      description: `Current: ${newIntake.current}/${newIntake.goal} ${volumeUnit}. Keep it up!`,
    });
  }, [isClient, userProfile, toast]);

  const handleGenerateMealPlan = useCallback(async () => {
    if (!isClient || !userProfile) {
      toast({ variant: "destructive", title: "Profile needed", description: "Please complete your profile first."});
      return;
    }
    setIsLoadingAI(prev => ({ ...prev, mealPlan: true }));
    try {
      const planOutput = await generateEcoMealPlan({
        userProfile: {
          dietType: userProfile.dietType,
          healthGoals: userProfile.healthGoals,
          dietaryRestrictions: Array.isArray(userProfile.dietaryRestrictions) ? userProfile.dietaryRestrictions.join(', ') : userProfile.dietaryRestrictionsOther,
        },
        durationDays: 3,
      });
      setEcoMealPlan(planOutput);
      toast({ title: "Eco Meal Plan Generated!", description: "Check out your new 3-day plan." });
    } catch (error) {
      console.error("Error generating meal plan:", error);
      toast({ variant: "destructive", title: "Meal Plan Error", description: "Could not generate meal plan." });
    } finally {
      setIsLoadingAI(prev => ({ ...prev, mealPlan: false }));
    }
  }, [isClient, userProfile, toast]);

  const handleLogMood = useCallback(async (mood: 'happy' | 'neutral' | 'sad') => {
    if (!isClient) return;
    if (todaysMealLogs.length === 0) {
        toast({title: "Log a Meal First", description: "Log your latest meal before recording mood for best insights.", variant: "default"});
    }
    
    const lastMeal = todaysMealLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (lastMeal) {
      updateMealLogWithMood(lastMeal.id, mood);
      toast({ title: `Mood logged: ${mood.charAt(0).toUpperCase() + mood.slice(1)}`, description: "AI will analyze correlations soon." });
    } else {
       toast({ title: `Mood logged: ${mood.charAt(0).toUpperCase() + mood.slice(1)}`, description: "Consider logging meals to correlate with mood." });
    }

    refreshMealLogs(); 

    const mealsWithMood = getRecentMealLogs(14).filter(m => m.mood);
    if (mealsWithMood.length >= 3 && userProfile && (plan === 'pro' || plan === 'ecopro')) { 
      setIsLoadingAI(prev => ({ ...prev, mood: true }));
      analyzeFoodMoodCorrelation({ mealsWithMood: mealsWithMood.map(m => ({...m, date:m.date, mood: m.mood!, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat})) })
          .then(setFoodMoodInsights)
          .catch(err => {
            console.error("Error fetching food-mood insights after mood log:", err);
            toast({variant: 'destructive', title:'AI Error', description:'Could not analyze food-mood correlation.'});
          })
          .finally(() => setIsLoadingAI(prev => ({ ...prev, mood: false })));
    } else if (userProfile && (plan === 'pro' || plan === 'ecopro')) { 
        setFoodMoodInsights({ insights: ["Log mood after a few more meals to discover potential patterns with your diet!"], sufficientData: false });
    }
  }, [isClient, todaysMealLogs, userProfile, toast, refreshMealLogs, plan]);

  const handleAddWeightMeasurement = () => {
    if (!isClient) return;
    if (!newWeight || isNaN(parseFloat(newWeight)) || parseFloat(newWeight) <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Weight', description: 'Please enter a valid positive number for weight.' });
      return;
    }
    const addedEntry = addWeightEntry(parseFloat(newWeight), weightUnit);
    setWeightEntries(prev => [...prev, addedEntry].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setNewWeight('');
    setIsWeightModalOpen(false);
    toast({ title: 'Weight Logged!', description: `${addedEntry.weight} ${addedEntry.unit} recorded.` });
  };
  
  const weightTrendChartData = useMemo(() => {
    if (!isClient) return [];
    return weightEntries.slice(-30).map(entry => ({ 
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: entry.weight 
    }));
  }, [isClient, weightEntries]);

  const dailyCalorieData = useMemo(() => {
    if (!isClient) return [];
    const data: { [date: string]: number } = {};
    const recentLogs = getRecentMealLogs(30); 
    recentLogs.forEach(log => {
      const dateKey = log.date.split('T')[0];
      data[dateKey] = (data[dateKey] || 0) + log.calories;
    });
    return Object.entries(data)
      .map(([date, calories]) => ({ date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), calories }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [isClient, allMealLogs]);


  const scansUsedPercentage = useMemo(() => {
    if (!isClient || !aiScanUsage || aiScanUsage.limit <= 0) return 0;
    return Math.min((aiScanUsage.count / aiScanUsage.limit) * 100, 100);
  }, [isClient, aiScanUsage]);
  
  const nutrientDataPlaceholders = useMemo(() => [
    { name: 'Iron', value: 0, actualValue: 0, low: true, icon: Shell, tip: "Analyze meals to see Iron levels.", unit: "mg" },
    { name: 'Vitamin D', value: 0, actualValue: 0, low: true, icon: Fish, tip: "Analyze meals for Vitamin D insights.", unit: "mcg" },
    { name: 'Fiber', value: 0, actualValue: 0, low: true, icon: Grape, tip: "Track fiber through meal analysis.", unit: "g" },
    { name: 'Calcium', value: 0, actualValue: 0, low: true, icon: Maximize2, tip: "Calcium data appears after meal analysis.", unit: "mg" },
  ],[]);

  const todayMicronutrients = useMemo(() => {
    if (!isClient || plan === 'free' || !todaysMealLogs || todaysMealLogs.length === 0) return nutrientDataPlaceholders;

    const aggregatedNutrients: { [key: string]: { totalValue: number, unit: string, entries: number, rdaSum?: number } } = {};

    todaysMealLogs.forEach(log => {
      if (log.detailedNutrients) {
        for (const [key, nutrient] of Object.entries(log.detailedNutrients)) {
          if (nutrient && typeof nutrient.value === 'number' && nutrient.unit) { 
            if (!aggregatedNutrients[key]) {
              aggregatedNutrients[key] = { totalValue: 0, unit: nutrient.unit, entries: 0, rdaSum: 0 };
            }
            aggregatedNutrients[key].totalValue += nutrient.value;
            aggregatedNutrients[key].entries += 1;
            if (nutrient.rdaPercentage) {
                 aggregatedNutrients[key].rdaSum = (aggregatedNutrients[key].rdaSum || 0) + (nutrient.rdaPercentage || 0) ;
            }
          }
        }
      }
    });
    
    const illustrativeRDAGoals: {[key:string]: number} = { iron: 18, vitaminD: 20, fiber: 30, calcium: 1000, vitaminC: 90, potassium: 3500 }; 

    const calculatedNutrients = Object.entries(aggregatedNutrients).map(([name, data]) => {
        const rdaGoal = illustrativeRDAGoals[name.toLowerCase()] || 100; 
        const percentageOfRDA = data.rdaSum && data.entries > 0 ? (data.rdaSum / data.entries) : (data.totalValue / rdaGoal) * 100;
        const icon = nutrientDataPlaceholders.find(p => p.name.toLowerCase() === name.toLowerCase())?.icon || Leaf;
        return {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: parseFloat(percentageOfRDA.toFixed(0)), 
            actualValue: parseFloat(data.totalValue.toFixed(1)),
            unit: data.unit,
            low: percentageOfRDA < 50,
            icon: icon,
            tip: percentageOfRDA < 50 ? `Low ${name}. Aim for ${rdaGoal}${data.unit}.` : `${name} levels look good today!`
        }
    });
    
    if (calculatedNutrients.length === 0) return nutrientDataPlaceholders;
    return calculatedNutrients.slice(0,4); 
  }, [isClient, todaysMealLogs, plan, nutrientDataPlaceholders]); 

  const mockEcoScore = useMemo(() => {
    if (!isClient || !userProfile) return 'N/A';
    if (todaysMealLogs.length === 0 || !userProfile.enable_carbon_tracking) return 'N/A';
    const mealsWithCF = todaysMealLogs.filter(m => m.carbonFootprintEstimate !== undefined);
    if (mealsWithCF.length === 0) return 'N/A';
    const avgCarbon = mealsWithCF.reduce((sum, meal) => sum + (meal.carbonFootprintEstimate!), 0) / mealsWithCF.length;
    if (avgCarbon < 0.8) return 'A+';
    if (avgCarbon < 1.2) return 'A';
    if (avgCarbon < 1.8) return 'B+';
    if (avgCarbon < 2.5) return 'B';
    if (avgCarbon < 3.5) return 'C';
    return 'D';
  }, [isClient, todaysMealLogs, userProfile]);

  const handlePlaceholderFeatureClick = useCallback((featureName: string) => {
    if (!isClient) return;
    toast({
      title: `${featureName} Coming Soon!`,
      description: `This feature will be available in a future update.`,
    });
  }, [isClient, toast]);

  const dailyCarbonFootprintData = useMemo(() => {
    if (!isClient || plan !== 'ecopro' || !userProfile?.enable_carbon_tracking) return [];
    const dailyData: { [date: string]: number } = {};
    allMealLogs.forEach(log => {
      if (log.carbonFootprintEstimate !== undefined) {
        const dateKey = log.date.split('T')[0];
        dailyData[dateKey] = (dailyData[dateKey] || 0) + log.carbonFootprintEstimate;
      }
    });
    
    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const last7DaysCarbonData = sortedDates.slice(-7).map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      carbon: parseFloat(dailyData[date].toFixed(2)), 
    }));
    return last7DaysCarbonData;
  }, [isClient, plan, userProfile, allMealLogs]);

  const averageCarbonFootprints = useMemo(() => {
    if (!isClient || plan !== 'ecopro' || !userProfile?.enable_carbon_tracking || allMealLogs.length === 0) {
      return { daily: 0, weekly: 0, count: 0 };
    }
    
    const mealsWithCF = allMealLogs.filter(log => log.carbonFootprintEstimate !== undefined);
    if (mealsWithCF.length === 0) return { daily: 0, weekly: 0, count: 0 };

    const totalCF = mealsWithCF.reduce((sum, log) => sum + log.carbonFootprintEstimate!, 0);
    
    const uniqueDaysWithCF = new Set(mealsWithCF.map(log => log.date.split('T')[0])).size;
    const dailyAvg = uniqueDaysWithCF > 0 ? totalCF / uniqueDaysWithCF : 0;
    
    return {
      daily: parseFloat(dailyAvg.toFixed(2)),
      weekly: parseFloat((dailyAvg * 7).toFixed(2)), 
      count: mealsWithCF.length
    };
  }, [isClient, plan, userProfile, allMealLogs]);


  const SkeletonLoadingUI = () => (
    <div className="space-y-6 p-4">
      {[...Array(5)].map((_, i) => ( <Card key={i} className="shadow-lg"><CardHeader><div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2"></div><div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div></CardHeader><CardContent><div className="h-10 bg-muted rounded animate-pulse"></div>{(i % 2 === 0) && <div className="h-20 mt-2 bg-muted rounded animate-pulse"></div>}</CardContent></Card> ))}
    </div>
  );
  
  if (!isClient) {
    return <SkeletonLoadingUI />;
  }


  const reminderSettings = userProfile?.reminderSettings;
  const waterVolumeUnit = userProfile?.appSettings?.unitPreferences?.volume === 'fl oz' ? 'fl oz' : 'glasses';


  return (
    <div className="space-y-8">
      <Card className="shadow-lg bg-gradient-to-br from-primary/10 via-background to-background">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold text-primary">Welcome, {userProfile?.name || 'User'}!</CardTitle>
            <CardDescription className="text-lg">
              Your EcoAI Dashboard. Current plan: <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize text-sm ml-1">{plan}</Badge>
            </CardDescription>
          </div>
          <Link href="/profile" passHref>
            <Button variant="ghost" size="icon" aria-label="User Profile">
              <User className="h-6 w-6 text-primary" />
            </Button>
          </Link>
        </CardHeader>
        <CardFooter className="flex-wrap gap-2"> 
            <Button onClick={() => router.push('/subscription')} variant="outline"> Manage Subscription </Button> 
            <Button onClick={() => router.push('/settings')} variant="ghost"><Cog className="mr-2 h-4 w-4"/> App Settings</Button>
        </CardFooter>
      </Card>

      {plan === 'free' && (
        <Card className="shadow-md border-l-4 border-amber-500">
          <CardHeader><CardTitle className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-6 w-6" />Free Tier Limitations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Upgrade to unlock more features!</p>
            {aiScanUsage && (<div><div className="flex justify-between items-baseline mb-1"><span className="text-sm font-medium">AI Meal Scans Used:</span><span className="text-sm text-muted-foreground">{aiScanUsage.count} / {aiScanUsage.limit}</span></div><Progress value={scansUsedPercentage} aria-label={`${aiScanUsage.count} of ${aiScanUsage.limit} AI scans used`} className="h-2 [&>div]:bg-amber-500" /><p className="text-xs text-muted-foreground mt-1">Results may be watermarked. Scans reset monthly.</p></div>)}
            <div className="mt-4 p-4 bg-muted rounded-lg text-center"> <p className="text-sm font-semibold text-muted-foreground">Advertisement</p> <Image src="https://placehold.co/300x100.png" data-ai-hint="advertisement banner" alt="Placeholder Ad" width={300} height={100} className="mx-auto mt-2 rounded shadow"/> </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Vitals Card */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Utensils className="text-primary"/> Today's Vitals</CardTitle>
          <CardDescription>Your key metrics for today.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calorie Ring and Progress */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>Calories Consumed</span>
              <span className="text-muted-foreground">{totalCaloriesToday.toFixed(0)} / {actualDailyCalorieGoal.toFixed(0)} kcal</span>
            </div>
            <Progress value={calorieProgressPercentage} className={cn("h-3", getCalorieProgressColor())} />
            <p className="text-xs text-muted-foreground text-center pt-1">
              {calorieProgressPercentage >= 100 ? "Goal reached!" : `${(actualDailyCalorieGoal - totalCaloriesToday).toFixed(0)} kcal remaining.`}
            </p>
          </div>

          {/* Water Intake, Steps, Eco Score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-2 p-3 rounded-lg border bg-card">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="flex items-center gap-1"><Droplet className="h-4 w-4 text-blue-500"/>Water Intake</span>
                <span className="text-muted-foreground">{waterIntake?.current || 0} / {waterIntake?.goal || 8} {waterVolumeUnit}</span>
              </div>
              <Progress value={waterIntake ? (waterIntake.current / waterIntake.goal) * 100 : 0} className="h-3 [&>div]:bg-blue-500" />
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => handleAddWater(1)} className="flex-1 text-xs whitespace-normal text-center">+1 {waterVolumeUnit === 'glasses' ? 'Glass' : 'Serving (8oz)'}</Button>
                <Button size="sm" variant="outline" onClick={() => handleAddWater(0.5)} className="flex-1 text-xs whitespace-normal text-center">+{waterVolumeUnit === 'glasses' ? '0.5 Glass' : '0.5 Serving (4oz)'}</Button>
              </div>
            </div>
            <div className="space-y-2 p-3 rounded-lg border bg-card flex flex-col items-center justify-center">
              <Footprints className="h-8 w-8 text-primary mb-1"/>
              <p className="text-lg font-semibold">7,532</p>
              <p className="text-xs text-muted-foreground">Steps Today</p>
              <Button size="sm" variant="ghost" className="text-xs mt-1 text-primary hover:underline" onClick={() => handlePlaceholderFeatureClick('Fitness Tracker Sync')}>Sync Health App</Button>
            </div>
            <div className="space-y-2 p-3 rounded-lg border bg-card flex flex-col items-center justify-center">
              <Leaf className="h-8 w-8 text-green-600 mb-1"/>
              <p className="text-lg font-semibold">{mockEcoScore}</p>
              <p className="text-xs text-muted-foreground">Daily Eco-Score</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex flex-col sm:flex-row gap-2">
            <Button onClick={() => router.push('/log-meal')} className="flex-1 w-full sm:w-auto"><Camera className="mr-2 h-4 w-4"/> Log Meal</Button>
            <Button onClick={() => handlePlaceholderFeatureClick('Exercise Logging')} variant="outline" className="flex-1 w-full sm:w-auto"><Bike className="mr-2 h-4 w-4" /> Log Exercise</Button>
        </CardFooter>
      </Card>

      {/* Today's Meals Timeline Card */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2"><Utensils className="text-primary"/> Today's Meals</CardTitle>
             <Button variant="ghost" size="sm" onClick={refreshMealLogs} className="text-xs"><Edit3 className="mr-1 h-3 w-3"/>Refresh Logs</Button>
          </div>
          <CardDescription>Your meals logged today.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          {todaysMealLogs.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-4 pb-4">
                {todaysMealLogs.map(meal => (
                  <Card key={meal.id} className="min-w-[220px] max-w-[280px] shrink-0">
                    <CardHeader className="p-3">
                      {meal.photoDataUri && (<Image src={meal.photoDataUri} alt={meal.description || "Meal"} width={200} height={120} className="rounded-md object-cover w-full aspect-[16/9]" data-ai-hint="food meal"/>)}
                      <CardTitle className="text-base mt-2 truncate">{meal.category ? `${meal.category}: ` : ''}{meal.description || "Meal Photo"}</CardTitle>
                      <CardDescription className="text-xs">{new Date(meal.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}{meal.mood && ` - Mood: ${meal.mood.charAt(0).toUpperCase() + meal.mood.slice(1)}`}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 text-xs space-y-1">
                      <p><span className="font-medium">{meal.calories.toFixed(0)} kcal</span></p>
                      <p className="text-muted-foreground">P: {meal.protein.toFixed(1)}g, C: {meal.carbs.toFixed(1)}g, F: {meal.fat.toFixed(1)}g</p>
                      {(plan === 'pro' || plan === 'ecopro') && userProfile?.enable_carbon_tracking && meal.carbonFootprintEstimate !== undefined && <p className="text-teal-600 text-xs flex items-center gap-1"><Trees className="h-3 w-3"/>~{meal.carbonFootprintEstimate.toFixed(2)} kg CO₂e</p>}
                    </CardContent>
                    <CardFooter className="p-3"><Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => handlePlaceholderFeatureClick('Recreate Meal')}>Recreate Meal</Button></CardFooter>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-4">No meals logged today.</p>
          )}
        </CardContent>
      </Card>

      {reminderSettings && (
        <Card className="shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><BellRing className="text-primary"/> Reminders</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {reminderSettings.mealRemindersEnabled ? (
              <>
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="flex items-center gap-1"><Clock3 className="h-4 w-4 text-muted-foreground"/> Breakfast:</span>
                  <Badge variant="outline">{reminderSettings.breakfastTime || 'Not set'}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="flex items-center gap-1"><Clock3 className="h-4 w-4 text-muted-foreground"/> Lunch:</span>
                  <Badge variant="outline">{reminderSettings.lunchTime || 'Not set'}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="flex items-center gap-1"><Clock3 className="h-4 w-4 text-muted-foreground"/> Dinner:</span>
                  <Badge variant="outline">{reminderSettings.dinnerTime || 'Not set'}</Badge>
                </div>
              </>
            ) : (
                 <p className="text-muted-foreground text-center p-2 border rounded-md">Meal reminders are disabled.</p>
            )}
            <div className="flex items-center justify-between p-2 border rounded-md">
              <span className="flex items-center gap-1"><Droplet className="h-4 w-4 text-blue-500"/> Water Reminder:</span>
              <Badge variant={reminderSettings.waterReminderEnabled ? "secondary" : "outline"}>
                {reminderSettings.waterReminderEnabled ? `Every ${reminderSettings.waterReminderInterval} mins` : 'Disabled'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-2 text-center">Notification functionality is browser-dependent. Set preferences in your Profile.</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation cards removed here */}
      
      <Card className="shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Search className="text-primary"/> Explore Recipes</CardTitle></CardHeader><CardContent><Button variant="link" onClick={() => router.push('/recipes')} className="p-0 h-auto">{plan === 'free' ? "Access 5 complimentary eco-friendly recipes." : "Access 50+ premium recipes." }</Button></CardContent></Card>

      {(plan === 'pro' || plan === 'ecopro') && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2"><Zap /> Pro Features Active</h2>
          <Card className="shadow-md border-l-4 border-green-500"><CardHeader><CardTitle className="flex items-center gap-2 text-green-700"><Brain className="h-6 w-6"/>Advanced AI Insights</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-1 text-muted-foreground"><li>Unlimited AI Meal Scans.</li><li>Detailed macro &amp; micro-nutrient breakdowns.</li><li>Meal-by-meal carbon footprint tracking (view in Meal Timeline - enable in Profile).</li></ul>{(plan === 'pro' || plan === 'ecopro') && <Badge variant="default" className="mt-3"><CheckCircle className="mr-1 h-4 w-4"/> Ad-Free Experience</Badge>}</CardContent></Card>
          
          <Card className="shadow-md border-l-4 border-purple-500">
            <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="text-primary"/>Nutrient Breakdown</CardTitle><CardDescription>Micronutrient insights from today's meals.</CardDescription></CardHeader>
            <CardContent>
              {isLoadingAI.trends ? <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div> :
              <>
              <div className="flex flex-wrap gap-3 mb-4">
                {todayMicronutrients.map(nutrient => (
                  <Badge key={nutrient.name} variant={nutrient.low ? "destructive" : "secondary"} className={cn("p-2 text-sm flex items-center gap-1.5 whitespace-normal", nutrient.low && "animate-pulse")}>
                    <nutrient.icon className={cn("h-4 w-4 shrink-0", nutrient.low ? "text-destructive-foreground" : "text-secondary-foreground")} />
                    <span>{nutrient.name}: {nutrient.actualValue}{nutrient.unit} ({nutrient.value}% RDA)</span>
                  </Badge>
                ))}
              </div>
              <Alert> <TrendingUp className="h-4 w-4" /> <AlertTitle>AI Nutrient Trend</AlertTitle> <AlertDescription> {nutrientTrend?.trendInsight || "Keep logging meals for detailed nutrient trends."} </AlertDescription> </Alert>
              </>}
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-blue-500"><CardHeader><CardTitle className="flex items-center gap-2 text-blue-700"><MessageSquareHeart className="h-6 w-6"/>Personalized AI Coach</CardTitle></CardHeader>
            <CardContent>
              {isLoadingAI.coach ? <div className="flex justify-center items-center p-4"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/></div> :
              coachRecommendations ? (
                <>
                  <p className="text-muted-foreground font-semibold">Goal Adjustments:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-3">{coachRecommendations.goalAdjustments.map((item, i) => <li key={`ga-${i}`}>{item}</li>) || <li>No specific adjustments now.</li>}</ul>
                  <p className="text-muted-foreground font-semibold">Meal Timing Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">{coachRecommendations.mealTimingSuggestions.map((item, i) => <li key={`mt-${i}`}>{item}</li>) || <li>No specific timing suggestions now.</li>}</ul>
                   {coachRecommendations.generalTips && coachRecommendations.generalTips.length > 0 && (<><p className="text-muted-foreground font-semibold mt-2">General Tips:</p><ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">{coachRecommendations.generalTips.map((item, i) => <li key={`gt-${i}`}>{item}</li>)}</ul></>)}
                </>
              ) : (<p className="text-muted-foreground">AI Coach insights will appear here after logging some meals.</p>)}
               <Button variant="outline" className="mt-4" onClick={() => router.push('/chat')} >Chat with AI Coach</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-indigo-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-700"><TrendingUp className="h-6 w-6" /> Weekly Progress</CardTitle>
                <CardDescription>Track trends and get AI forecasts.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="weight" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="weight">Weight Trend</TabsTrigger>
                        <TabsTrigger value="carbon" disabled={!userProfile?.enable_carbon_tracking}>Carbon Savings</TabsTrigger>
                        <TabsTrigger value="forecast">AI Forecast</TabsTrigger>
                    </TabsList>
                    <TabsContent value="weight">
                        <div className="mt-4 h-60 bg-muted/50 rounded-md p-4 text-center">
                            {weightTrendChartData.length > 1 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={weightTrendChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))'}} />
                                        <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} name={`Weight (${weightUnit})`} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-muted-foreground flex flex-col items-center justify-center h-full">
                                    Log at least two weight measurements to see your trend.
                                </p>
                            )}
                        </div>
                        <Dialog open={isWeightModalOpen} onOpenChange={setIsWeightModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full mt-3">
                                    <WeightIcon className="mr-2 h-4 w-4"/> Add Weight Measurement
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Weight</DialogTitle>
                                    <DialogDescription>
                                        Enter your current weight. It will be logged with today's date.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-weight" className="text-right">Weight</Label>
                                        <Input id="new-weight" type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="col-span-2" placeholder="e.g., 70" />
                                        <span className="col-span-1">{weightUnit}</span>
                                    </div>
                                </div>
                                <ModalFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsWeightModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" onClick={handleAddWeightMeasurement}>Save Weight</Button>
                                </ModalFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>
                    <TabsContent value="carbon">
                        <div className="mt-4 h-48 bg-muted/50 rounded-md flex items-center justify-center p-4">
                            <p className="text-muted-foreground text-center">{userProfile?.enable_carbon_tracking ? "Carbon savings chart vs. last week (Placeholder)." : "Enable carbon tracking in your profile to see this chart."}</p>
                        </div>
                    </TabsContent>
                    <TabsContent value="forecast">
                        <div className="mt-4 p-4 border rounded-md bg-muted/30">
                            <p className="text-sm font-semibold text-primary">AI Forecast (Example):</p>
                            <p className="text-muted-foreground text-sm mt-1">"Keep up current efforts! Projected to lose 0.5kg next week if you maintain this calorie deficit." (Placeholder)</p>
                            <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary" onClick={() => handlePlaceholderFeatureClick('AI Forecast Details')}>Learn more</Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => setIsDetailedProgressReportModalOpen(true)}
                  disabled={!isClient || (weightEntries.length < 2 && dailyCalorieData.length === 0)}
                >
                  Detailed Progress Report
                </Button>
            </CardFooter>
          </Card>
        </section>
      )}

      {plan === 'ecopro' && userProfile?.enable_carbon_tracking && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2"><Trees /> EcoPro Sustainability Hub</h2>
          <Card className="shadow-md border-l-4 border-teal-500">
            <CardHeader><CardTitle className="flex items-center gap-2 text-teal-700"><BarChartBig className="h-6 w-6" />Carbon Footprint Analytics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoadingAI.carbon && <div className="flex justify-center items-center p-4"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/></div>}
              {!isLoadingAI.carbon && carbonComparison && (
                <Alert>
                    <Globe2 className="h-4 w-4" />
                    <AlertTitle>AI Footprint Comparison</AlertTitle>
                    <AlertDescription>
                        {carbonComparison.comparisonText}
                        <span className="block text-xs mt-1">Your avg: {carbonComparison.userAverageDailyCF.toFixed(2)} kg CO₂e/day. General avg: {carbonComparison.generalAverageDailyCF.toFixed(2)} kg CO₂e/day.</span>
                    </AlertDescription>
                </Alert>
              )}
              {!isLoadingAI.carbon && !carbonComparison && (
                <p className="text-muted-foreground">Carbon comparison data will appear here after logging meals with carbon estimates.</p>
              )}

              <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">Daily Carbon Footprint (Last 7 Logged Days)</h4>
                {dailyCarbonFootprintData.length > 0 ? (
                  <div className="h-60 bg-muted/30 rounded-md p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={dailyCarbonFootprintData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <YAxis unit="kg" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} domain={[0, 'dataMax + 0.5']}/>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))'}} formatter={(value) => [`${value} kg CO₂e`, "Carbon Footprint"]}/>
                        <Bar dataKey="carbon" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Carbon Footprint" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-3">Log meals with carbon estimates to see your daily trend.</p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 border rounded-md bg-card">
                    <p className="font-medium">Average Daily Carbon:</p>
                    <p className="text-lg text-primary">{averageCarbonFootprints.daily.toFixed(2)} kg CO₂e</p>
                    <p className="text-xs text-muted-foreground">(Based on {averageCarbonFootprints.count} meals with CF data)</p>
                </div>
                <div className="p-3 border rounded-md bg-card">
                    <p className="font-medium">Projected Weekly Carbon:</p>
                    <p className="text-lg text-primary">{averageCarbonFootprints.weekly.toFixed(2)} kg CO₂e</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 border rounded-md bg-muted/30">
                <h4 className="text-md font-semibold mb-1">Top Carbon Contributors (Conceptual)</h4>
                <p className="text-xs text-muted-foreground">Red meat dishes: ~35% of your weekly carbon footprint.</p>
                <p className="text-xs text-muted-foreground">Imported fruits in winter: ~15%.</p>
              </div>
               <div className="mt-4 p-3 border rounded-md bg-muted/30">
                <h4 className="text-md font-semibold mb-1">Historical Trends (Conceptual)</h4>
                <p className="text-xs text-muted-foreground">Your average daily footprint is down 10% from last month!</p>
              </div>

            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-lime-500"><CardHeader><CardTitle className="flex items-center gap-2 text-lime-700"><Users className="h-6 w-6"/>Eco-Score Leaderboards</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Compete with friends on sustainability scores! (Placeholder)</p><Button variant="outline" className="mt-4" onClick={() => handlePlaceholderFeatureClick('Eco-Score Leaderboards')}>View Leaderboards</Button></CardContent></Card>
          
          <Card className="shadow-md border-l-4 border-emerald-500"><CardHeader><CardTitle className="flex items-center gap-2 text-emerald-700"><Leaf className="h-6 w-6"/>AI-Generated Meal Plans</CardTitle></CardHeader>
            <CardContent>
              {isLoadingAI.mealPlan ? <div className="flex justify-center items-center p-4"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/></div> :
              ecoMealPlan ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">{ecoMealPlan.planTitle || "Your Eco Meal Plan"}</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 border p-2 rounded-md">
                  {ecoMealPlan.mealPlan.map((dayPlan, idx) => (
                    <div key={idx}>
                        <p className="font-medium text-sm">{dayPlan.day}</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground ml-2">
                        {dayPlan.meals.map((meal, mealIdx) => <li key={mealIdx}>{meal.name} (Score: {meal.lowCarbonScore}/5) - {meal.description}</li>)}
                        </ul>
                    </div>))}
                  </div>
                  <h5 className="font-semibold text-md mt-2">Grocery List:</h5>
                  <ul className="list-disc list-inside text-xs text-muted-foreground ml-2 max-h-32 overflow-y-auto border p-2 rounded-md">
                    {ecoMealPlan.groceryList.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              ) : (<p className="text-muted-foreground">Generate a meal plan with the button below.</p>)}
              <Button className="mt-4" onClick={handleGenerateMealPlan} disabled={isLoadingAI.mealPlan || !userProfile}>
                {isLoadingAI.mealPlan ? <Loader2 className="animate-spin mr-2"/> : <Zap className="mr-2 h-4 w-4"/>}
                {ecoMealPlan ? "Regenerate Plan" : "Generate My Eco Meal Plan"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-purple-500"><CardHeader><CardTitle className="flex items-center gap-2 text-purple-700"><SmilePlus className="h-6 w-6" /> Food Mood Correlation</CardTitle><CardDescription>Log mood after meals to uncover patterns.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">How are you feeling after your last meal?</p>
              <div className="flex justify-around items-center py-2">
                <Button variant="ghost" size="icon" className="h-14 w-14 hover:bg-green-100 rounded-full" aria-label="Happy" onClick={() => handleLogMood('happy')}><Smile className="h-8 w-8 text-green-500" /></Button>
                <Button variant="ghost" size="icon" className="h-14 w-14 hover:bg-yellow-100 rounded-full" aria-label="Neutral" onClick={() => handleLogMood('neutral')}><Meh className="h-8 w-8 text-yellow-500" /></Button>
                <Button variant="ghost" size="icon" className="h-14 w-14 hover:bg-red-100 rounded-full" aria-label="Sad" onClick={() => handleLogMood('sad')}><Frown className="h-8 w-8 text-red-500" /></Button>
              </div>
              {isLoadingAI.mood ? <div className="flex justify-center items-center p-4"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/></div> :
              foodMoodInsights && foodMoodInsights.insights.length > 0 && (
                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm font-semibold text-primary">AI Insights:</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 mt-1">
                    {foodMoodInsights.insights.map((insight, i) => <li key={`fmi-${i}`}>{insight}</li>)}
                    {!foodMoodInsights.sufficientData && <li>Log moods more consistently for deeper insights.</li>}
                  </ul>
                </div>
              )}
               <Button variant="outline" className="w-full" onClick={() => router.push('/mood-analysis')}>Full Mood Analysis</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-sky-500"><CardHeader><CardTitle className="flex items-center gap-2 text-sky-700"><Globe2 className="h-6 w-6" /> Sustainability Impact</CardTitle><CardDescription>See how your diet compares.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="space-y-2 text-sm"><div className="flex justify-between items-center p-2 border rounded-md"><span>Your Diet vs. Local Average:</span><Badge variant="secondary" className="text-green-700 bg-green-100">40% Less CO₂ (Example)</Badge></div><div className="flex justify-between items-center p-2 border rounded-md"><span>Your Diet vs. Global Goals:</span><Badge variant="outline" className="text-orange-700 border-orange-300">1.5x Limit (Example)</Badge></div></div><Alert variant="default" className="bg-primary/5 border-primary/20"><Leaf className="h-4 w-4 text-primary" /><AlertTitle className="text-primary">Suggested Offset Action (Example):</AlertTitle><AlertDescription className="text-muted-foreground">"Walk 2 miles to neutralize recent pasta carbon!"</AlertDescription></Alert><Button variant="outline" className="w-full" onClick={() => handlePlaceholderFeatureClick('More Impact Data')}>More Impact Data</Button></CardContent>
          </Card>
           <div className="mt-4 p-3 bg-primary/10 rounded-md text-primary flex items-center gap-2"><ShieldCheck className="h-5 w-5"/><p className="text-sm">As an EcoPro member, you get Priority Support! (Placeholder)</p></div>
        </section>
      )}
      
      {!isClient && plan === 'free' && !aiScanUsage && (<Card><CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Loading Usage...</CardTitle></CardHeader><CardContent><div className="h-10 bg-muted animate-pulse rounded-md"></div></CardContent></Card>)}
      
      <Dialog open={isDetailedProgressReportModalOpen} onOpenChange={setIsDetailedProgressReportModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Detailed Progress Report</DialogTitle>
            <DialogDescription>Your weight trends and calorie intake over time.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow">
            <div className="space-y-6 p-1">
              <section>
                <h3 className="text-lg font-semibold mb-2">Weight Trend</h3>
                {weightTrendChartData.length > 1 ? (
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightTrendChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }} />
                        <Legend />
                        <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name={`Weight (${weightUnit})`} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Log at least two weight measurements to see your trend.</p>
                )}
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2">Recent Weight Entries</h3>
                {weightEntries.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Weight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weightEntries.slice(-10).reverse().map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">{entry.weight.toFixed(1)} {entry.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No weight entries logged yet.</p>
                )}
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2">Recent Daily Calories</h3>
                {dailyCalorieData.length > 0 ? (
                   <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyCalorieData.slice(-14)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} domain={['auto', 'auto']}/>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }} />
                        <Legend />
                        <Line type="monotone" dataKey="calories" name="Calories" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No calorie data logged yet.</p>
                )}
              </section>
            </div>
          </ScrollArea>
          <ModalFooter className="mt-auto pt-4">
            <Button onClick={() => setIsDetailedProgressReportModalOpen(false)}>Close</Button>
          </ModalFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
