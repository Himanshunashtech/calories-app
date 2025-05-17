
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CalendarDays, ShoppingBag, Sparkles, PlusCircle, ArrowLeft, ArrowRight, Printer, Download, Loader2 } from 'lucide-react';
import { getSelectedPlan, type UserPlan, getUserProfile, type UserProfile } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';
import { generateEcoMealPlan, type GenerateEcoMealPlanOutput } from '@/ai/flows/generate-eco-meal-plan';
import { cn } from '@/lib/utils';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface PlannerMealItem {
  id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories?: number;
  ecoScore?: string;
  description?: string;
}

interface WeeklyPlanDay {
  Breakfast?: PlannerMealItem[];
  Lunch?: PlannerMealItem[];
  Dinner?: PlannerMealItem[];
  Snack?: PlannerMealItem[];
}

interface WeeklyPlan {
  [day: string]: WeeklyPlanDay;
}

export default function MealPlannerPage() {
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [generatedPlanOutput, setGeneratedPlanOutput] = useState<GenerateEcoMealPlanOutput | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setUserPlan(getSelectedPlan());
    const profile = getUserProfile();
    setUserProfile(profile);
    
    const savedPlanJson = localStorage.getItem('mealPlan');
    if (savedPlanJson) {
      try {
        setWeeklyPlan(JSON.parse(savedPlanJson));
      } catch (e) { console.error("Error parsing saved meal plan", e); localStorage.removeItem('mealPlan');}
    }
    const savedGeneratedOutputJson = localStorage.getItem('generatedMealPlanOutput');
    if (savedGeneratedOutputJson) {
       try {
        setGeneratedPlanOutput(JSON.parse(savedGeneratedOutputJson));
       } catch (e) { console.error("Error parsing saved generated output", e); localStorage.removeItem('generatedMealPlanOutput');}
    }
  }, []);
  
  const handleGenerateAIMealPlan = async () => {
    if (!userProfile || (userPlan !== 'pro' && userPlan !== 'ecopro')) {
      toast({ variant: "destructive", title: "Feature Unavailable", description: "AI Meal Plan generation is a Pro/EcoPro feature." });
      return;
    }
    setIsLoadingAI(true);
    try {
      const planOutput = await generateEcoMealPlan({
        userProfile: {
          dietType: userProfile.dietType,
          healthGoals: userProfile.healthGoals,
          dietaryRestrictions: Array.isArray(userProfile.dietaryRestrictions) ? userProfile.dietaryRestrictions.join(', ') : userProfile.dietaryRestrictions,
        },
        durationDays: 7, // Ensure it generates for 7 days to fill the week
      });
      setGeneratedPlanOutput(planOutput);
      localStorage.setItem('generatedMealPlanOutput', JSON.stringify(planOutput));

      const newWeeklyPlan: WeeklyPlan = {};
      daysOfWeek.forEach(day => newWeeklyPlan[day] = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] }); 

      planOutput.mealPlan.forEach((dayPlan, dayIndex) => {
        const dayName = daysOfWeek[dayIndex % 7]; // Cycle through daysOfWeek
        if (!newWeeklyPlan[dayName]) newWeeklyPlan[dayName] = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
        
        // Simple distribution: first meal breakfast, second lunch, third dinner
        if (dayPlan.meals[0]) {
          newWeeklyPlan[dayName].Breakfast = [{ id: `ai-bf-${dayName}-${dayIndex}`, name: dayPlan.meals[0].name, category: 'Breakfast', ecoScore: dayPlan.meals[0].lowCarbonScore.toString(), description: dayPlan.meals[0].description }];
        }
        if (dayPlan.meals[1]) {
          newWeeklyPlan[dayName].Lunch = [{ id: `ai-ln-${dayName}-${dayIndex}`, name: dayPlan.meals[1].name, category: 'Lunch', ecoScore: dayPlan.meals[1].lowCarbonScore.toString(), description: dayPlan.meals[1].description }];
        }
        if (dayPlan.meals[2]) {
          newWeeklyPlan[dayName].Dinner = [{ id: `ai-dn-${dayName}-${dayIndex}`, name: dayPlan.meals[2].name, category: 'Dinner', ecoScore: dayPlan.meals[2].lowCarbonScore.toString(), description: dayPlan.meals[2].description }];
        }
      });
      setWeeklyPlan(newWeeklyPlan);
      localStorage.setItem('mealPlan', JSON.stringify(newWeeklyPlan));
      toast({ title: "AI Meal Plan Generated!", description: "Your 7-day meal plan has been created." });
    } catch (error) {
      console.error("Error generating AI meal plan:", error);
      toast({ variant: "destructive", title: "AI Plan Error", description: "Could not generate meal plan. Please try again." });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getWeekDisplay = () => {
    const today = new Date();
    today.setDate(today.getDate() + currentWeekOffset * 7);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); // Monday as start
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, options)}`;
  };
  
  const handlePlaceholderFeatureClick = (featureName: string) => {
    toast({
      title: `${featureName} Coming Soon!`,
      description: `This feature will be available in a future update.`,
    });
  };


  if (!isClient) {
    return (
      <div className="space-y-6">
        <Card className="shadow-xl"><CardHeader><div className="h-8 w-1/2 bg-muted rounded animate-pulse"></div></CardHeader><CardContent><div className="h-64 bg-muted rounded animate-pulse"></div></CardContent></Card>
        <Card className="shadow-xl"><CardHeader><div className="h-6 w-1/3 bg-muted rounded animate-pulse"></div></CardHeader><CardContent><div className="h-20 bg-muted rounded animate-pulse"></div></CardContent></Card>
      </div>
    );
  }
  
  const canUseAIPlanner = userPlan === 'pro' || userPlan === 'ecopro';

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
              <CalendarDays /> Meal Planner
            </CardTitle>
            {canUseAIPlanner && (
              <Button onClick={handleGenerateAIMealPlan} disabled={isLoadingAI}>
                {isLoadingAI ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Sparkles className="mr-2 h-4 w-4" />}
                AI Generate Week Plan
              </Button>
            )}
          </div>
          <CardDescription>
            {canUseAIPlanner ? "Use AI to generate a weekly meal plan or add meals manually." : "Upgrade to Pro or EcoPro for AI-powered meal plan generation. Manual planning coming soon!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={() => handlePlaceholderFeatureClick('Previous Week')} disabled><ArrowLeft/></Button>
            <h3 className="text-lg font-semibold">{getWeekDisplay()}</h3>
            <Button variant="outline" size="icon" onClick={() => handlePlaceholderFeatureClick('Next Week')} disabled><ArrowRight/></Button>
          </div>

          {Object.keys(weeklyPlan).length === 0 && !isLoadingAI && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your meal planner is empty for this week.</p>
              {canUseAIPlanner && <p>Try using the "AI Generate Week Plan" button above!</p>}
              <p className="text-xs mt-2">Manual meal adding coming soon.</p>
            </div>
          )}
           {isLoadingAI && Object.keys(weeklyPlan).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2"/>
              <p>Generating your AI meal plan...</p>
            </div>
          )}


          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
            {daysOfWeek.map(day => (
              <Card key={day} className="min-h-[250px] flex flex-col bg-muted/20">
                <CardHeader className="p-2 bg-muted/50">
                  <CardTitle className="text-sm font-semibold text-center">{day}</CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1 flex-grow">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(mealType => (
                    <div key={mealType} className="text-xs p-1.5 border-b border-dashed last:border-b-0 min-h-[50px]">
                      <p className="font-medium text-muted-foreground">{mealType}</p>
                      {weeklyPlan[day]?.[mealType as keyof WeeklyPlanDay]?.map(item => (
                        <div key={item.id} className="p-1 my-0.5 rounded bg-card shadow-sm">
                            <p className="font-semibold truncate text-primary/90">{item.name}</p>
                            {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                            {item.ecoScore && <p className="text-xs text-green-600">Eco: {item.ecoScore}/5</p>}
                        </div>
                      ))}
                      {(!weeklyPlan[day]?.[mealType as keyof WeeklyPlanDay] || weeklyPlan[day]?.[mealType as keyof WeeklyPlanDay]?.length === 0) && <p className="text-gray-400 italic text-xs">No meal planned</p>}
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="p-1 mt-auto">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => handlePlaceholderFeatureClick('Add Meal to Planner')}><PlusCircle className="mr-1 h-3 w-3"/>Add Meal</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <ShoppingBag /> Grocery List
          </CardTitle>
          <CardDescription>
            {canUseAIPlanner ? "Auto-generated based on your AI-planned meals." : "Upgrade to Pro/EcoPro for AI-generated grocery lists."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedPlanOutput && generatedPlanOutput.groceryList.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground columns-1 sm:columns-2 md:columns-3 max-h-60 overflow-y-auto">
              {generatedPlanOutput.groceryList.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              {canUseAIPlanner ? 
              (isLoadingAI ? "Generating list..." : "Generate an AI meal plan to see your grocery list here.") : 
              "Your grocery list will appear here once meals are planned."}
            </p>
          )}
        </CardContent>
        <CardFooter className="gap-2">
            <Button variant="outline" onClick={() => handlePlaceholderFeatureClick('Print Grocery List')}><Printer className="mr-2 h-4 w-4"/> Print List</Button>
            <Button variant="outline" onClick={() => handlePlaceholderFeatureClick('Export Grocery List')}><Download className="mr-2 h-4 w-4"/> Export List</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

    
