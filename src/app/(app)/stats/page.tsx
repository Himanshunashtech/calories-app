
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image'; // Import Image from next/image
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'; // Removed Image from here
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getMealLogs, clearMealLogs, getSelectedPlan, type UserPlan } from '@/lib/localStorage';
import type { MealEntry } from '@/types';
import { CalendarDays, Utensils, Leaf, Trash2, Info, ShieldCheck } from 'lucide-react';
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


const DAILY_CALORIE_GOAL = 2000; // Example goal

const MACRO_COLORS = {
  protein: 'hsl(var(--chart-1))', 
  carbs: 'hsl(var(--chart-2))', 
  fat: 'hsl(var(--chart-3))', 
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
    if (!isClient) return ''; // Avoid Date() on server for initial render
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

  const macroChartData = [
    { name: 'Protein', value: parseFloat(totalMacrosToday.protein.toFixed(1)), fill: MACRO_COLORS.protein },
    { name: 'Carbs', value: parseFloat(totalMacrosToday.carbs.toFixed(1)), fill: MACRO_COLORS.carbs },
    { name: 'Fat', value: parseFloat(totalMacrosToday.fat.toFixed(1)), fill: MACRO_COLORS.fat },
  ].filter(macro => macro.value > 0);

  const recentMeals = useMemo(() => 
    [...mealLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [mealLogs]
  );
  
  const handleClearHistory = () => {
    clearMealLogs();
    refreshLogs();
    toast({
      title: "History Cleared",
      description: "All your meal logs have been deleted.",
      action: <Trash2 className="h-5 w-5 text-destructive"/>
    });
  };

  useEffect(() => {
    // Ensure date-dependent calculations are re-run on client
    if (isClient) {
        const currentTodayISO = new Date().toISOString().split('T')[0];
        // If for some reason todayISO was not set correctly initially or date changed
        // this doesn't directly re-trigger memos but ensures subsequent updates are correct
    }
  }, [isClient]);


  if (!isClient) {
    return (
        <div className="space-y-6">
            <Card><CardHeader><CardTitle>Loading Stats...</CardTitle></CardHeader><CardContent><div className="h-20 bg-muted animate-pulse rounded-md"></div></CardContent></Card>
            <Card><CardHeader><CardTitle>Loading Macros...</CardTitle></CardHeader><CardContent><div className="h-40 bg-muted animate-pulse rounded-md"></div></CardContent></Card>
            <Card><CardHeader><CardTitle>Loading Recent Meals...</CardTitle></CardHeader><CardContent><div className="h-60 bg-muted animate-pulse rounded-md"></div></CardContent></Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
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
            {isClient && (userPlan === 'pro' || userPlan === 'ecopro') && (
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
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Leaf className="h-7 w-7 text-primary" />
            Macronutrient Breakdown (Today)
          </CardTitle>
          <CardDescription>Protein, Carbohydrates, and Fats consumed today. 
            {isClient && (userPlan === 'pro' || userPlan === 'ecopro') && " Micro-nutrient details available with Pro."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysLogs.length > 0 && macroChartData.length > 0 ? (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={macroChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {macroChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
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
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Utensils className="h-7 w-7 text-primary" />
            Recent Meals
          </CardTitle>
          <CardDescription>Your last few logged meals.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMeals.length > 0 ? (
            <ul className="space-y-3">
              {recentMeals.map(log => (
                <li key={log.id} className="flex items-center justify-between p-3 bg-card rounded-md border">
                  <div>
                    <p className="font-medium">{log.description || "Meal Photo"}</p>
                    <p className="text-sm text-muted-foreground">
                      {log.calories.toFixed(0)} kcal - {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  {log.photoDataUri && (
                     <Image src={log.photoDataUri} alt={log.description || "Meal"} width={40} height={40} className="rounded-sm object-cover" data-ai-hint="food meal"/>
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


    