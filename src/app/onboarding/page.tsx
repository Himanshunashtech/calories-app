
'use client';

import { useState, ChangeEvent, FormEvent, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Target, Salad, Utensils, CheckCircle, Leaf, HeartHandshake, BarChart3, PieChart, Droplet, ShieldAlert, BellRing, Smile, CloudLightning, Users, Search, Sparkles as LucideSparklesIcon, Activity, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import type { OnboardingData, UserProfile } from '@/types';
import { ALLERGY_OPTIONS } from '@/types';
import { isUserLoggedIn, getUserProfile, saveUserProfile, setOnboardingComplete } from '@/lib/localStorage';

const TOTAL_STEPS = 8; 

const defaultFormData: OnboardingData = {
  name: '',
  age: '',
  gender: '',
  height: '',
  heightUnit: 'cm',
  weight: '',
  weightUnit: 'kg',
  activityLevel: '',
  healthGoals: [],
  alsoTrackSustainability: false,
  exerciseFrequency: '',
  dietType: '',
  dietaryRestrictions: [],
  favoriteCuisines: '',
  dislikedIngredients: '',
  enableCarbonTracking: false,
  sleepHours: '',
  stressLevel: '',
  waterGoal: 8,
  macroSplit: { carbs: 50, protein: 25, fat: 25 },
  reminderSettings: {
    mealRemindersEnabled: true,
    breakfastTime: '08:00',
    lunchTime: '12:30',
    dinnerTime: '18:30',
    waterReminderEnabled: false,
    waterReminderInterval: 60,
    snoozeDuration: 5,
  },
};

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(defaultFormData);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (!isUserLoggedIn()) {
        toast({title: "Please Log In", description: "You need to be logged in to start onboarding.", variant: "destructive"});
        router.replace('/login');
        return;
    }
    // Commenting out direct redirect if onboarding is complete to allow re-onboarding for now
    // if (isUserLoggedIn() && isOnboardingComplete()) {
    //     router.replace('/dashboard');
    //     return;
    // }
    const existingProfile = getUserProfile();
    if (existingProfile) {
        setFormData(prev => ({
            ...prev, 
            ...existingProfile,
            // Ensure healthGoals and dietaryRestrictions are always arrays
            healthGoals: Array.isArray(existingProfile.healthGoals) ? existingProfile.healthGoals : [],
            dietaryRestrictions: Array.isArray(existingProfile.dietaryRestrictions) ? existingProfile.dietaryRestrictions : [],
            reminderSettings: { 
                ...prev.reminderSettings,
                ...(existingProfile.reminderSettings || {})
            }
        }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && name === 'healthGoals') { 
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        healthGoals: checked
          ? [...prev.healthGoals, value]
          : prev.healthGoals.filter((goal) => goal !== value),
      }));
    } else if (type === 'checkbox' && name === 'dietaryRestrictions') { 
       const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        dietaryRestrictions: checked
          ? [...prev.dietaryRestrictions, value]
          : prev.dietaryRestrictions.filter((restriction) => restriction !== value),
      }));
    } else if (name === "waterGoal") {
      setFormData((prev) => ({ ...prev, waterGoal: parseInt(value, 10) || 0 }));
    }
    
    else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name: keyof OnboardingData | `reminderSettings.${keyof OnboardingData['reminderSettings']}`) => (checked: boolean) => {
     if (name === 'reminderSettings.mealRemindersEnabled') {
        setFormData(prev => ({...prev, reminderSettings: {...prev.reminderSettings, mealRemindersEnabled: checked }}));
    } else if (name === 'reminderSettings.waterReminderEnabled') {
        setFormData(prev => ({...prev, reminderSettings: {...prev.reminderSettings, waterReminderEnabled: checked }}));
    } else if (name === 'enableCarbonTracking') {
        setFormData(prev => ({ ...prev, enableCarbonTracking: checked }));
    } else if (name === 'alsoTrackSustainability') {
        setFormData(prev => ({ ...prev, alsoTrackSustainability: checked }));
    }
    else {
        setFormData((prev) => ({ ...prev, [name as keyof OnboardingData]: checked }));
    }
  };

  const handleSelectChange = (name: keyof OnboardingData | `reminderSettings.${keyof OnboardingData['reminderSettings']}`) => (value: string | number) => {
     if (name === 'reminderSettings.waterReminderInterval') {
      setFormData((prev) => ({
        ...prev,
        reminderSettings: { ...prev.reminderSettings, waterReminderInterval: Number(value) },
      }));
    }
    else {
        setFormData((prev) => ({ ...prev, [name as keyof OnboardingData]: value as any }));
    }
  };
  
  const handleRadioChange = (name: keyof OnboardingData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      if (currentStep === 1 && (!formData.name || !formData.age || !formData.gender)) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all basic details." });
        return;
      }
       if (currentStep === 2 && (!formData.height || !formData.weight || !formData.activityLevel)) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please provide height, weight, and activity level." });
        return;
      }
      if (currentStep === 3 && (formData.healthGoals.length === 0 )) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please select at least one health goal." });
        return;
      }
      if (currentStep === 4 && !formData.dietType) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please select your diet type." });
        return;
      }
       if (currentStep === 6 && (!formData.sleepHours || !formData.stressLevel || !formData.waterGoal)) { 
        toast({ variant: "destructive", title: "Missing fields", description: "Please complete all lifestyle fields." });
        return;
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const existingProfile = getUserProfile(); // Get the profile created during signup/login
    if (!existingProfile) {
        toast({title: "Error", description: "User profile not found. Please ensure you are logged in.", variant: "destructive"});
        router.push('/login'); // Or appropriate error handling/redirect
        return;
    }

    // Merge onboarding data into the existing profile
    const updatedProfile: UserProfile = {
        ...existingProfile,
        ...formData, // formData will overwrite overlapping fields from existingProfile
        name: formData.name || existingProfile.name, // Ensure name from onboarding is used
        email: existingProfile.email, // Preserve email from login/signup
        profileImageUri: existingProfile.profileImageUri, // Preserve existing image
        reminderSettings: { // Deep merge for reminderSettings
          ...defaultFormData.reminderSettings, // Start with defaults
          ...(existingProfile.reminderSettings || {}), // Apply existing settings from profile
          ...formData.reminderSettings, // Apply onboarding reminder settings
        },
        appSettings: { // Deep merge for appSettings
          ...(existingProfile.appSettings || {}),
          // ...formData.appSettings, // if appSettings were part of onboarding
        }
    };
    
    saveUserProfile(updatedProfile);
    setOnboardingComplete(true); // Mark onboarding as complete
    
    toast({
      title: 'Onboarding Complete!',
      description: "Next, let's choose a plan that's right for you.",
      action: <CheckCircle className="text-green-500" />,
    });
    router.push('/subscription'); // Redirect to subscription page
  };
  
  const handlePlaceholderFeatureClick = (featureName: string) => {
    toast({
      title: `${featureName} Coming Soon!`,
      description: `This feature will be available in a future update.`,
    });
  };

  const progressValue = (currentStep / TOTAL_STEPS) * 100;
  
  const healthGoalOptions = [
    { id: 'lose-weight', label: 'Lose Weight' },
    { id: 'gain-muscle', label: 'Gain Muscle' },
    { id: 'maintain-weight', label: 'Maintain Weight' },
    { id: 'eat-healthier', label: 'Eat Healthier' },
    { id: 'improve-energy', label: 'Improve Energy Levels' },
  ];

  const currentYear = new Date().getFullYear();
  const calculatedBMI = useMemo(() => {
    if (formData.height && formData.weight && formData.heightUnit && formData.weightUnit) {
      const heightInMeters = formData.heightUnit === 'cm' ? parseFloat(formData.height) / 100 : parseFloat(formData.height) * 0.0254;
      const weightInKg = formData.weightUnit === 'kg' ? parseFloat(formData.weight) : parseFloat(formData.weight) * 0.453592;
      if (heightInMeters > 0 && weightInKg > 0) {
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(1);
      }
    }
    return null;
  }, [formData.height, formData.weight, formData.heightUnit, formData.weightUnit]);


  return (
    <Card className="w-full shadow-2xl">
      <CardHeader>
        <div className="flex justify-center mb-2">
          { currentStep === 1 ? <User className="h-10 w-10 text-primary"/> :
            currentStep === 2 ? <BarChart3 className="h-10 w-10 text-primary"/> :
            currentStep === 3 ? <Target className="h-10 w-10 text-primary"/> :
            currentStep === 4 ? <Salad className="h-10 w-10 text-primary"/> :
            currentStep === 5 ? <LucideSparklesIcon className="h-10 w-10 text-primary"/> :
            currentStep === 6 ? <HeartHandshake className="h-10 w-10 text-primary"/> :
            currentStep === 7 ? <BellRing className="h-10 w-10 text-primary"/> :
            <Leaf className="h-10 w-10 text-primary" />
          }
        </div>
        <CardTitle className="text-center text-3xl font-bold text-primary">
          { currentStep === 1 && "Welcome to EcoTrack!"}
          { currentStep === 2 && "Physical Metrics"}
          { currentStep === 3 && "Your Health Goals"}
          { currentStep === 4 && "Diet & Food Preferences"}
          { currentStep === 5 && "Our Eco Mission & AI"}
          { currentStep === 6 && "Lifestyle Habits"}
          { currentStep === 7 && "Notification Preferences"}
          { currentStep === TOTAL_STEPS && "Review & Get Started!"}
          { currentStep > 1 && currentStep < TOTAL_STEPS && ` (Step ${currentStep}/${TOTAL_STEPS-1})`}
        </CardTitle>
        <CardDescription className="text-center">
          { currentStep === 1 && "Let's personalize your journey. Basic info helps us tailor recommendations."}
          { currentStep === 2 && "Tell us a bit about yourself for accurate tracking."}
          { currentStep === 3 && "What are you aiming to achieve? You can select multiple goals."}
          { currentStep === 4 && "Customize your diet and food preferences."}
          { currentStep === 5 && "See how EcoTrack makes an impact & how AI helps!"}
          { currentStep === 6 && "Understanding your habits helps us guide you better."}
          { currentStep === 7 && "Stay on track with timely reminders."}
          { currentStep === TOTAL_STEPS && "You're all set! Review your info and choose your plan next."}
        </CardDescription>
        <Progress value={progressValue} className="w-full mt-4 h-2 [&>div]:bg-primary" />
      </CardHeader>

      <CardContent>
        {!isClient ? (
           <div className="space-y-6">
            <div className="h-10 bg-muted rounded-md animate-pulse"></div>
            <div className="h-10 bg-muted rounded-md animate-pulse"></div>
            <div className="h-10 bg-muted rounded-md animate-pulse"></div>
             <div className="flex justify-between mt-8">
                <div className="h-10 w-20 bg-muted rounded-md animate-pulse"></div>
                <div className="h-10 w-20 bg-muted rounded-md animate-pulse ml-auto"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && ( // Welcome & Basic Info
              <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><User className="h-6 w-6" /> Basic Details</h3>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="E.g., Alex Green" required />
                </div>
                <div>
                  <Label htmlFor="age">Year of Birth</Label>
                  <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} placeholder={`E.g., ${currentYear - 30}`} min="1900" max={(currentYear -5).toString()} required />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" value={formData.gender} onValueChange={handleSelectChange('gender')}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>
            )}

            {currentStep === 2 && ( // Physical Metrics & Activity
              <section className="space-y-4 animate-in fade-in duration-500">
                 <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><BarChart3 className="h-6 w-6" /> Your Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height</Label>
                    <div className="flex gap-2">
                    <Input id="height" name="height" type="number" value={formData.height} onChange={handleChange} placeholder="E.g., 170" className="flex-grow" required/>
                      <Select name="heightUnit" value={formData.heightUnit} onValueChange={handleSelectChange('heightUnit')}>
                        <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="in">in</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <div className="flex gap-2">
                    <Input id="weight" name="weight" type="number" value={formData.weight} onChange={handleChange} placeholder="E.g., 65" className="flex-grow" required/>
                      <Select name="weightUnit" value={formData.weightUnit} onValueChange={handleSelectChange('weightUnit')}>
                        <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lbs">lbs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {calculatedBMI && <p className="text-sm text-muted-foreground text-center">Calculated BMI: {calculatedBMI}</p>}
                 <div>
                  <Label>Typical Activity Level</Label>
                  <RadioGroup name="activityLevel" value={formData.activityLevel} onValueChange={handleRadioChange('activityLevel')} className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="sedentary" id="sedentary" /><Label htmlFor="sedentary" className="font-normal">Sedentary (little to no exercise)</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="light" id="light" /><Label htmlFor="light" className="font-normal">Lightly Active (light exercise/sports 1-3 days/week)</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="moderate" id="moderate" /><Label htmlFor="moderate" className="font-normal">Moderately Active (moderate exercise/sports 3-5 days/week)</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="very" id="very" /><Label htmlFor="very" className="font-normal">Very Active (hard exercise/sports 6-7 days a week)</Label></div>
                    </RadioGroup>
                </div>
                 <div className="p-3 border rounded-md flex items-center justify-between">
                    <Label htmlFor="fitnessSyncOnboarding" className="text-sm">Sync fitness tracker?</Label>
                    <Button size="sm" variant="outline" onClick={() => handlePlaceholderFeatureClick('Fitness Tracker Sync')}>Connect Health App</Button>
                 </div>
              </section>
            )}

            {currentStep === 3 && ( // Health Goals & Focus
              <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><Target className="h-6 w-6" /> Health Goals & Focus</h3>
                <div>
                  <Label>Primary Health Goals (select all that apply)</Label>
                  <div className="space-y-2 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {healthGoalOptions.map((goal) => (
                      <div key={goal.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50">
                        <Checkbox
                          id={goal.id}
                          name="healthGoals"
                          value={goal.label}
                          checked={formData.healthGoals.includes(goal.label)}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                              ...prev,
                              healthGoals: checked
                                ? [...prev.healthGoals, goal.label]
                                : prev.healthGoals.filter((g) => g !== goal.label),
                            }));
                          }}
                        />
                        <Label htmlFor={goal.id} className="font-normal cursor-pointer">{goal.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                 <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                    <Label htmlFor="alsoTrackSustainabilityOnboarding" className="flex flex-col">
                        <span>Also track sustainability?</span>
                        <span className="text-xs text-muted-foreground">Focus on eco-friendly choices.</span>
                    </Label>
                    <Switch id="alsoTrackSustainabilityOnboarding" name="alsoTrackSustainability" checked={formData.alsoTrackSustainability} onCheckedChange={handleSwitchChange('alsoTrackSustainability')} />
                </div>
                <div>
                  <Label htmlFor="exerciseFrequency">How many days a week do you typically exercise?</Label>
                  <Select name="exerciseFrequency" value={formData.exerciseFrequency} onValueChange={handleSelectChange('exerciseFrequency')}>
                    <SelectTrigger id="exerciseFrequency"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 days</SelectItem>
                      <SelectItem value="1-2">1-2 days</SelectItem>
                      <SelectItem value="3-4">3-4 days</SelectItem>
                      <SelectItem value="5+">5+ days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div>
                  <Label>Customize Macro Split</Label>
                  <div className="p-4 border rounded-md text-center bg-muted/50">
                    <PieChart className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                    <p className="text-sm text-muted-foreground">Carbs: {formData.macroSplit?.carbs}% | Protein: {formData.macroSplit?.protein}% | Fat: {formData.macroSplit?.fat}%</p>
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handlePlaceholderFeatureClick('Edit Macro Split')}>Edit Split</Button> or <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handlePlaceholderFeatureClick('AI Macro Recommendation')}>Use AI Recommendation</Button>
                  </div>
                </div>
              </section>
            )}

            {currentStep === 4 && ( // Diet & Food Preferences
              <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><Salad className="h-6 w-6" /> Diet & Food Preferences</h3>
                 <div>
                  <Label htmlFor="dietType">Are you following any specific diet?</Label>
                  <Select name="dietType" value={formData.dietType} onValueChange={handleSelectChange('dietType')}>
                    <SelectTrigger id="dietType"><SelectValue placeholder="Select diet type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="keto">Keto</SelectItem>
                      <SelectItem value="paleo">Paleo</SelectItem>
                      <SelectItem value="pescatarian">Pescatarian</SelectItem>
                      <SelectItem value="mediterranean">Mediterranean</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                    <Label>Allergies/Dietary Restrictions (select all that apply)</Label>
                     <div className="space-y-2 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALLERGY_OPTIONS.map((allergy) => (
                        <div key={allergy.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50">
                            <Checkbox
                            id={`allergy-onboarding-${allergy.id}`}
                            name="dietaryRestrictions"
                            value={allergy.label}
                            checked={formData.dietaryRestrictions.includes(allergy.label)}
                            onCheckedChange={(checked) => {
                                setFormData((prev) => ({
                                ...prev,
                                dietaryRestrictions: checked
                                    ? [...prev.dietaryRestrictions, allergy.label]
                                    : prev.dietaryRestrictions.filter((r) => r !== allergy.label),
                                }));
                            }}
                            />
                            <Label htmlFor={`allergy-onboarding-${allergy.id}`} className="font-normal cursor-pointer">{allergy.label}</Label>
                        </div>
                        ))}
                    </div>
                </div>
                <Textarea id="dietaryRestrictionsOtherOnboarding" name="dietaryRestrictionsOther" placeholder="Other restrictions or allergies not listed..." className="mt-2" value={(formData.dietaryRestrictions || []).filter(r => !ALLERGY_OPTIONS.find(ao => ao.label === r)).join(', ')} onChange={(e) => { const custom = e.target.value.split(',').map(s => s.trim()).filter(Boolean); setFormData(prev => ({...prev, dietaryRestrictions: [...(prev.dietaryRestrictions || []).filter(r => ALLERGY_OPTIONS.find(ao => ao.label ===r)), ...custom]}))}}/>

                <div>
                  <Label htmlFor="favoriteCuisines">Favorite Cuisines (Optional)</Label>
                  <Input id="favoriteCuisines" name="favoriteCuisines" value={formData.favoriteCuisines || ''} onChange={handleChange} placeholder="E.g., Italian, Mexican, Indian" />
                </div>
                <div>
                  <Label htmlFor="dislikedIngredients">Disliked Ingredients (Optional)</Label>
                  <Input id="dislikedIngredients" name="dislikedIngredients" value={formData.dislikedIngredients || ''} onChange={handleChange} placeholder="E.g., Cilantro, Olives, Mushrooms" />
                </div>
                 <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                  <Label htmlFor="enableCarbonTrackingOnboarding" className="flex flex-col">
                    <span>Enable Carbon Tracking?</span>
                    <span className="text-xs text-muted-foreground">Understand your food's eco-impact.</span>
                  </Label>
                  <Switch id="enableCarbonTrackingOnboarding" name="enableCarbonTracking" checked={formData.enableCarbonTracking} onCheckedChange={handleSwitchChange('enableCarbonTracking')} />
                </div>
              </section>
            )}

            {currentStep === 5 && ( // AI Demo & Eco Mission
              <section className="space-y-6 animate-in fade-in duration-500 text-center">
                 <h3 className="text-xl font-semibold flex items-center justify-center gap-2 text-primary"><LucideSparklesIcon className="h-6 w-6" /> Our Eco Mission & AI</h3>
                 <div className="p-4 border rounded-lg bg-muted/30">
                    <LucideSparklesIcon className="h-10 w-10 text-primary mx-auto mb-3"/>
                    <p className="font-semibold text-lg mb-2">Snap a Photo, Get Instant Insights!</p>
                    <Image src="https://placehold.co/300x180.png?text=AI+Scan+Demo" alt="AI Feature Demo" data-ai-hint="app scanner food" width={300} height={180} className="rounded-md shadow-md mx-auto mb-3"/>
                    <p className="text-sm text-muted-foreground">Our AI analyzes your meal photo to estimate calories, macros, and micronutrients in seconds. Logging food has never been easier!</p>
                 </div>
                 <div className="p-4 border rounded-lg bg-primary/10">
                    <Users className="h-10 w-10 text-primary mx-auto mb-2"/>
                    <p className="font-semibold text-lg text-primary">Join Our Eco Mission!</p>
                    <p className="text-sm text-muted-foreground">Join 50,000+ users collectively saving an estimated 1 Million kg of CO2 monthly by making informed, sustainable food choices. Every meal counts!</p>
                    <Progress value={75} className="w-3/4 mx-auto mt-2 h-2 [&>div]:bg-green-500" aria-label="Eco mission progress"/>
                 </div>
              </section>
            )}
            
            {currentStep === 6 && ( // Lifestyle Habits
              <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><HeartHandshake className="h-6 w-6" /> Lifestyle Habits</h3>
                <div>
                  <Label htmlFor="sleepHours">On average, how many hours of sleep do you get per night?</Label>
                  <Select name="sleepHours" value={formData.sleepHours} onValueChange={handleSelectChange('sleepHours')}>
                    <SelectTrigger id="sleepHours"><SelectValue placeholder="Select sleep hours" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<5">&lt;5 hours</SelectItem>
                      <SelectItem value="5-6">5-6 hours</SelectItem>
                      <SelectItem value="7-8">7-8 hours</SelectItem>
                      <SelectItem value="8+">8+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>How would you rate your typical stress levels?</Label>
                  <RadioGroup name="stressLevel" value={formData.stressLevel} onValueChange={handleRadioChange('stressLevel')} className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="low" id="stress_low_onboarding" /><Label htmlFor="stress_low_onboarding" className="font-normal">Low</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="moderate" id="stress_moderate_onboarding" /><Label htmlFor="stress_moderate_onboarding" className="font-normal">Moderate</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="high" id="stress_high_onboarding" /><Label htmlFor="stress_high_onboarding" className="font-normal">High</Label></div>
                    </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="waterGoalOnboarding">Daily Water Goal (number of glasses, ~250ml or 8oz each)</Label>
                  <div className="flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-blue-500"/>
                    <Input id="waterGoalOnboarding" name="waterGoal" type="number" value={formData.waterGoal?.toString() || '8'} onChange={handleChange} placeholder="E.g., 8" min="1" max="20"/>
                  </div>
                </div>
              </section>
            )}

            {currentStep === 7 && ( // Notification Preferences
                <section className="space-y-4 animate-in fade-in duration-500">
                    <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><BellRing className="h-6 w-6" /> Notification Preferences</h3>
                     <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                        <Label htmlFor="mealRemindersEnabledOnboarding" className="flex flex-col">
                            <span>Enable Meal Reminders?</span>
                            <span className="text-xs text-muted-foreground">Get notified for breakfast, lunch, and dinner.</span>
                        </Label>
                        <Switch id="mealRemindersEnabledOnboarding" name="reminderSettings.mealRemindersEnabled" checked={!!formData.reminderSettings?.mealRemindersEnabled} onCheckedChange={handleSwitchChange('reminderSettings.mealRemindersEnabled')} />
                    </div>
                    {formData.reminderSettings?.mealRemindersEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 border rounded-md bg-muted/30">
                             <div> <Label htmlFor="breakfastTimeOnboarding">Breakfast</Label> <Input id="breakfastTimeOnboarding" name="reminderSettings.breakfastTime" type="time" value={formData.reminderSettings?.breakfastTime || '08:00'} onChange={(e) => setFormData(prev => ({...prev, reminderSettings: {...prev.reminderSettings, breakfastTime: e.target.value}}))} /> </div>
                            <div> <Label htmlFor="lunchTimeOnboarding">Lunch</Label> <Input id="lunchTimeOnboarding" name="reminderSettings.lunchTime" type="time" value={formData.reminderSettings?.lunchTime || '12:30'} onChange={(e) => setFormData(prev => ({...prev, reminderSettings: {...prev.reminderSettings, lunchTime: e.target.value}}))} /> </div>
                            <div> <Label htmlFor="dinnerTimeOnboarding">Dinner</Label> <Input id="dinnerTimeOnboarding" name="reminderSettings.dinnerTime" type="time" value={formData.reminderSettings?.dinnerTime || '18:30'} onChange={(e) => setFormData(prev => ({...prev, reminderSettings: {...prev.reminderSettings, dinnerTime: e.target.value}}))} /> </div>
                        </div>
                    )}
                     <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                        <Label htmlFor="waterReminderEnabledOnboarding" className="flex flex-col">
                            <span>Water Intake Reminders?</span>
                             <span className="text-xs text-muted-foreground">Stay hydrated throughout the day.</span>
                        </Label>
                        <Switch id="waterReminderEnabledOnboarding" name="reminderSettings.waterReminderEnabled" checked={!!formData.reminderSettings?.waterReminderEnabled} onCheckedChange={handleSwitchChange('reminderSettings.waterReminderEnabled')} />
                    </div>
                    {formData.reminderSettings?.waterReminderEnabled && (
                         <div className="p-3 border rounded-md bg-muted/30 space-y-2">
                            <Label htmlFor="waterReminderIntervalOnboarding">Remind every:</Label>
                            <Select name="reminderSettings.waterReminderInterval" value={formData.reminderSettings?.waterReminderInterval?.toString() || '60'} onValueChange={(val) => handleSelectChange('reminderSettings.waterReminderInterval')(Number(val))}>
                                <SelectTrigger id="waterReminderIntervalOnboarding"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">60 minutes</SelectItem>
                                <SelectItem value="90">90 minutes</SelectItem>
                                <SelectItem value="120">120 minutes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                     <p className="text-xs text-muted-foreground text-center">Actual notification delivery depends on your browser and device settings.</p>
                      <div className="p-4 border rounded-lg text-center">
                        <h4 className="font-semibold mb-2">Data Privacy Assurance</h4>
                        <ShieldAlert className="h-8 w-8 text-primary mx-auto mb-2"/>
                        <p className="text-xs text-muted-foreground">Your data is yours. We use AI to provide insights, but your personal information is handled with care. Read our (placeholder) Privacy Policy for details.</p>
                        <div className="mt-2 flex items-center justify-center space-x-2">
                            <Checkbox id="privacyConsentOnboarding" required defaultChecked/>
                            <Label htmlFor="privacyConsentOnboarding" className="text-xs font-normal">I agree to the terms and conditions.</Label>
                        </div>
                    </div>
                </section>
            )}

            {currentStep === TOTAL_STEPS && ( // Review Step
              <section className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-2 border p-4 rounded-md bg-muted/30 max-h-96 overflow-y-auto text-sm">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Year of Birth:</strong> {formData.age}</p>
                  <p><strong>Gender:</strong> {formData.gender}</p>
                  <p><strong>Height:</strong> {formData.height} {formData.heightUnit}</p>
                  <p><strong>Weight:</strong> {formData.weight} {formData.weightUnit}</p>
                  <p><strong>Activity Level:</strong> {formData.activityLevel}</p>
                  <p><strong>Health Goals:</strong> {formData.healthGoals.join(', ')}</p>
                  <p><strong>Track Sustainability:</strong> {formData.alsoTrackSustainability ? 'Yes' : 'No'}</p>
                  <p><strong>Exercise Frequency:</strong> {formData.exerciseFrequency}</p>
                  <p><strong>Diet Type:</strong> {formData.dietType}</p>
                  <p><strong>Dietary Restrictions:</strong> {formData.dietaryRestrictions.join(', ') || 'None'}</p>
                  <p><strong>Favorite Cuisines:</strong> {formData.favoriteCuisines || 'None specified'}</p>
                  <p><strong>Disliked Ingredients:</strong> {formData.dislikedIngredients || 'None specified'}</p>
                  <p><strong>Enable Carbon Tracking:</strong> {formData.enableCarbonTracking ? 'Yes' : 'No'}</p>
                  <p><strong>Sleep per night:</strong> {formData.sleepHours}</p>
                  <p><strong>Stress Level:</strong> {formData.stressLevel}</p>
                  <p><strong>Water Goal:</strong> {formData.waterGoal} glasses</p>
                  <p><strong>Meal Reminders:</strong> {formData.reminderSettings?.mealRemindersEnabled ? `Enabled (${formData.reminderSettings.breakfastTime}, ${formData.reminderSettings.lunchTime}, ${formData.reminderSettings.dinnerTime})` : 'Disabled'}</p>
                  <p><strong>Water Reminders:</strong> {formData.reminderSettings?.waterReminderEnabled ? `Enabled, every ${formData.reminderSettings.waterReminderInterval} mins` : 'Disabled'}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 p-3 bg-primary/10 rounded-md">
                    <Users className="h-5 w-5 text-primary"/>
                    <p className="text-sm text-muted-foreground">You're joining a community dedicated to health and sustainability!</p>
                </div>
              </section>
            )}

            <CardFooter className="flex justify-between mt-8 p-0">
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                Previous
              </Button>
              {currentStep < TOTAL_STEPS ? (
                <Button type="button" onClick={handleNext} className="ml-auto">
                  Next
                </Button>
              ) : (
                <Button type="submit" className="ml-auto bg-green-600 hover:bg-green-700">
                  Save & Choose Plan <Smile className="ml-2 h-4 w-4"/>
                </Button>
              )}
            </CardFooter>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

