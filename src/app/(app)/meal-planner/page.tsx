
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CalendarDays, ShoppingBag, Sparkles, PlusCircle, ArrowLeft, ArrowRight, Printer, Download, Loader2, FileText } from 'lucide-react';
import { getSelectedPlan, type UserPlan } from '@/lib/localStorage'; // Removed getUserProfile and UserProfile type from here
import { useToast } from '@/hooks/use-toast';
import { generateEcoMealPlan, type GenerateEcoMealPlanOutput } from '@/ai/flows/generate-eco-meal-plan';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import type { UserProfile } from '@/types'; // Import UserProfile type

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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // For future week navigation
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setUserPlan(getSelectedPlan()); // Plan can still come from localStorage for now

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) {
          console.error("Error fetching profile for meal planner:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load your profile for meal planning." });
        } else if (profileData) {
          setUserProfile(profileData as UserProfile);
        }
      } else {
        // Handle case where user is not logged in, though layout should prevent this
        toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in to use the meal planner." });
      }
      setIsLoadingProfile(false);
    };

    fetchProfile();
    
    // Load saved plan data from local storage (this can be migrated later)
    const savedPlanJson = localStorage.getItem('ecoAi_mealPlan');
    if (savedPlanJson) {
      try {
        setWeeklyPlan(JSON.parse(savedPlanJson));
      } catch (e) { console.error("Error parsing saved meal plan", e); localStorage.removeItem('ecoAi_mealPlan');}
    }
    const savedGeneratedOutputJson = localStorage.getItem('ecoAi_generatedMealPlanOutput');
    if (savedGeneratedOutputJson) {
       try {
        setGeneratedPlanOutput(JSON.parse(savedGeneratedOutputJson));
       } catch (e) { console.error("Error parsing saved generated output", e); localStorage.removeItem('ecoAi_generatedMealPlanOutput');}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleGenerateAIMealPlan = async () => {
    if (!userProfile || (userPlan !== 'pro' && userPlan !== 'ecopro')) {
      toast({ variant: "destructive", title: "Feature Unavailable", description: "AI Meal Plan generation is a Pro/EcoPro feature." });
      return;
    }
    if (isLoadingProfile) {
      toast({ variant: "default", title: "Please wait", description: "Profile data is still loading." });
      return;
    }
    setIsLoadingAI(true);
    try {
      const planOutput = await generateEcoMealPlan({
        userProfile: {
          dietType: userProfile.diet_type,
          healthGoals: userProfile.health_goals,
          dietaryRestrictions: Array.isArray(userProfile.dietary_restrictions) ? userProfile.dietary_restrictions.join(', ') : userProfile.dietary_restrictions as string | undefined,
        },
        durationDays: 7, // Default to 7 days for a weekly plan
      });
      setGeneratedPlanOutput(planOutput);
      localStorage.setItem('ecoAi_generatedMealPlanOutput', JSON.stringify(planOutput));

      const newWeeklyPlan: WeeklyPlan = {};
      daysOfWeek.forEach(day => newWeeklyPlan[day] = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] }); 

      planOutput.mealPlan.forEach((dayPlan, dayIndex) => {
        const dayName = daysOfWeek[dayIndex % 7]; 
        if (!newWeeklyPlan[dayName]) newWeeklyPlan[dayName] = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
        
        dayPlan.meals.forEach((meal, mealIndex) => {
            const plannerItem: PlannerMealItem = {
                id: `ai-${meal.name.replace(/\s+/g, '-').toLowerCase()}-${dayName}-${dayIndex}-${mealIndex}`,
                name: meal.name,
                category: mealIndex === 0 ? 'Breakfast' : mealIndex === 1 ? 'Lunch' : 'Dinner', // Simple distribution
                ecoScore: meal.lowCarbonScore.toString(),
                description: meal.description
            };
            if (mealIndex === 0) newWeeklyPlan[dayName].Breakfast?.push(plannerItem);
            else if (mealIndex === 1) newWeeklyPlan[dayName].Lunch?.push(plannerItem);
            else if (mealIndex === 2) newWeeklyPlan[dayName].Dinner?.push(plannerItem);
        });
      });
      setWeeklyPlan(newWeeklyPlan);
      localStorage.setItem('ecoAi_mealPlan', JSON.stringify(newWeeklyPlan));
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
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); 
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, options)}`;
  };
  
  const handleExportGroceryList = () => {
    if (!generatedPlanOutput || generatedPlanOutput.groceryList.length === 0) {
      toast({ title: "No Grocery List", description: "Generate an AI meal plan first to get a grocery list.", variant: "default" });
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Item\n" // Header row
      + generatedPlanOutput.groceryList.map(item => `"${item.replace(/"/g, '""')}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ecoai_grocery_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Grocery List Exported", description: "Check your downloads for ecoai_grocery_list.csv" });
  };

  const handlePrintGroceryList = () => {
    if (!generatedPlanOutput || generatedPlanOutput.groceryList.length === 0) {
        toast({ title: "No Grocery List", description: "Generate an AI meal plan first to get a grocery list.", variant: "default" });
        return;
    }
    const listHtml = `
        <html>
            <head><title>Grocery List</title>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                h1 { text-align: center; color: hsl(var(--primary)); } /* Use CSS var */
                ul { list-style-type: none; padding: 0; }
                li { padding: 5px 0; border-bottom: 1px solid #eee; }
                li:last-child { border-bottom: none; }
                @media print {
                    body { margin: 0.5in; }
                    h1 { font-size: 18pt; }
                    li { font-size: 10pt; }
                    button { display: none; }
                }
            </style>
            </head>
            <body>
                <h1>Grocery List - EcoAI Calorie Tracker</h1>
                <ul>${generatedPlanOutput.groceryList.map(item => `<li>${item}</li>`).join('')}</ul>
                <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
        </html>`;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(listHtml);
        printWindow.document.close();
    } else {
        toast({ variant: "destructive", title: "Print Error", description: "Could not open print window. Please check your browser settings." });
    }
  };
  
  const handlePlaceholderFeatureClick = (featureName: string) => {
    toast({
      title: `${featureName} Coming Soon!`,
      description: `This feature will be available in a future update.`,
    });
  };


  if (!isClient || isLoadingProfile) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
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
              <Button onClick={handleGenerateAIMealPlan} disabled={isLoadingAI || isLoadingProfile || !userProfile}>
                {isLoadingAI ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Sparkles className="mr-2 h-4 w-4" />}
                AI Generate Week Plan
              </Button>
            )}
          </div>
          <CardDescription>
            {canUseAIPlanner ? "Use AI to generate a weekly meal plan or add meals manually." : "Upgrade to Pro or EcoPro for AI-powered meal plan generation."}
             {!canUseAIPlanner && <span className="block text-xs mt-1">Manual meal adding coming soon.</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={() => handlePlaceholderFeatureClick('Previous Week Navigation')} disabled={isLoadingAI}><ArrowLeft/></Button>
            <h3 className="text-lg font-semibold">{getWeekDisplay()}</h3>
            <Button variant="outline" size="icon" onClick={() => handlePlaceholderFeatureClick('Next Week Navigation')} disabled={isLoadingAI}><ArrowRight/></Button>
          </div>

          {(Object.keys(weeklyPlan).length === 0 && !generatedPlanOutput) && !isLoadingAI && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your meal planner is empty for this week.</p>
              {canUseAIPlanner && <p>Try using the "AI Generate Week Plan" button above!</p>}
              {!canUseAIPlanner && <p className="text-xs mt-2">Manual meal adding will be available soon.</p>}
            </div>
          )}
           {isLoadingAI && (
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
                            <p className="font-semibold truncate text-primary/90" title={item.name}>{item.name}</p>
                            {item.description && <p className="text-xs text-muted-foreground truncate" title={item.description}>{item.description}</p>}
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
        <CardFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={handlePrintGroceryList} disabled={!generatedPlanOutput || generatedPlanOutput.groceryList.length === 0}><Printer className="mr-2 h-4 w-4"/> Print List</Button>
            <Button variant="outline" onClick={handleExportGroceryList} disabled={!generatedPlanOutput || generatedPlanOutput.groceryList.length === 0}><FileText className="mr-2 h-4 w-4"/> Export as CSV</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
    

    