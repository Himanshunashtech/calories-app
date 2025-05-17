
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CalendarDays, ShoppingBag, Sparkles, PlusCircle, ArrowLeft, ArrowRight, Printer, Download } from 'lucide-react';
import { getSelectedPlan, type UserPlan, getUserProfile, type UserProfile } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';
import { generateEcoMealPlan, type GenerateEcoMealPlanOutput } from '@/ai/flows/generate-eco-meal-plan';
import { Loader2 } from 'lucide-react';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Placeholder Meal Item Type
interface PlannerMealItem {
  id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories?: number;
  ecoScore?: string;
}

// Placeholder structure for weekly plan
interface WeeklyPlan {
  [day: string]: {
    Breakfast?: PlannerMealItem[];
    Lunch?: PlannerMealItem[];
    Dinner?: PlannerMealItem[];
    Snack?: PlannerMealItem[];
  };
}

export default function MealPlannerPage() {
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [generatedPlan, setGeneratedPlan] = useState<GenerateEcoMealPlanOutput | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 for current week, -1 for last, 1 for next
  const { toast } = useToast();

  useEffect(() => {
    setUserPlan(getSelectedPlan());
    setUserProfile(getUserProfile());
    // Load saved plan from localStorage or initialize empty
    const savedPlan = localStorage.getItem('mealPlan');
    if (savedPlan) {
      setWeeklyPlan(JSON.parse(savedPlan));
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
        durationDays: 7, // Generate for a full week
      });
      setGeneratedPlan(planOutput);
      // Placeholder: Convert generated plan to weeklyPlan structure
      const newWeeklyPlan: WeeklyPlan = {};
      planOutput.mealPlan.forEach((dayPlan, dayIndex) => {
        const dayName = daysOfWeek[dayIndex % 7]; // Cycle through days if duration > 7
        newWeeklyPlan[dayName] = {
          Breakfast: dayPlan.meals[0] ? [{ id: `ai-bf-${dayIndex}`, name: dayPlan.meals[0].name, category: 'Breakfast', ecoScore: dayPlan.meals[0].lowCarbonScore.toString()}] : [],
          Lunch: dayPlan.meals[1] ? [{ id: `ai-ln-${dayIndex}`, name: dayPlan.meals[1].name, category: 'Lunch', ecoScore: dayPlan.meals[1].lowCarbonScore.toString()}] : [],
          Dinner: dayPlan.meals[2] ? [{ id: `ai-dn-${dayIndex}`, name: dayPlan.meals[2].name, category: 'Dinner', ecoScore: dayPlan.meals[2].lowCarbonScore.toString()}] : [],
        };
      });
      setWeeklyPlan(newWeeklyPlan);
      localStorage.setItem('mealPlan', JSON.stringify(newWeeklyPlan));
      toast({ title: "AI Meal Plan Generated!", description: "Your 7-day meal plan has been created." });
    } catch (error) {
      console.error("Error generating AI meal plan:", error);
      toast({ variant: "destructive", title: "AI Plan Error", description: "Could not generate meal plan." });
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

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
              <CalendarDays /> Meal Planner
            </CardTitle>
            {(userPlan === 'pro' || userPlan === 'ecopro') && (
              <Button onClick={handleGenerateAIMealPlan} disabled={isLoadingAI}>
                {isLoadingAI ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2 h-4 w-4" />}
                AI Generate Week
              </Button>
            )}
          </div>
          <CardDescription>Plan your meals for the week. Drag and drop coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={() => setCurrentWeekOffset(prev => prev - 1)}><ArrowLeft/></Button>
            <h3 className="text-lg font-semibold">{getWeekDisplay()}</h3>
            <Button variant="outline" size="icon" onClick={() => setCurrentWeekOffset(prev => prev + 1)}><ArrowRight/></Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
            {daysOfWeek.map(day => (
              <Card key={day} className="min-h-[200px] flex flex-col">
                <CardHeader className="p-2 bg-muted/50">
                  <CardTitle className="text-sm font-semibold text-center">{day}</CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1 flex-grow">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(mealType => (
                    <div key={mealType} className="text-xs p-1 border-b border-dashed last:border-b-0">
                      <p className="font-medium text-muted-foreground">{mealType}</p>
                      {weeklyPlan[day]?.[mealType as keyof WeeklyPlan[string]]?.map(item => (
                        <p key={item.id} className="truncate text-xs">{item.name} {item.ecoScore && `(Eco: ${item.ecoScore})`}</p>
                      ))}
                      {(!weeklyPlan[day]?.[mealType as keyof WeeklyPlan[string]] || weeklyPlan[day]?.[mealType as keyof WeeklyPlan[string]]?.length === 0) && <p className="text-gray-400 italic">Empty</p>}
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="p-1 mt-auto">
                    <Button variant="ghost" size="sm" className="w-full text-xs" disabled><PlusCircle className="mr-1 h-3 w-3"/>Add Meal</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <ShoppingBag /> Grocery List (Conceptual)
          </CardTitle>
          <CardDescription>Auto-generated based on your planned meals.</CardDescription>
        </CardHeader>
        <CardContent>
          {generatedPlan && generatedPlan.groceryList.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground columns-2 sm:columns-3">
              {generatedPlan.groceryList.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              {userPlan === 'pro' || userPlan === 'ecopro' ? 
              "Generate an AI meal plan to see your grocery list here, or add meals manually to populate." : 
              "Upgrade to Pro/EcoPro for AI-generated meal plans and grocery lists."}
            </p>
          )}
        </CardContent>
        <CardFooter className="gap-2">
            <Button variant="outline" disabled><Printer className="mr-2 h-4 w-4"/> Print List</Button>
            <Button variant="outline" disabled><Download className="mr-2 h-4 w-4"/> Export List</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
