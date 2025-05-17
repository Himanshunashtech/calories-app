
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
  type ReminderSettings
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
  Maximize2, Grape, Fish, Shell, SmilePlus, Smile, Meh, Frown, Globe2, Loader2, Edit3, BellRing, Clock3
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// AI Flow Imports
import { analyzeNutrientTrends, type AnalyzeNutrientTrendsOutput } from '@/ai/flows/analyze-nutrient-trends';
import { getAICoachRecommendations, type GetAICoachRecommendationsOutput } from '@/ai/flows/get-ai-coach-recommendations';
import { getCarbonComparison, type GetCarbonComparisonOutput } from '@/ai/flows/get-carbon-comparison';
import { generateEcoMealPlan, type GenerateEcoMealPlanOutput } from '@/ai/flows/generate-eco-meal-plan';
import { analyzeFoodMoodCorrelation, type AnalyzeFoodMoodCorrelationOutput } from '@/ai/flows/analyze-food-mood-correlation';


const DAILY_CALORIE_GOAL = 2000; 

export default function DashboardPage() {
  const [plan, setPlan] = useState<UserPlan>('free');
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [aiScanUsage, setAiScanUsage] = useState<AIScanUsageType | null>(null);
  const [waterIntake, setWaterIntake] = useState<WaterIntakeData | null>(null);
  const [todaysMealLogs, setTodaysMealLogs] = useState<MealEntry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [nutrientTrend, setNutrientTrend] = useState<AnalyzeNutrientTrendsOutput | null>(null);
  const [coachRecommendations, setCoachRecommendations] = useState<GetAICoachRecommendationsOutput | null>(null);
  const [carbonComparison, setCarbonComparison] = useState<GetCarbonComparisonOutput | null>(null);
  const [ecoMealPlan, setEcoMealPlan] = useState<GenerateEcoMealPlanOutput | null>(null);
  const [foodMoodInsights, setFoodMoodInsights] = useState<AnalyzeFoodMoodCorrelationOutput | null>(null);
  
  const [isLoadingAI, setIsLoadingAI] = useState({
    trends: false, coach: false, carbon: false, mealPlan: false, mood: false
  });

  const fetchDashboardData = useCallback(async (currentPlan: UserPlan, profile: UserProfileType | null, meals: MealEntry[]) => {
    if (!profile) return;

    if (currentPlan === 'pro' || currentPlan === 'ecopro') {
      setIsLoadingAI(prev => ({ ...prev, trends: true, coach: true }));
      const recentMealsForTrends = getRecentMealLogs(7); 
      
      analyzeNutrientTrends({ recentMeals: recentMealsForTrends.map(m => ({...m, date: m.date})), userHealthGoals: profile.healthGoals })
        .then(setNutrientTrend).catch(err => console.error("Error fetching nutrient trends:", err))
        .finally(() => setIsLoadingAI(prev => ({ ...prev, trends: false })));
      
      getAICoachRecommendations({ userProfile: profile, recentMeals: meals.slice(0, 10) }) 
        .then(setCoachRecommendations).catch(err => console.error("Error fetching coach recommendations:", err))
        .finally(() => setIsLoadingAI(prev => ({ ...prev, coach: false })));
    }
    if (currentPlan === 'ecopro') {
      setIsLoadingAI(prev => ({ ...prev, carbon: true, mood: true }));
      const allMealsForCarbon = getRecentMealLogs(30); 
      
      getCarbonComparison({ userMeals: allMealsForCarbon.filter(m => m.carbonFootprintEstimate !== undefined) })
        .then(setCarbonComparison).catch(err => console.error("Error fetching carbon comparison:", err))
        .finally(() => setIsLoadingAI(prev => ({ ...prev, carbon: false })));

      const mealsWithMood = getRecentMealLogs(14).filter(m => m.mood);
      if(mealsWithMood.length >= 3) { 
        analyzeFoodMoodCorrelation({ mealsWithMood: mealsWithMood.map(m => ({...m, date: m.date})) })
          .then(setFoodMoodInsights).catch(err => console.error("Error fetching food-mood insights:", err))
          .finally(() => setIsLoadingAI(prev => ({ ...prev, mood: false })));
      } else {
         setFoodMoodInsights({ insights: ["Log mood after meals to see correlations."], sufficientData: false });
         setIsLoadingAI(prev => ({ ...prev, mood: false }));
      }
    }
  }, []);


  useEffect(() => {
    setIsClient(true);
    const currentPlan = getSelectedPlan();
    setPlan(currentPlan);
    const profile = getUserProfile();
    setUserProfile(profile);

    if (currentPlan === 'free') {
      setAiScanUsage(getAIScanUsage());
    }
    setWaterIntake(getWaterIntake());
    const todayLogs = getTodaysMealLogs();
    setTodaysMealLogs(todayLogs);

    if (profile) {
        fetchDashboardData(currentPlan, profile, todayLogs);
    }

  }, [fetchDashboardData]);

  const refreshMealLogs = () => {
    const todayLogs = getTodaysMealLogs();
    setTodaysMealLogs(todayLogs);
    if(userProfile) fetchDashboardData(plan, userProfile, todayLogs);
  }
  
  const totalCaloriesToday = useMemo(() => 
    todaysMealLogs.reduce((sum, log) => sum + log.calories, 0),
    [todaysMealLogs]
  );

  const calorieProgressPercentage = Math.min((totalCaloriesToday / DAILY_CALORIE_GOAL) * 100, 100);

  const handleAddWater = (amount: number = 1) => {
    const newIntake = addWater(amount);
    setWaterIntake(newIntake);
    toast({
      title: "Water logged!",
      description: `Logged ${amount} ${amount === 1 ? 'glass' : 'glasses'}. Current: ${newIntake.current}/${newIntake.goal}.`,
      action: <Droplet className="h-5 w-5 text-blue-500"/>
    });
  };

  const handleLogMood = async (mood: 'happy' | 'neutral' | 'sad') => {
    const lastMeal = todaysMealLogs.length > 0 ? todaysMealLogs[todaysMealLogs.length - 1] : null;
    if (lastMeal) {
      updateMealLogWithMood(lastMeal.id, mood);
      refreshMealLogs(); 
      toast({ title: "Mood Logged!", description: `Feeling ${mood} after ${lastMeal.description || 'your last meal'}.`});
      
      if (plan === 'ecopro' && userProfile) {
        setIsLoadingAI(prev => ({ ...prev, mood: true }));
        const mealsWithMood = getRecentMealLogs(14).filter(m => m.mood);
         if(mealsWithMood.length >=3 ){
            analyzeFoodMoodCorrelation({ mealsWithMood: mealsWithMood.map(m => ({...m, date:m.date})) })
            .then(setFoodMoodInsights).catch(err => console.error("Error fetching food-mood insights:", err))
            .finally(() => setIsLoadingAI(prev => ({ ...prev, mood: false })));
         } else {
            setFoodMoodInsights({ insights: ["Log mood after meals to see correlations."], sufficientData: false });
            setIsLoadingAI(prev => ({ ...prev, mood: false }));
         }
      }
    } else {
      toast({ variant: "destructive", title: "No Meal Logged", description: "Log a meal before logging your mood."});
    }
  };

  const handleGenerateMealPlan = async () => {
    if (!userProfile || plan !== 'ecopro') return;
    setIsLoadingAI(prev => ({ ...prev, mealPlan: true }));
    generateEcoMealPlan({ userProfile: { dietType: userProfile.dietType, healthGoals: userProfile.healthGoals, dietaryRestrictions: userProfile.dietaryRestrictions }, durationDays: 3 })
      .then(setEcoMealPlan)
      .catch(err => {
        console.error("Error generating meal plan:", err);
        toast({ variant: "destructive", title: "Meal Plan Error", description: "Could not generate meal plan." });
      })
      .finally(() => setIsLoadingAI(prev => ({ ...prev, mealPlan: false })));
  };

  const scansUsedPercentage = aiScanUsage ? (aiScanUsage.count / aiScanUsage.limit) * 100 : 0;

  const getCalorieProgressColor = () => {
    if (calorieProgressPercentage < 75) return 'bg-primary';
    if (calorieProgressPercentage < 100) return 'bg-yellow-500';
    return 'bg-destructive';
  };
  
  const nutrientDataPlaceholders = [
    { name: 'Iron', value: 0, actualValue: 0, low: true, icon: Shell, tip: "Analyze meals to see Iron levels.", unit: "mg" },
    { name: 'Vitamin D', value: 0, actualValue: 0, low: true, icon: Fish, tip: "Analyze meals for Vitamin D insights.", unit: "mcg" },
    { name: 'Fiber', value: 0, actualValue: 0, low: true, icon: Grape, tip: "Track fiber through meal analysis.", unit: "g" },
    { name: 'Calcium', value: 0, actualValue: 0, low: true, icon: Maximize2, tip: "Calcium data appears after meal analysis.", unit: "mg" },
  ];

  const todayMicronutrients = useMemo(() => {
    if (plan === 'free' || !todaysMealLogs || todaysMealLogs.length === 0) return nutrientDataPlaceholders;

    const aggregatedNutrients: { [key: string]: { totalValue: number, unit: string, entries: number, rdaSum?: number } } = {};

    todaysMealLogs.forEach(log => {
      if (log.detailedNutrients) {
        for (const [key, nutrient] of Object.entries(log.detailedNutrients)) {
          if (nutrient) {
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
  }, [todaysMealLogs, plan]);


  if (!isClient) {
    return (
      <div className="space-y-6 p-4">
        {[...Array(5)].map((_, i) => ( <Card key={i} className="shadow-lg"><CardHeader><div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2"></div><div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div></CardHeader><CardContent><div className="h-10 bg-muted rounded animate-pulse"></div>{(i % 2 === 0) && <div className="h-20 mt-2 bg-muted rounded animate-pulse"></div>}</CardContent></Card> ))}
      </div>
    );
  }

  const reminderSettings = userProfile?.reminderSettings;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg bg-gradient-to-br from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Welcome, {userProfile?.name || 'User'}!</CardTitle>
          <CardDescription className="text-lg">
            Your EcoAI Dashboard. Current plan: <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize text-sm ml-1">{plan}</Badge>
          </CardDescription>
        </CardHeader>
        <CardFooter> <Button onClick={() => router.push('/subscription')} variant="outline"> Manage Subscription </Button> </CardFooter>
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

      <Card className="shadow-md">
        <CardHeader><CardTitle className="flex items-center gap-2"><TargetIcon className="text-primary"/> Today's Vitals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2 p-3 rounded-lg border bg-card"><div className="flex justify-between items-center text-sm font-medium"><span>Calories</span><span className="text-muted-foreground">{totalCaloriesToday.toFixed(0)} / {DAILY_CALORIE_GOAL} kcal</span></div><Progress value={calorieProgressPercentage} className={cn("h-3", getCalorieProgressColor())} /><p className="text-xs text-muted-foreground text-center pt-1">{calorieProgressPercentage >= 100 ? "Goal reached!" : `${(DAILY_CALORIE_GOAL - totalCaloriesToday).toFixed(0)} kcal remaining.`}</p></div>
          <div className="space-y-2 p-3 rounded-lg border bg-card"><div className="flex justify-between items-center text-sm font-medium"><span className="flex items-center gap-1"><Droplet className="h-4 w-4 text-blue-500"/>Water Intake</span><span className="text-muted-foreground">{waterIntake?.current || 0} / {waterIntake?.goal || 8} glasses</span></div><Progress value={waterIntake ? (waterIntake.current / waterIntake.goal) * 100 : 0} className="h-3 [&>div]:bg-blue-500" /><div className="flex gap-2 pt-1"><Button size="sm" variant="outline" onClick={() => handleAddWater(1)} className="flex-1 text-xs">+1 Glass</Button><Button size="sm" variant="outline" onClick={() => handleAddWater(0.5)} className="flex-1 text-xs">+0.5 Glass</Button></div></div>
          <div className="space-y-2 p-3 rounded-lg border bg-card flex flex-col items-center justify-center"><Footprints className="h-8 w-8 text-primary mb-1"/><p className="text-lg font-semibold">7,532</p><p className="text-xs text-muted-foreground">Steps Today</p><Button size="sm" variant="ghost" className="text-xs mt-1 text-primary hover:underline" disabled>Sync Health App</Button></div>
          <div className="space-y-2 p-3 rounded-lg border bg-card flex flex-col items-center justify-center"><Leaf className="h-8 w-8 text-green-600 mb-1"/><p className="text-lg font-semibold">B+</p><p className="text-xs text-muted-foreground">Daily Eco-Score</p><p className="text-xs text-muted-foreground mt-1">(Placeholder)</p></div>
        </CardContent>
      </Card>

      {reminderSettings && (
        <Card className="shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><BellRing className="text-primary"/> Reminders</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
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
            <div className="flex items-center justify-between p-2 border rounded-md">
              <span className="flex items-center gap-1"><Droplet className="h-4 w-4 text-blue-500"/> Water Reminder:</span>
              <Badge variant={reminderSettings.waterReminderEnabled ? "secondary" : "outline"}>
                {reminderSettings.waterReminderEnabled ? `Every ${reminderSettings.waterReminderInterval} mins` : 'Disabled'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-2 text-center">Notification functionality is browser-dependent and will be enhanced soon. Set preferences in your Profile.</p>
          </CardContent>
        </Card>
      )}


      <Card className="shadow-md">
        <CardHeader><CardTitle className="flex items-center gap-2"><Utensils className="text-primary"/> Today's Meals</CardTitle><CardDescription>Timeline of your meals logged today. <Button variant="ghost" size="sm" onClick={refreshMealLogs} className="text-xs"><Edit3 className="mr-1 h-3 w-3"/>Refresh</Button></CardDescription></CardHeader>
        <CardContent>
          {todaysMealLogs.length > 0 ? (<ScrollArea className="w-full whitespace-nowrap"><div className="flex space-x-4 pb-4">{todaysMealLogs.map(meal => (<Card key={meal.id} className="min-w-[220px] max-w-[280px] shrink-0"><CardHeader className="p-3">{meal.photoDataUri && (<Image src={meal.photoDataUri} alt={meal.description || "Meal"} width={200} height={120} className="rounded-md object-cover w-full aspect-[16/9]" data-ai-hint="food meal"/>)}<CardTitle className="text-base mt-2 truncate">{meal.category ? `${meal.category}: ` : ''}{meal.description || "Meal Photo"}</CardTitle><CardDescription className="text-xs">{new Date(meal.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}{meal.mood && ` - Mood: ${meal.mood.charAt(0).toUpperCase() + meal.mood.slice(1)}`}</CardDescription></CardHeader><CardContent className="p-3 text-xs space-y-1"><p><span className="font-medium">{meal.calories.toFixed(0)} kcal</span></p><p className="text-muted-foreground">P: {meal.protein.toFixed(1)}g, C: {meal.carbs.toFixed(1)}g, F: {meal.fat.toFixed(1)}g</p>{(plan === 'ecopro' || plan === 'pro') && meal.carbonFootprintEstimate !== undefined && <p className="text-teal-600 text-xs flex items-center gap-1"><Trees className="h-3 w-3"/>~{meal.carbonFootprintEstimate.toFixed(2)} kg CO₂e</p>}</CardContent><CardFooter className="p-3"><Button variant="ghost" size="sm" className="w-full text-xs" disabled>Recreate Meal</Button></CardFooter></Card>))}</div><ScrollBar orientation="horizontal" /></ScrollArea>) : (<p className="text-muted-foreground text-center py-4">No meals logged today.</p>)}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow"><CardHeader><CardTitle className="flex items-center gap-2"><Camera className="text-primary"/> Log Meal</CardTitle><CardDescription>Quickly log meals, manually or with AI.</CardDescription></CardHeader><CardFooter><Link href="/log-meal" passHref legacyBehavior><Button className="w-full">Go to Log Meal</Button></Link></CardFooter></Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/> View Stats</CardTitle><CardDescription>Track progress and nutritional trends.</CardDescription></CardHeader><CardFooter><Link href="/stats" passHref legacyBehavior><Button className="w-full">Go to Stats</Button></Link></CardFooter></Card>
      </div>

      {(plan === 'pro' || plan === 'ecopro') && (
        <Card className="shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="text-primary"/>Nutrient Breakdown</CardTitle><CardDescription>Micronutrient insights from today's meals.</CardDescription></CardHeader>
          <CardContent>
            {isLoadingAI.trends ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/> :
            <>
            <div className="flex flex-wrap gap-3 mb-4">
              {todayMicronutrients.map(nutrient => (
                <Badge key={nutrient.name} variant={nutrient.low ? "destructive" : "secondary"} className={cn("p-2 text-sm flex items-center gap-1.5", nutrient.low && "animate-pulse")}>
                  <nutrient.icon className={cn("h-4 w-4", nutrient.low ? "text-destructive-foreground" : "text-secondary-foreground")} />
                  {nutrient.name}: {nutrient.actualValue}{nutrient.unit} ({nutrient.value}% RDA)
                </Badge>
              ))}
            </div>
             <Alert> <TrendingUp className="h-4 w-4" /> <AlertTitle>AI Nutrient Trend</AlertTitle> <AlertDescription> {nutrientTrend?.trendInsight || "Keep logging meals for detailed nutrient trends."} </AlertDescription> </Alert>
            </>}
          </CardContent>
        </Card>
      )}
      
      <Card className="shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Utensils className="text-primary"/> Recipes</CardTitle></CardHeader><CardContent>{plan === 'free' && <p className="text-muted-foreground">Access 5 complimentary eco-friendly recipes. <Button variant="link" disabled className="p-0 h-auto">View Recipes (Soon)</Button></p>}{(plan === 'pro' || plan === 'ecopro') && <p className="text-muted-foreground">Access 50+ premium recipes. <Button variant="link" disabled className="p-0 h-auto">Explore Premium Recipes (Soon)</Button></p>}</CardContent></Card>

      {(plan === 'pro' || plan === 'ecopro') && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2"><Zap /> Pro Features Active</h2>
          <Card className="shadow-md border-l-4 border-green-500"><CardHeader><CardTitle className="flex items-center gap-2 text-green-700"><Brain className="h-6 w-6"/>Advanced AI Insights</CardTitle></CardHeader><CardContent><ul className="list-disc list-inside space-y-1 text-muted-foreground"><li>Unlimited AI Meal Scans.</li><li>Detailed macro & micro-nutrient breakdowns.</li><li>Meal-by-meal carbon footprint tracking (view in Meal Timeline).</li></ul>{(plan === 'pro' || plan === 'ecopro') && <Badge variant="default" className="mt-3"><CheckCircle className="mr-1 h-4 w-4"/> Ad-Free Experience</Badge>}</CardContent></Card>
          <Card className="shadow-md border-l-4 border-blue-500"><CardHeader><CardTitle className="flex items-center gap-2 text-blue-700"><MessageSquareHeart className="h-6 w-6"/>Personalized AI Coach</CardTitle></CardHeader>
            <CardContent>
              {isLoadingAI.coach ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/> :
              coachRecommendations ? (
                <>
                  <p className="text-muted-foreground font-semibold">Goal Adjustments:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-3">{coachRecommendations.goalAdjustments.map((item, i) => <li key={`ga-${i}`}>{item}</li>) || <li>No specific adjustments now.</li>}</ul>
                  <p className="text-muted-foreground font-semibold">Meal Timing Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">{coachRecommendations.mealTimingSuggestions.map((item, i) => <li key={`mt-${i}`}>{item}</li>) || <li>No specific timing suggestions now.</li>}</ul>
                   {coachRecommendations.generalTips && coachRecommendations.generalTips.length > 0 && (<><p className="text-muted-foreground font-semibold mt-2">General Tips:</p><ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">{coachRecommendations.generalTips.map((item, i) => <li key={`gt-${i}`}>{item}</li>)}</ul></>)}
                </>
              ) : (<p className="text-muted-foreground">AI Coach insights will appear here.</p>)}
               <Button variant="outline" className="mt-4" disabled>More Coach Insights (Soon)</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-indigo-500"><CardHeader><CardTitle className="flex items-center gap-2 text-indigo-700"><TrendingUp className="h-6 w-6" /> Weekly Progress</CardTitle><CardDescription>Track trends and get AI forecasts.</CardDescription></CardHeader>
            <CardContent><Tabs defaultValue="weight" className="w-full"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="weight">Weight Trend</TabsTrigger><TabsTrigger value="carbon">Carbon Savings</TabsTrigger><TabsTrigger value="forecast">AI Forecast</TabsTrigger></TabsList>
                <TabsContent value="weight"><div className="mt-4 h-48 bg-muted/50 rounded-md flex items-center justify-center p-4"><p className="text-muted-foreground text-center">Weight trend chart (Placeholder).</p></div></TabsContent>
                <TabsContent value="carbon"><div className="mt-4 h-48 bg-muted/50 rounded-md flex items-center justify-center p-4"><p className="text-muted-foreground text-center">Carbon savings chart (Placeholder).</p></div></TabsContent>
                <TabsContent value="forecast"><div className="mt-4 p-4 border rounded-md bg-muted/30"><p className="text-sm font-semibold text-primary">AI Forecast (Example):</p><p className="text-muted-foreground text-sm mt-1">"Keep up current efforts! Projected to lose 0.5kg next week."</p><Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary" disabled>Learn more</Button></div></TabsContent>
              </Tabs></CardContent><CardFooter><Button className="w-full" variant="outline" disabled>Detailed Progress Report (Soon)</Button></CardFooter>
          </Card>
        </section>
      )}

      {plan === 'ecopro' && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2"><Trees /> EcoPro Sustainability Hub</h2>
          <Card className="shadow-md border-l-4 border-teal-500"><CardHeader><CardTitle className="flex items-center gap-2 text-teal-700"><BarChartBig className="h-6 w-6" />Carbon Footprint Analytics</CardTitle></CardHeader>
            <CardContent>
              {isLoadingAI.carbon ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/> :
              carbonComparison ? (
                <>
                  <p className="text-muted-foreground">{carbonComparison.comparisonText}</p>
                  <p className="text-xs text-muted-foreground mt-1">Your avg: {carbonComparison.userAverageDailyCF.toFixed(2)} kg CO₂e/day. General avg: {carbonComparison.generalAverageDailyCF.toFixed(2)} kg CO₂e/day.</p>
                </>
              ) : (<p className="text-muted-foreground">Carbon comparison data will appear here after logging meals.</p>)}
              <Button variant="outline" className="mt-4" disabled>Full Analytics (Soon)</Button>
            </CardContent>
          </Card>
          <Card className="shadow-md border-l-4 border-lime-500"><CardHeader><CardTitle className="flex items-center gap-2 text-lime-700"><Users className="h-6 w-6"/>Eco-Score Leaderboards</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Compete with friends on sustainability scores!</p><Button variant="outline" className="mt-4" disabled>View Leaderboards (Soon)</Button></CardContent></Card>
          
          <Card className="shadow-md border-l-4 border-emerald-500"><CardHeader><CardTitle className="flex items-center gap-2 text-emerald-700"><Leaf className="h-6 w-6"/>AI-Generated Meal Plans</CardTitle></CardHeader>
            <CardContent>
              {isLoadingAI.mealPlan ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/> :
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
              {isLoadingAI.mood ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary"/> :
              foodMoodInsights && foodMoodInsights.insights.length > 0 && (
                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm font-semibold text-primary">AI Insights:</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 mt-1">
                    {foodMoodInsights.insights.map((insight, i) => <li key={`fmi-${i}`}>{insight}</li>)}
                    {!foodMoodInsights.sufficientData && <li>Log moods more consistently for deeper insights.</li>}
                  </ul>
                </div>
              )}
               <Button variant="outline" className="w-full" disabled>Full Mood Analysis (Soon)</Button>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-sky-500"><CardHeader><CardTitle className="flex items-center gap-2 text-sky-700"><Globe2 className="h-6 w-6" /> Sustainability Impact</CardTitle><CardDescription>See how your diet compares.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="space-y-2 text-sm"><div className="flex justify-between items-center p-2 border rounded-md"><span>Your Diet vs. Local Average:</span><Badge variant="secondary" className="text-green-700 bg-green-100">40% Less CO₂ (Example)</Badge></div><div className="flex justify-between items-center p-2 border rounded-md"><span>Your Diet vs. Global Goals:</span><Badge variant="outline" className="text-orange-700 border-orange-300">1.5x Limit (Example)</Badge></div></div><Alert variant="default" className="bg-primary/5 border-primary/20"><Leaf className="h-4 w-4 text-primary" /><AlertTitle className="text-primary">Suggested Offset Action (Example):</AlertTitle><AlertDescription className="text-muted-foreground">"Walk 2 miles to neutralize recent pasta carbon!"</AlertDescription></Alert><Button variant="outline" className="w-full" disabled>More Impact Data (Soon)</Button></CardContent>
          </Card>
           <div className="mt-4 p-3 bg-primary/10 rounded-md text-primary flex items-center gap-2"><ShieldCheck className="h-5 w-5"/><p className="text-sm">As an EcoPro member, you get Priority Support!</p></div>
        </section>
      )}
      
      {!isClient && plan === 'free' && !aiScanUsage && (<Card><CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Loading Usage...</CardTitle></CardHeader><CardContent><div className="h-10 bg-muted animate-pulse rounded-md"></div></CardContent></Card>)}
    </div>
  );
}
