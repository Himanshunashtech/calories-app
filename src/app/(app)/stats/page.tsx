
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getMealLogs, clearMealLogs, getSelectedPlan, type UserPlan } from '@/lib/localStorage';
import type { MealEntry } from '@/types';
import { CalendarDays, Utensils, Leaf, Trash2, Info, ShieldCheck, TrendingUp, Activity, PieChart as PieChartIcon, NotebookText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DAILY_CALORIE_GOAL = 2000; // Example goal

const MACRO_COLORS = {
  protein: 'hsl(var(--chart-1))', 
  carbs: 'hsl(var(--chart-2))', 
  fat: 'hsl(var(--chart-3))', 
};
const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
};

export default function StatsPage() {
  const [mealLogs, setMealLogs] = useState<MealEntry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    setMealLogs(getMealLogs());
    setUserPlan(getSelectedPlan());
  }, []);
  
  const refreshLogs = () => {
    setMealLogs(getMealLogs());
  }

  const todayISO = useMemo(() => {
    if (!isClient) return new Date().toISOString().split('T')[0]; // Fallback for SSR, though client check helps
    return new Date().toISOString().split('T')[0];
  }, [isClient]);


  const todaysLogs = useMemo(() => {
    if (!isClient) return [];
    return mealLogs.filter(log => log.date.startsWith(todayISO));
  }, [mealLogs, todayISO, isClient]
  );

  const totalCaloriesToday = useMemo(() => 
    todaysLogs.reduce((sum, log) => sum + log.calories, 0),
    [todaysLogs]
  );

  const totalMacrosToday = useMemo(() => {
    return todaysLogs.reduce(
      (acc, log) => {
        acc.protein += log.protein;
        acc.carbs += log.carbs;
        acc.fat += log.fat;
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0 }
    );
  }, [todaysLogs]);

  const calorieProgress = Math.min((totalCaloriesToday / DAILY_CALORIE_GOAL) * 100, 100);

  const macroPieChartDataToday = [
    { name: 'Protein', value: parseFloat(totalMacrosToday.protein.toFixed(1)), fill: MACRO_COLORS.protein },
    { name: 'Carbs', value: parseFloat(totalMacrosToday.carbs.toFixed(1)), fill: MACRO_COLORS.carbs },
    { name: 'Fat', value: parseFloat(totalMacrosToday.fat.toFixed(1)), fill: MACRO_COLORS.fat },
  ].filter(macro => macro.value > 0);

  const recentMeals = useMemo(() => 
    [...mealLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [mealLogs]
  );

  // --- New Statistics Calculations ---

  const dailyLogData = useMemo(() => {
    if (!isClient) return {};
    const dailyData: { [date: string]: { calories: number, protein: number, carbs: number, fat: number, mealCount: number } } = {};
    mealLogs.forEach(log => {
      const dateKey = log.date.split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 };
      }
      dailyData[dateKey].calories += log.calories;
      dailyData[dateKey].protein += log.protein;
      dailyData[dateKey].carbs += log.carbs;
      dailyData[dateKey].fat += log.fat;
      dailyData[dateKey].mealCount += 1;
    });
    return dailyData;
  }, [mealLogs, isClient]);

  const overallAverages = useMemo(() => {
    if (!isClient || Object.keys(dailyLogData).length === 0) {
      return { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, loggedDays: 0 };
    }
    const numDays = Object.keys(dailyLogData).length;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const date in dailyLogData) {
      totalCalories += dailyLogData[date].calories;
      totalProtein += dailyLogData[date].protein;
      totalCarbs += dailyLogData[date].carbs;
      totalFat += dailyLogData[date].fat;
    }
    return {
      avgCalories: totalCalories / numDays,
      avgProtein: totalProtein / numDays,
      avgCarbs: totalCarbs / numDays,
      avgFat: totalFat / numDays,
      loggedDays: numDays,
    };
  }, [dailyLogData, isClient]);

  const weeklyCalorieTrendData = useMemo(() => {
    if (!isClient) return [];
    const sortedDates = Object.keys(dailyLogData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const last7LoggedDaysData = sortedDates.slice(-7).map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calories: dailyLogData[date].calories,
    }));
    return last7LoggedDaysData;
  }, [dailyLogData, isClient]);

  const overallMacroDistribution = useMemo(() => {
    if (!isClient || mealLogs.length === 0) return [];
    let totalProteinGrams = 0;
    let totalCarbsGrams = 0;
    let totalFatGrams = 0;

    mealLogs.forEach(log => {
      totalProteinGrams += log.protein;
      totalCarbsGrams += log.carbs;
      totalFatGrams += log.fat;
    });

    const totalProteinCalories = totalProteinGrams * CALORIES_PER_GRAM.protein;
    const totalCarbsCalories = totalCarbsGrams * CALORIES_PER_GRAM.carbs;
    const totalFatCalories = totalFatGrams * CALORIES_PER_GRAM.fat;
    const totalCaloriesAll = totalProteinCalories + totalCarbsCalories + totalFatCalories;

    if (totalCaloriesAll === 0) return [];

    return [
      { name: 'Protein', value: parseFloat(((totalProteinCalories / totalCaloriesAll) * 100).toFixed(1)), fill: MACRO_COLORS.protein },
      { name: 'Carbs', value: parseFloat(((totalCarbsCalories / totalCaloriesAll) * 100).toFixed(1)), fill: MACRO_COLORS.carbs },
      { name: 'Fat', value: parseFloat(((totalFatCalories / totalCaloriesAll) * 100).toFixed(1)), fill: MACRO_COLORS.fat },
    ].filter(macro => macro.value > 0);
  }, [mealLogs, isClient]);
  
  const handleClearHistory = () => {
    clearMealLogs();
    refreshLogs();
    toast({
      title: "History Cleared",
      description: "All your meal logs have been deleted.",
      action: <Trash2 className="h-5 w-5 text-destructive"/>
    });
  };

  if (!isClient) {
    return (
        <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="shadow-lg">
                <CardHeader><div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2"></div><div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div></CardHeader>
                <CardContent><div className={cn("bg-muted rounded animate-pulse", i % 2 === 0 ? "h-20" : "h-40" )}></div></CardContent>
              </Card>
            ))}
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CalendarDays className="h-7 w-7 text-primary" />
                Today's Summary
              </CardTitle>
              <CardDescription>Your caloric intake and progress for today.</CardDescription>
            </div>
            {(userPlan === 'pro' || userPlan === 'ecopro') && (
                 <Badge variant="default"><ShieldCheck className="mr-1 h-4 w-4" /> Pro Insights Enabled</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-3xl font-bold text-primary">{totalCaloriesToday.toFixed(0)}</span>
              <span className="text-sm text-muted-foreground">/ {DAILY_CALORIE_GOAL} kcal</span>
            </div>
            <Progress value={calorieProgress} aria-label={`${calorieProgress.toFixed(0)}% of daily calorie goal`} className="h-3 [&>div]:bg-primary" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {calorieProgress >= 100 ? "Goal reached! Well done!" : `${(DAILY_CALORIE_GOAL - totalCaloriesToday).toFixed(0)} kcal remaining.`}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Leaf className="h-6 w-6 text-primary" />
            Macronutrient Breakdown (Today)
          </CardTitle>
          <CardDescription>Protein, Carbohydrates, and Fats consumed today.</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysLogs.length > 0 && macroPieChartDataToday.length > 0 ? (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={macroPieChartDataToday}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => `${name}: ${value}g (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {macroPieChartDataToday.map((entry, index) => (
                      <Cell key={`cell-today-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}g`, name]}/>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
              <Info className="h-8 w-8" />
              <p>No macronutrient data for today yet.</p>
              <p className="text-xs">Log a meal to see your macro breakdown.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- New Statistics Cards --- */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Activity className="h-6 w-6 text-primary"/>Overall Averages</CardTitle>
          <CardDescription>Your average daily intake based on all logged meals.</CardDescription>
        </CardHeader>
        <CardContent>
          {overallAverages.loggedDays > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div><p className="text-2xl font-semibold">{overallAverages.avgCalories.toFixed(0)}</p><p className="text-xs text-muted-foreground">Avg. Calories/Day</p></div>
              <div><p className="text-2xl font-semibold">{overallAverages.avgProtein.toFixed(1)}g</p><p className="text-xs text-muted-foreground">Avg. Protein/Day</p></div>
              <div><p className="text-2xl font-semibold">{overallAverages.avgCarbs.toFixed(1)}g</p><p className="text-xs text-muted-foreground">Avg. Carbs/Day</p></div>
              <div><p className="text-2xl font-semibold">{overallAverages.avgFat.toFixed(1)}g</p><p className="text-xs text-muted-foreground">Avg. Fat/Day</p></div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Not enough data for averages. Keep logging!</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><TrendingUp className="h-6 w-6 text-primary"/>Weekly Calorie Trend</CardTitle>
          <CardDescription>Calories consumed over the last 7 logged days.</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyCalorieTrendData.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={weeklyCalorieTrendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar dataKey="calories" name="Calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Log meals for a few days to see your trend.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><PieChartIcon className="h-6 w-6 text-primary"/>Overall Macronutrient Distribution</CardTitle>
          <CardDescription>Percentage of total calories from Protein, Carbs, and Fat.</CardDescription>
        </CardHeader>
        <CardContent>
          {overallMacroDistribution.length > 0 ? (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={overallMacroDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {overallMacroDistribution.map((entry, index) => (
                      <Cell key={`cell-overall-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}% of Calories`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <p className="text-muted-foreground text-center py-4">Log meals to see your overall macro distribution.</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><NotebookText className="h-6 w-6 text-primary"/>Logbook Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-3xl font-semibold">{mealLogs.length}</p>
            <p className="text-xs text-muted-foreground">Total Meals Logged</p>
          </div>
           <div>
            <p className="text-3xl font-semibold">{overallAverages.loggedDays}</p>
            <p className="text-xs text-muted-foreground">Unique Days Logged</p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Utensils className="h-6 w-6 text-primary" />
            Recent Meals
          </CardTitle>
          <CardDescription>Your last few logged meals.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMeals.length > 0 ? (
            <ul className="space-y-3">
              {recentMeals.map(log => (
                <li key={log.id} className="flex items-center justify-between p-3 bg-card rounded-md border">
                  <div className="flex-1 min-w-0"> {/* Added for text truncation */}
                    <p className="font-medium truncate">{log.description || "Meal Photo"}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.calories.toFixed(0)} kcal - {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  {log.photoDataUri && (
                     <Image src={log.photoDataUri} alt={log.description || "Meal"} width={40} height={40} className="rounded-sm object-cover ml-3 flex-shrink-0" data-ai-hint="food meal"/>
                  )}
                </li>
              ))}
            </ul>
          ) : (
             <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                <Info className="h-8 w-8" />
                <p>No meals logged yet.</p>
                <p className="text-xs">Start by logging your first meal!</p>
            </div>
          )}
        </CardContent>
         <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={mealLogs.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear All Meal History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your meal logs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory}>
                  Yes, delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
