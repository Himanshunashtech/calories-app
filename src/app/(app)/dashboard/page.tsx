
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  getSelectedPlan, 
  getAIScanUsage, 
  getWaterIntake,
  addWater,
  getMealLogs,
  type UserPlan, 
  type AIScanUsage as AIScanUsageType,
  type WaterIntakeData,
  type MealEntry
} from '@/lib/localStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, Camera, Leaf, Utensils, ShieldCheck, Zap, Brain, Trees, BarChartBig, Users, MessageSquareHeart, 
  CheckCircle, AlertTriangle, Info, Droplet, Footprints, TrendingUp, PlusCircle, Target as TargetIcon, Maximize2, Grape, Fish, Shell
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const DAILY_CALORIE_GOAL = 2000; // Example goal, consider making this part of user profile

export default function DashboardPage() {
  const [plan, setPlan] = useState<UserPlan>('free');
  const [aiScanUsage, setAiScanUsage] = useState<AIScanUsageType | null>(null);
  const [waterIntake, setWaterIntake] = useState<WaterIntakeData | null>(null);
  const [todaysMealLogs, setTodaysMealLogs] = useState<MealEntry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const currentPlan = getSelectedPlan();
    setPlan(currentPlan);
    if (currentPlan === 'free') {
      setAiScanUsage(getAIScanUsage());
    }
    setWaterIntake(getWaterIntake());
    
    const allLogs = getMealLogs();
    const todayISO = new Date().toISOString().split('T')[0];
    setTodaysMealLogs(allLogs.filter(log => log.date.startsWith(todayISO)));

  }, []);
  
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
      description: `You've logged ${amount > 1 ? `${amount} units` : `${amount} glass`} of water. Current: ${newIntake.current}/${newIntake.goal}.`,
      action: <Droplet className="h-5 w-5 text-blue-500"/>
    });
  };

  const scansUsedPercentage = aiScanUsage ? (aiScanUsage.count / aiScanUsage.limit) * 100 : 0;

  const getCalorieProgressColor = () => {
    if (calorieProgressPercentage < 75) return 'bg-primary'; // Green (using primary)
    if (calorieProgressPercentage < 100) return 'bg-yellow-500'; // Yellow
    return 'bg-destructive'; // Red
  };
  
  // Placeholder data for nutrient breakdown
  const nutrientData = [
    { name: 'Iron', value: 75, low: false, icon: Shell, tip: "Great source of Iron!" },
    { name: 'Vitamin D', value: 30, low: true, icon: Fish, tip: "Low Vitamin D. Try fatty fish or fortified foods." },
    { name: 'Fiber', value: 60, low: false, icon: Grape, tip: "Good fiber intake today." },
    { name: 'Calcium', value: 80, low: false, icon: Maximize2, tip: "Calcium levels look good." },
  ];


  if (!isClient) {
    return (
      <div className="space-y-6 p-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              {(i % 2 === 0) && <div className="h-20 mt-2 bg-muted rounded animate-pulse"></div>}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome and Plan Info */}
      <Card className="shadow-lg bg-gradient-to-br from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Welcome to your EcoAI Dashboard!</CardTitle>
          <CardDescription className="text-lg">
            Your central hub for tracking nutrition and sustainability. Current plan: <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize text-sm ml-1">{plan}</Badge>
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/subscription')} variant="outline">
            Manage Subscription
          </Button>
        </CardFooter>
      </Card>

      {/* Free Tier Limitations & Ads */}
      {plan === 'free' && (
        <Card className="shadow-md border-l-4 border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-6 w-6" />Free Tier Limitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">You are currently on the Free plan. Upgrade to unlock more features!</p>
            {aiScanUsage && (
              <div>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium">AI Meal Scans Used:</span>
                    <span className="text-sm text-muted-foreground">{aiScanUsage.count} / {aiScanUsage.limit} this month</span>
                </div>
                <Progress value={scansUsedPercentage} aria-label={`${aiScanUsage.count} of ${aiScanUsage.limit} AI scans used`} className="h-2 [&>div]:bg-amber-500" />
                 <p className="text-xs text-muted-foreground mt-1">Results may be watermarked. Scans reset monthly.</p>
              </div>
            )}
            <div className="mt-4 p-4 bg-muted rounded-lg text-center">
              <p className="text-sm font-semibold text-muted-foreground">Advertisement</p>
              <Image src="https://placehold.co/300x100.png" data-ai-hint="advertisement banner" alt="Placeholder Ad" width={300} height={100} className="mx-auto mt-2 rounded shadow"/>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Vitals Card */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TargetIcon className="text-primary"/> Today's Vitals</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Calorie Ring / Progress */}
          <div className="space-y-2 p-3 rounded-lg border bg-card">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>Calories</span>
              <span className="text-muted-foreground">{totalCaloriesToday.toFixed(0)} / {DAILY_CALORIE_GOAL} kcal</span>
            </div>
            <Progress value={calorieProgressPercentage} className={cn("h-3", getCalorieProgressColor())} />
            <p className="text-xs text-muted-foreground text-center pt-1">
              {calorieProgressPercentage >= 100 ? "Goal reached!" : `${(DAILY_CALORIE_GOAL - totalCaloriesToday).toFixed(0)} kcal remaining.`}
            </p>
          </div>

          {/* Water Intake Tracker */}
          <div className="space-y-2 p-3 rounded-lg border bg-card">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="flex items-center gap-1"><Droplet className="h-4 w-4 text-blue-500"/>Water Intake</span>
              <span className="text-muted-foreground">{waterIntake?.current || 0} / {waterIntake?.goal || 8} glasses</span>
            </div>
            <Progress value={waterIntake ? (waterIntake.current / waterIntake.goal) * 100 : 0} className="h-3 [&>div]:bg-blue-500" />
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => handleAddWater(1)} className="flex-1 text-xs">
                +1 Glass
              </Button>
               <Button size="sm" variant="outline" onClick={() => handleAddWater(0.5)} className="flex-1 text-xs">
                +0.5 Glass
              </Button>
            </div>
          </div>
          
          {/* Step Counter (Placeholder) */}
          <div className="space-y-2 p-3 rounded-lg border bg-card flex flex-col items-center justify-center">
            <Footprints className="h-8 w-8 text-primary mb-1"/>
            <p className="text-lg font-semibold">7,532</p>
            <p className="text-xs text-muted-foreground">Steps Today</p>
            <Button size="sm" variant="ghost" className="text-xs mt-1 text-primary hover:underline" disabled>Sync Health App</Button>
          </div>

          {/* Eco-Score (Placeholder) */}
          <div className="space-y-2 p-3 rounded-lg border bg-card flex flex-col items-center justify-center">
            <Leaf className="h-8 w-8 text-green-600 mb-1"/>
            <p className="text-lg font-semibold">B+</p>
            <p className="text-xs text-muted-foreground">Daily Eco-Score</p>
            <p className="text-xs text-muted-foreground mt-1">(Coming Soon)</p>
          </div>
        </CardContent>
      </Card>

      {/* Meal Timeline */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Utensils className="text-primary"/> Today's Meals</CardTitle>
          <CardDescription>A timeline of your meals logged today.</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysMealLogs.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-4 pb-4">
                {todaysMealLogs.map(meal => (
                  <Card key={meal.id} className="min-w-[200px] max-w-[250px] shrink-0">
                    <CardHeader className="p-3">
                      {meal.photoDataUri && (
                        <Image src={meal.photoDataUri} alt={meal.description || "Meal"} width={200} height={120} className="rounded-md object-cover w-full aspect-[16/9]" data-ai-hint="food meal"/>
                      )}
                      <CardTitle className="text-base mt-2 truncate">{meal.description || "Meal Photo"}</CardTitle>
                      <CardDescription className="text-xs">{new Date(meal.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 text-xs space-y-1">
                      <p><span className="font-medium">{meal.calories.toFixed(0)} kcal</span></p>
                      <p className="text-muted-foreground">P: {meal.protein.toFixed(1)}g, C: {meal.carbs.toFixed(1)}g, F: {meal.fat.toFixed(1)}g</p>
                      {plan === 'ecopro' && <p className="text-teal-600 text-xs flex items-center gap-1"><Trees className="h-3 w-3"/>~0.8 kg CO₂e (EcoPro)</p>}
                    </CardContent>
                    <CardFooter className="p-3">
                       <Button variant="ghost" size="sm" className="w-full text-xs" disabled>Recreate Meal</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-4">No meals logged for today yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Camera className="text-primary"/> Log Meal</CardTitle>
            <CardDescription>Quickly log your meals, manually or with AI.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/log-meal" passHref legacyBehavior><Button className="w-full">Go to Log Meal</Button></Link>
          </CardFooter>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/> View Stats</CardTitle>
            <CardDescription>Track your progress and nutritional trends.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/stats" passHref legacyBehavior><Button className="w-full">Go to Stats</Button></Link>
          </CardFooter>
        </Card>
      </div>

      {/* Nutrient Breakdown Widget (Pro/EcoPro) */}
      {(plan === 'pro' || plan === 'ecopro') && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Brain className="text-primary"/>Nutrient Breakdown</CardTitle>
            <CardDescription>Micronutrient insights from today's meals. (Illustrative)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              {nutrientData.map(nutrient => (
                <Badge 
                  key={nutrient.name} 
                  variant={nutrient.low ? "destructive" : "secondary"}
                  className={cn("p-2 text-sm flex items-center gap-1.5", nutrient.low && "animate-pulse")}
                >
                  <nutrient.icon className={cn("h-4 w-4", nutrient.low ? "text-destructive-foreground" : "text-secondary-foreground")} />
                  {nutrient.name}: {nutrient.value}% RDA
                </Badge>
              ))}
            </div>
             <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>AI Health Tip (Placeholder)</AlertTitle>
              <AlertDescription>
                {nutrientData.find(n => n.low)?.tip || "Keep up the balanced diet! Consider adding more leafy greens for diverse nutrients."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
      
      {/* Recipes Card (Placeholder) */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Utensils className="text-primary"/> Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          {plan === 'free' && <p className="text-muted-foreground">Access 5 complimentary eco-friendly recipes. <Link href="#" className="text-primary hover:underline">View Recipes (Coming Soon)</Link></p>}
          {(plan === 'pro' || plan === 'ecopro') && <p className="text-muted-foreground">Access 50+ premium recipes. Filter by diet, sustainability, and more! <Link href="#" className="text-primary hover:underline">Explore Premium Recipes (Coming Soon)</Link></p>}
        </CardContent>
      </Card>

      {/* Pro Features Unlocked */}
      {(plan === 'pro' || plan === 'ecopro') && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2"><Zap /> Pro Features Active</h2>
          <Card className="shadow-md border-l-4 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700"><Brain className="h-6 w-6"/>Advanced AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Unlimited AI Meal Scans.</li>
                <li>Detailed macro & micro-nutrient breakdowns (view in Stats & here).</li>
                 <li>Meal-by-meal carbon footprint tracking (view in Meal Timeline - EcoPro enhances this).</li>
              </ul>
              {(plan === 'pro' || plan === 'ecopro') && <Badge variant="default" className="mt-3"><CheckCircle className="mr-1 h-4 w-4"/> Ad-Free Experience</Badge>}
            </CardContent>
          </Card>
          <Card className="shadow-md border-l-4 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700"><MessageSquareHeart className="h-6 w-6"/>Personalized AI Coach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your AI coach provides (placeholders):</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Weekly goal adjustments (e.g., "Increase protein to 120g/day").</li>
                <li>Meal timing suggestions (e.g., "Eat carbs post-workout").</li>
              </ul>
               <Button variant="outline" className="mt-4" disabled>View Coach Recommendations (Coming Soon)</Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* EcoPro Sustainability Hub */}
      {plan === 'ecopro' && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2"><Trees /> EcoPro Sustainability Hub</h2>
          <Card className="shadow-md border-l-4 border-teal-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700"><BarChartBig className="h-6 w-6" />Carbon Footprint Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Enhanced meal carbon footprint tracking (Meal Timeline).</li>
                <li>Compare your diet's CO2 emissions to regional averages.</li>
                <li>Track your meal-related carbon offsets (e.g., "Your meals = 12kg CO2 → Plant 1 tree to neutralize").</li>
              </ul>
              <Button variant="outline" className="mt-4" disabled>View Full Analytics (Coming Soon)</Button>
            </CardContent>
          </Card>
          <Card className="shadow-md border-l-4 border-lime-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lime-700"><Users className="h-6 w-6"/>Eco-Score Leaderboards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Compete with friends on sustainability scores and earn badges!</p>
              <Button variant="outline" className="mt-4" disabled>View Leaderboards (Coming Soon)</Button>
            </CardContent>
          </Card>
          <Card className="shadow-md border-l-4 border-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700"><Leaf className="h-6 w-6"/>AI-Generated Meal Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Auto-generate weekly meal plans with low-carbon recipes.</li>
                <li>Get grocery lists with local and seasonal ingredient suggestions.</li>
              </ul>
              <Button className="mt-4" disabled>Generate My Eco Meal Plan (Coming Soon)</Button>
            </CardContent>
          </Card>
           <div className="mt-4 p-3 bg-primary/10 rounded-md text-primary flex items-center gap-2">
            <ShieldCheck className="h-5 w-5"/>
            <p className="text-sm">As an EcoPro member, you also get Priority Support!</p>
           </div>
        </section>
      )}
      
      {/* Fallback for loading states if somehow missed */}
      {!isClient && plan === 'free' && !aiScanUsage && (
         <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Loading Usage...</CardTitle></CardHeader>
            <CardContent><div className="h-10 bg-muted animate-pulse rounded-md"></div></CardContent>
        </Card>
      )}
    </div>
  );

    