
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter as ModalFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, ShoppingBag, Sparkles, PlusCircle, ArrowLeft, ArrowRight, Printer, Download, Loader2, FileText, Edit2, Trash2 } from 'lucide-react';
import { getSelectedPlan, type UserPlan, getUserProfile as getLocalUserProfile, saveWeeklyMealPlan, getWeeklyMealPlan, getGeneratedMealPlanOutput, saveGeneratedMealPlanOutput } from '@/lib/localStorage'; // Removed getUserProfile and UserProfile as profile fetching is now direct
import type { UserProfile } from '@/types'; // Ensure UserProfile is imported from types
// import { supabase } from '@/lib/supabaseClient'; // Import supabase client // Removed as Supabase was rolled back
import { useToast } from '@/hooks/use-toast';
import { generateEcoMealPlan, type GenerateEcoMealPlanOutput } from '@/ai/flows/generate-eco-meal-plan';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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

const initialWeeklyPlan = (): WeeklyPlan => {
  const plan: WeeklyPlan = {};
  daysOfWeek.forEach(day => {
    plan[day] = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
  });
  return plan;
};

export default function MealPlannerPage() {
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(initialWeeklyPlan());
  const [generatedPlanOutput, setGeneratedPlanOutput] = useState<GenerateEcoMealPlanOutput | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 for current week, -1 for last, 1 for next
  const [weekDisplay, setWeekDisplay] = useState('');
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  // State for the Add/Edit Meal Modal
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedDayForMeal, setSelectedDayForMeal] = useState<string | null>(null);
  const [selectedMealTypeForMeal, setSelectedMealTypeForMeal] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | null>(null);
  const [currentMealName, setCurrentMealName] = useState('');
  const [editingMealId, setEditingMealId] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      setUserPlan(getSelectedPlan());
      const profile = getLocalUserProfile(); // Use the renamed function
      setUserProfile(profile);
      setIsLoadingProfile(false);

      const savedPlan = getWeeklyMealPlan();
      if (savedPlan) {
        const fullPlan = initialWeeklyPlan(); // Start with a complete structure
        for (const day of daysOfWeek) {
            if (savedPlan[day]) {
                for (const mealType of ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const) {
                    if (savedPlan[day][mealType]) {
                        fullPlan[day][mealType] = savedPlan[day][mealType];
                    }
                }
            }
        }
        setWeeklyPlan(fullPlan);
      } else {
        setWeeklyPlan(initialWeeklyPlan());
      }
      
      const savedGeneratedOutput = getGeneratedMealPlanOutput();
      if (savedGeneratedOutput) {
        setGeneratedPlanOutput(savedGeneratedOutput);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && Object.keys(weeklyPlan).some(day => Object.values(weeklyPlan[day]).some(arr => arr && arr.length > 0))) {
      saveWeeklyMealPlan(weeklyPlan);
    }
  }, [weeklyPlan, isClient]);
  
  useEffect(() => {
    if (isClient && generatedPlanOutput) {
      saveGeneratedMealPlanOutput(generatedPlanOutput);
    }
  }, [generatedPlanOutput, isClient]);

  useEffect(() => {
    if (isClient) {
      const today = new Date();
      today.setDate(today.getDate() + currentWeekOffset * 7);
      
      // Calculate start of the week (Monday)
      const dayOfWeekNum = today.getDay(); // Sunday is 0, Monday is 1, etc.
      const diffToMonday = today.getDate() - dayOfWeekNum + (dayOfWeekNum === 0 ? -6 : 1); // Adjust if Sunday is 0
      const startOfWeek = new Date(today.setDate(diffToMonday));
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      setWeekDisplay(`${startOfWeek.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, options)}`);
    }
  }, [isClient, currentWeekOffset]);


  const handlePlaceholderFeatureClick = useCallback((featureName: string) => {
    if (!isClient) return; // Added guard
    toast({
      title: `${featureName} Coming Soon!`,
      description: `This feature will be available in a future update.`,
    });
  }, [toast, isClient]); // Added isClient


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
          dietType: userProfile.dietType || undefined,
          healthGoals: userProfile.healthGoals || [],
          dietaryRestrictions: userProfile.dietaryRestrictions ? (Array.isArray(userProfile.dietaryRestrictions) ? userProfile.dietaryRestrictions.join(', ') : userProfile.dietaryRestrictionsOther) : undefined,
        },
        durationDays: 7, // Generate for 7 days
      });
      setGeneratedPlanOutput(planOutput);
      
      // Apply the generated plan to the weeklyPlan state
      const newWeeklyPlanData = initialWeeklyPlan();
      planOutput.mealPlan.forEach((dayPlan, dayIndex) => {
        const dayName = daysOfWeek[dayIndex % 7]; // Ensure it cycles through daysOfWeek correctly for >7 day plans
        dayPlan.meals.forEach((meal, mealIndex) => {
          let category: PlannerMealItem['category'] = 'Breakfast'; // Default
          // Simple distribution: first meal to Breakfast, second to Lunch, third to Dinner
          if (mealIndex === 0) category = 'Breakfast';
          else if (mealIndex === 1) category = 'Lunch';
          else if (mealIndex === 2) category = 'Dinner';
          // If more than 3 meals per day are generated, they could go to Snack or be distributed
          // For this example, let's assume up to 3 meals are focused.
          
          if (newWeeklyPlanData[dayName]) { // Check if dayName is valid
             const plannerItem: PlannerMealItem = {
              id: `ai-${meal.name.replace(/\s+/g, '-').toLowerCase()}-${dayName}-${dayIndex}-${mealIndex}-${crypto.randomUUID().slice(0,8)}`,
              name: meal.name,
              category: category,
              ecoScore: meal.lowCarbonScore.toString(),
              description: meal.description
            };
            if (!newWeeklyPlanData[dayName][category]) newWeeklyPlanData[dayName][category] = [];
             newWeeklyPlanData[dayName][category]?.push(plannerItem);
          }
        });
      });
      setWeeklyPlan(newWeeklyPlanData);

      toast({ title: "AI Meal Plan Generated!", description: "Your 7-day meal plan has been created and applied." });
    } catch (error) {
      console.error("Error generating AI meal plan:", error);
      toast({ variant: "destructive", title: "AI Plan Error", description: "Could not generate meal plan. Please try again." });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const openAddMealModal = (day: string, mealType: PlannerMealItem['category']) => {
    setModalMode('add');
    setSelectedDayForMeal(day);
    setSelectedMealTypeForMeal(mealType);
    setCurrentMealName('');
    setEditingMealId(null);
    setIsMealModalOpen(true);
  };

  const openEditMealModal = (meal: PlannerMealItem, day: string, mealType: PlannerMealItem['category']) => {
    setModalMode('edit');
    setSelectedDayForMeal(day);
    setSelectedMealTypeForMeal(mealType);
    setCurrentMealName(meal.name);
    setEditingMealId(meal.id);
    setIsMealModalOpen(true);
  };
  
  const handleSaveMeal = () => {
    if (!currentMealName.trim() || !selectedDayForMeal || !selectedMealTypeForMeal) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter a meal name." });
      return;
    }

    setWeeklyPlan(prevPlan => {
      const newPlan = JSON.parse(JSON.stringify(prevPlan)); // Deep copy
      // Ensure day and meal type arrays exist
      if (!newPlan[selectedDayForMeal!]) newPlan[selectedDayForMeal!] = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
      if (!newPlan[selectedDayForMeal!][selectedMealTypeForMeal!]) newPlan[selectedDayForMeal!][selectedMealTypeForMeal!] = [];
      
      if (modalMode === 'add') {
        const newMeal: PlannerMealItem = {
          id: crypto.randomUUID(),
          name: currentMealName.trim(),
          category: selectedMealTypeForMeal!,
        };
        newPlan[selectedDayForMeal!][selectedMealTypeForMeal!]!.push(newMeal);
        toast({ title: "Meal Added", description: `${newMeal.name} added to ${selectedMealTypeForMeal} on ${selectedDayForMeal}.` });
      } else if (modalMode === 'edit' && editingMealId) {
        const mealTypeArray = newPlan[selectedDayForMeal!][selectedMealTypeForMeal!] as PlannerMealItem[];
        const mealIndex = mealTypeArray.findIndex(m => m.id === editingMealId);
        if (mealIndex > -1) {
          mealTypeArray[mealIndex].name = currentMealName.trim();
          toast({ title: "Meal Updated", description: `Meal updated in ${selectedMealTypeForMeal} on ${selectedDayForMeal}.` });
        }
      }
      return newPlan;
    });

    setIsMealModalOpen(false);
    setCurrentMealName(''); // Reset for next use
    setEditingMealId(null);
  };

  const handleDeleteMeal = (mealId: string, day: string, mealType: PlannerMealItem['category']) => {
    setWeeklyPlan(prevPlan => {
      const newPlan = JSON.parse(JSON.stringify(prevPlan));
      const mealTypeArray = newPlan[day]?.[mealType] as PlannerMealItem[] | undefined;
      if (mealTypeArray) {
        newPlan[day][mealType] = mealTypeArray.filter(m => m.id !== mealId);
      }
      return newPlan;
    });
    toast({ title: "Meal Deleted", description: `Meal removed from ${mealType} on ${day}.` });
  };

  const handleExportGroceryList = () => {
    if (!isClient) return;
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
     if (!isClient) return;
    if (!generatedPlanOutput || generatedPlanOutput.groceryList.length === 0) {
      toast({ title: "No Grocery List", description: "Generate an AI meal plan first to get a grocery list.", variant: "default" });
      return;
    }
    const listHtml = `
        <html><head><title>Grocery List - EcoAI Calorie Tracker</title>
        <style>body{font-family:sans-serif;margin:20px}h1{text-align:center;color:hsl(var(--primary))}ul{list-style-type:none;padding:0}li{padding:5px 0;border-bottom:1px solid #eee;margin-bottom:3px}li:last-child{border-bottom:none}@media print{body{margin:.5in}h1{font-size:18pt}li{font-size:10pt}button{display:none}}</style>
        </head><body><h1>Grocery List</h1><ul>${generatedPlanOutput.groceryList.map(item => `<li>${item}</li>`).join('')}</ul>
        <script>window.onload=()=>{window.print();window.close()}</script></body></html>`;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(listHtml);
      printWindow.document.close();
    } else {
      toast({ variant: "destructive", title: "Print Error", description: "Could not open print window. Please check browser settings." });
    }
  };


  if (!isClient || isLoadingProfile) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
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
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2"><CalendarDays /> Meal Planner</CardTitle>
            {canUseAIPlanner && (
              <Button onClick={handleGenerateAIMealPlan} disabled={isLoadingAI || isLoadingProfile || !userProfile}>
                {isLoadingAI ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                AI Generate Week Plan
              </Button>
            )}
          </div>
          <CardDescription>
            {canUseAIPlanner ? "Use AI to generate a weekly meal plan or add meals manually." : "Upgrade to Pro or EcoPro for AI-powered meal plan generation. You can still add meals manually."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon"
              onClick={() => {
                if (currentWeekOffset > -2) { // Limit to 2 weeks in the past
                   setCurrentWeekOffset(prev => prev - 1);
                } else {
                  // Intentionally do nothing or show a non-toast feedback if desired.
                  // The button will be disabled anyway.
                }
              }}
              disabled={isLoadingAI || currentWeekOffset <= -2}>
                <ArrowLeft />
            </Button>
            <h3 className="text-lg font-semibold text-center">{weekDisplay}</h3>
            <Button variant="outline" size="icon"
              onClick={() => {
                 if (currentWeekOffset < 2) { // Limit to 2 weeks in the future
                  setCurrentWeekOffset(prev => prev + 1);
                } else {
                  // Intentionally do nothing or show a non-toast feedback if desired.
                  // The button will be disabled anyway.
                }
              }}
              disabled={isLoadingAI || currentWeekOffset >= 2}>
                <ArrowRight />
            </Button>
          </div>

          {(Object.keys(weeklyPlan).length === 0 || daysOfWeek.every(day => Object.values(weeklyPlan[day] || {}).every(arr => arr?.length === 0))) && !generatedPlanOutput && !isLoadingAI && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your meal planner is empty for this week.</p>
              {canUseAIPlanner && <p>Try using the "AI Generate Week Plan" button above or add meals manually!</p>}
              {!canUseAIPlanner && <p>You can add meals manually by clicking the "+" icon in each slot.</p>}
            </div>
          )}
          {isLoadingAI && (
            <div className="text-center py-8 text-muted-foreground"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" /><p>Generating your AI meal plan...</p></div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
            {daysOfWeek.map(day => (
              <Card key={day} className="min-h-[300px] flex flex-col bg-muted/20">
                <CardHeader className="p-2 bg-muted/50"><CardTitle className="text-sm font-semibold text-center">{day}</CardTitle></CardHeader>
                <CardContent className="p-2 space-y-1 flex-grow">
                  {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as PlannerMealItem['category'][]).map(mealType => (
                    <div key={mealType} className="text-xs p-1.5 border-b border-dashed last:border-b-0 min-h-[60px] group relative">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium text-muted-foreground">{mealType}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 group-hover:opacity-100" onClick={() => openAddMealModal(day, mealType)}><PlusCircle className="h-4 w-4 text-primary" /></Button>
                      </div>
                      <div className="space-y-1">
                        {weeklyPlan[day]?.[mealType]?.map(item => (
                          <div key={item.id} className="p-1.5 rounded bg-card shadow-sm group/item relative">
                            <p className="font-semibold truncate text-primary/90 pr-10" title={item.name}>{item.name}</p>
                            {item.description && <p className="text-xs text-muted-foreground truncate" title={item.description}>{item.description}</p>}
                            {item.ecoScore && <p className="text-xs text-green-600">Eco: {item.ecoScore}/5</p>}
                            <div className="absolute top-0 right-0 flex opacity-0 group-hover/item:opacity-100 transition-opacity bg-card/80 rounded-bl-md">
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEditMealModal(item, day, mealType)}><Edit2 className="h-3 w-3 text-blue-500" /></Button>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDeleteMeal(item.id, day, mealType)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {(!weeklyPlan[day]?.[mealType] || weeklyPlan[day]?.[mealType]?.length === 0) && <p className="text-gray-400 italic text-xs text-center py-2">No meal planned</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader><CardTitle className="text-xl font-bold text-primary flex items-center gap-2"><ShoppingBag /> Grocery List</CardTitle>
          <CardDescription>{canUseAIPlanner ? "Auto-generated based on your AI-planned meals." : "Upgrade to Pro or EcoPro for AI-generated grocery lists."}</CardDescription>
        </CardHeader>
        <CardContent>
          {generatedPlanOutput && generatedPlanOutput.groceryList.length > 0 ? (
            <ScrollArea className="h-40">
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground columns-1 sm:columns-2 md:columns-3 p-2 border rounded-md">
                {generatedPlanOutput.groceryList.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-4">{canUseAIPlanner ? (isLoadingAI ? "Generating list..." : "Generate an AI meal plan to see your grocery list here.") : "Your grocery list will appear here if you generate an AI meal plan (Pro/EcoPro feature)."}</p>
          )}
        </CardContent>
        <CardFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePrintGroceryList} disabled={!generatedPlanOutput || generatedPlanOutput.groceryList.length === 0}><Printer className="mr-2 h-4 w-4" /> Print List</Button>
          <Button variant="outline" onClick={handleExportGroceryList} disabled={!generatedPlanOutput || generatedPlanOutput.groceryList.length === 0}><FileText className="mr-2 h-4 w-4" /> Export as CSV</Button>
        </CardFooter>
      </Card>

      {/* Add/Edit Meal Dialog */}
      <Dialog open={isMealModalOpen} onOpenChange={setIsMealModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalMode === 'add' ? 'Add Meal to Plan' : 'Edit Meal'}</DialogTitle>
            <DialogDescription>
              {modalMode === 'add' ? `Adding to ${selectedMealTypeForMeal} on ${selectedDayForMeal}.` : `Editing meal in ${selectedMealTypeForMeal} on ${selectedDayForMeal}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meal-name" className="text-right">
                Name
              </Label>
              <Input
                id="meal-name"
                value={currentMealName}
                onChange={(e) => setCurrentMealName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Oatmeal with Berries"
              />
            </div>
          </div>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setIsMealModalOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveMeal}>Save Meal</Button>
          </ModalFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
