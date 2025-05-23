
'use client';

import { useState, ChangeEvent, FormEvent, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { User, Target, Salad, CheckCircle, Leaf, HeartHandshake, BarChart3, PieChartIcon, Droplet, ShieldAlert, BellRing, Smile, Users, Search, ActivityIcon, Edit3, Mail, Sparkles as LucideSparklesIcon, Loader2, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import type { UserProfile, ReminderSettings } from '@/types';
import { ALLERGY_OPTIONS } from '@/types';
import { defaultUserProfileData, getLocalOnboardingData, saveLocalOnboardingData, clearLocalOnboardingData } from '@/lib/localStorage';
import { supabase } from '@/lib/supabaseClient';
import { Skeleton } from '@/components/ui/skeleton';


const TOTAL_STEPS = 7; // Reduced as account creation is now separate

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>(defaultUserProfileData);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authUser, setAuthUser] = useState<any | null>(null); // Supabase user object
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const checkAuthAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({ variant: "destructive", title: "Not Authenticated", description: "Please sign up or log in to continue." });
        router.push('/signup'); // Or /login
        return;
      }
      setAuthUser(session.user);

      // Fetch existing profile data from Supabase if it exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const localData = getLocalOnboardingData(); // Get any temporarily saved onboarding progress

      if (profileData) {
        // Merge priorities: Supabase profile > local onboarding data > defaults
        const mergedData = {
          ...defaultUserProfileData,
          ...profileData, // Supabase data is source of truth
          ...localData,   // Overlay with any more recent local edits
          email: session.user.email || profileData.email || localData.email, // Ensure email is from session
          name: profileData.name || localData.name || session.user.user_metadata?.full_name,
          reminderSettings: {
            ...(defaultUserProfileData.reminderSettings || {}),
            ...(profileData.reminderSettings || {}),
            ...(localData.reminderSettings || {}),
          },
          appSettings: {
            ...(defaultUserProfileData.appSettings || {}),
            ...(profileData.appSettings || {}),
            ...(localData.appSettings || {}),
            unitPreferences: {
                ...(defaultUserProfileData.appSettings?.unitPreferences || {}),
                ...(profileData.appSettings?.unitPreferences || {}),
                ...(localData.appSettings?.unitPreferences || {}),
            }
          },
          macroSplit: {
            ...(defaultUserProfileData.macroSplit || { carbs: 50, protein: 25, fat: 25 }),
            ...(profileData.macroSplit || {}),
            ...(localData.macroSplit || {}),
          }
        };
        setFormData(mergedData as UserProfile);
      } else if (profileError && profileError.code !== 'PGRST116') { // PGRST116: No rows found, fine for new user
         console.error("Error fetching profile:", profileError.message);
         toast({variant: "destructive", title: "Profile Error", description: "Could not load your profile."});
         // Fallback to local/defaults
         setFormData(prev => ({ ...prev, ...localData, email: session.user.email, name: localData.name || session.user.user_metadata?.full_name }));
      } else {
        // No profile in Supabase yet, use local data and session email/name
        setFormData(prev => ({ ...prev, ...localData, email: session.user.email, name: localData.name || session.user.user_metadata?.full_name }));
      }
      setIsLoadingProfile(false);
    };
    checkAuthAndLoadData();
  }, [router]);

  useEffect(() => {
    if(isClient && currentStep < TOTAL_STEPS && !isLoadingProfile) {
      // Save progress locally as user moves through onboarding
      saveLocalOnboardingData(formData);
    }
  }, [formData, isClient, currentStep, isLoadingProfile]);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox' && name === 'healthGoalsCheckbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        health_goals: checked
          ? [...(prev.health_goals || []), value]
          : (prev.health_goals || []).filter((goal) => goal !== value),
      }));
    } else if (type === 'checkbox' && name === 'dietaryRestrictionsCheckbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        dietary_restrictions: checked
          ? [...(prev.dietary_restrictions || []), value]
          : (prev.dietary_restrictions || []).filter((restriction) => restriction !== value),
      }));
    } else if (name === "water_goal") {
      setFormData((prev) => ({ ...prev, water_goal: parseInt(value, 10) || 0 }));
    } else if (name === "age" || name === "height" || name === "weight") {
        setFormData((prev) => ({ ...prev, [name]: value })); // Keep as string, parse on submit
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name: keyof UserProfile | 'reminderSettings.mealRemindersEnabled' | 'reminderSettings.waterReminderEnabled' | 'enable_carbon_tracking' | 'also_track_sustainability') => (checked: boolean) => {
    if (name === 'reminderSettings.mealRemindersEnabled') {
      setFormData(prev => ({ ...prev, reminderSettings: { ...(prev.reminderSettings || defaultUserProfileData.reminderSettings!), mealRemindersEnabled: checked } }));
    } else if (name === 'reminderSettings.waterReminderEnabled') {
      setFormData(prev => ({ ...prev, reminderSettings: { ...(prev.reminderSettings || defaultUserProfileData.reminderSettings!), waterReminderEnabled: checked } }));
    } else if (name === 'enable_carbon_tracking') {
      setFormData(prev => ({ ...prev, enable_carbon_tracking: checked }));
    } else if (name === 'also_track_sustainability') {
      setFormData(prev => ({ ...prev, also_track_sustainability: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name as keyof UserProfile]: checked as any }));
    }
  };

  const handleSelectChange = (name: keyof UserProfile | 'reminderSettings.waterReminderInterval' | 'height_unit' | 'weight_unit') => (value: string | number) => {
    if (name === 'reminderSettings.waterReminderInterval') {
        setFormData((prev) => ({
            ...prev,
            reminderSettings: { ...(prev.reminderSettings || defaultUserProfileData.reminderSettings!), waterReminderInterval: Number(value) },
        }));
    } else if (name === 'height_unit' || name === 'weight_unit') {
       setFormData((prev) => ({ ...prev, [name]: value as 'cm' | 'in' | 'kg' | 'lbs' }));
    } else {
      setFormData((prev) => ({ ...prev, [name as keyof UserProfile]: value as any }));
    }
  };

  const handleRadioChange = (name: keyof UserProfile) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = async () => {
    // Validation for current step
    if (currentStep === 1) { // Basic Details (name, age, gender - email is from authUser)
        if (!formData.name || !formData.age) {
            toast({ variant: "destructive", title: "Missing fields", description: "Please fill in your name and year of birth." });
            return;
        }
    }
    if (currentStep === 2 && (!formData.height || !formData.weight || !formData.activity_level)) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please provide height, weight, and activity level." });
      return;
    }
    if (currentStep === 3 && (!formData.health_goals || formData.health_goals.length === 0)) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please select at least one health goal." });
      return;
    }
     if (currentStep === 4 && (!formData.diet_type)) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please select your diet type." });
      return;
    }
     // Step 5 (Eco Mission) is informational, no validation
     if (currentStep === 6 && (!formData.sleep_hours || !formData.stress_level || !formData.water_goal)) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please complete all lifestyle fields." });
      return;
    }
    // Step 7 (Notifications) is also mostly optional preferences

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Session expired. Please log in again." });
      router.push('/login');
      return;
    }
    setIsLoading(true);

    const profileToSave: Partial<UserProfile> = {
      ...formData,
      id: authUser.id, // Ensure ID is from the authenticated user
      email: authUser.email, // Ensure email is from authenticated user
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };
    
    // Convert numeric string fields to numbers if they exist
    if (profileToSave.age) profileToSave.age = profileToSave.age; // Keep as string or parse if needed
    if (profileToSave.height) profileToSave.height = profileToSave.height;
    if (profileToSave.weight) profileToSave.weight = profileToSave.weight;
    if (profileToSave.water_goal) profileToSave.water_goal = Number(profileToSave.water_goal);


    const { error } = await supabase
      .from('profiles')
      .upsert(profileToSave, { onConflict: 'id' });

    if (error) {
      toast({ variant: "destructive", title: "Error Saving Profile", description: error.message });
      setIsLoading(false);
      return;
    }
    
    clearLocalOnboardingData(); // Clear temp data after successful save to Supabase

    toast({
      title: 'Onboarding Complete!',
      description: "Let's choose your plan.",
      action: <CheckCircle className="text-green-500" />,
    });
    router.push('/subscription');
    
    setIsLoading(false);
  };

  const handlePlaceholderFeatureClick = (featureName: string) => {
    toast({ title: `${featureName} Coming Soon!`, description: `This feature will be available in a future update. Stay tuned!` });
  };

  const progressValue = (currentStep / TOTAL_STEPS) * 100;
  
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const calculatedBMI = useMemo(() => {
    if (formData.height && formData.weight && formData.height_unit && formData.weight_unit) {
      const heightNum = parseFloat(formData.height);
      const weightNum = parseFloat(formData.weight);

      if (isNaN(heightNum) || isNaN(weightNum) || heightNum <=0 || weightNum <=0) return null;

      const heightInMeters = formData.height_unit === 'cm' ? heightNum / 100 : heightNum * 0.0254;
      const weightInKg = formData.weight_unit === 'kg' ? weightNum : weightNum * 0.453592;
      
      if (heightInMeters > 0 && weightInKg > 0) {
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(1);
      }
    }
    return null;
  }, [formData.height, formData.weight, formData.height_unit, formData.weight_unit]);

  const healthGoalOptions = [
    { id: 'lose-weight', label: 'Lose Weight' },
    { id: 'gain-muscle', label: 'Gain Muscle' },
    { id: 'maintain-weight', label: 'Maintain Weight' },
    { id: 'eat-healthier', label: 'Eat Healthier' },
    { id: 'improve-energy', label: 'Improve Energy Levels' },
  ];

  if (!isClient || isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading onboarding...</p>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader>
        <div className="flex justify-center mb-2">
          { currentStep === 1 ? <User className="h-10 w-10 text-primary"/> :
            currentStep === 2 ? <BarChart3 className="h-10 w-10 text-primary"/> :
            currentStep === 3 ? <Target className="h-10 w-10 text-primary"/> :
            currentStep === 4 ? <Salad className="h-10 w-10 text-primary"/> :
            currentStep === 5 ? <Leaf className="h-10 w-10 text-primary" /> : // Eco Mission
            currentStep === 6 ? <HeartHandshake className="h-10 w-10 text-primary"/> :
            // currentStep === 7 ? <BellRing className="h-10 w-10 text-primary"/> : // Notifications are now part of review
            <CheckCircle className="h-10 w-10 text-primary" /> // Review Step (TOTAL_STEPS)
          }
        </div>
        <CardTitle className="text-center text-3xl font-bold text-primary">
          { currentStep === 1 && "Tell Us About Yourself"}
          { currentStep === 2 && "Your Physical Metrics"}
          { currentStep === 3 && "Your Health Goals"}
          { currentStep === 4 && "Diet & Food Preferences"}
          { currentStep === 5 && "Our Eco Mission & AI"}
          { currentStep === 6 && "Lifestyle Habits"}
          {/* { currentStep === 7 && "Notification Preferences"} */}
          { currentStep === TOTAL_STEPS && "Review & Get Started!"}
          { currentStep < TOTAL_STEPS && ` (Step ${currentStep}/${TOTAL_STEPS-1})`}
        </CardTitle>
        <CardDescription className="text-center">
          { currentStep === 1 && "Let's personalize your journey."}
          { currentStep === 2 && "This helps us provide accurate tracking and recommendations."}
          { currentStep === 3 && "What are you aiming to achieve? Select all that apply."}
          { currentStep === 4 && "Customize your diet and any specific food needs."}
          { currentStep === 5 && "Learn how EcoTrack helps you and the planet, powered by AI!"}
          { currentStep === 6 && "Understanding your habits helps us tailor advice."}
          {/* { currentStep === 7 && "Stay on track with timely reminders."} */}
          { currentStep === TOTAL_STEPS && "You're almost there! Review your information below."}
        </CardDescription>
        <Progress value={progressValue} className="w-full mt-4 h-2 [&>div]:bg-primary" />
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && ( // Basic Details
            <section className="space-y-4 animate-in fade-in duration-500">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><User className="h-6 w-6" /> Basic Details</h3>
              <div>
                <Label htmlFor="name-onboarding">Full Name</Label>
                <Input id="name-onboarding" name="name" value={formData.name || ''} onChange={handleChange} placeholder="E.g., Alex Green" required />
              </div>
              <div>
                <Label htmlFor="email-onboarding-display">Email Address</Label>
                 <Input id="email-onboarding-display" name="email" type="email" value={formData.email || authUser?.email || ''} disabled className="bg-muted/50 pl-10" />
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hidden" /> {/* Hidden but keeps structure for other email inputs */}
              </div>
              <div>
                <Label htmlFor="age-onboarding">Year of Birth</Label>
                <Input id="age-onboarding" name="age" type="number" value={formData.age || ''} onChange={handleChange} placeholder={`E.g., ${currentYear - 30}`} min="1900" max={(currentYear - 5).toString()} required />
              </div>
              <div>
                <Label htmlFor="gender-onboarding">Gender</Label>
                <Select name="gender" value={formData.gender || ''} onValueChange={handleSelectChange('gender')}>
                  <SelectTrigger id="gender-onboarding"><SelectValue placeholder="Select gender" /></SelectTrigger>
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

          {currentStep === 2 && ( // Physical Metrics
             <section className="space-y-4 animate-in fade-in duration-500">
                 <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><BarChart3 className="h-6 w-6" /> Your Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height-onboarding">Height</Label>
                    <div className="flex gap-2">
                    <Input id="height-onboarding" name="height" type="number" value={formData.height || ''} onChange={handleChange} placeholder="E.g., 170" className="flex-grow" required/>
                      <Select name="height_unit" value={formData.height_unit || 'cm'} onValueChange={handleSelectChange('height_unit')}>
                        <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="in">in</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="weight-onboarding">Weight</Label>
                    <div className="flex gap-2">
                    <Input id="weight-onboarding" name="weight" type="number" value={formData.weight || ''} onChange={handleChange} placeholder="E.g., 65" className="flex-grow" required/>
                      <Select name="weight_unit" value={formData.weight_unit || 'kg'} onValueChange={handleSelectChange('weight_unit')}>
                        <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lbs">lbs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {calculatedBMI && <p className="text-sm text-muted-foreground text-center">Calculated BMI: {calculatedBMI} (Note: BMI is an estimate of body fat based on height and weight.)</p>}
                 <div>
                  <Label>Typical Activity Level</Label>
                  <RadioGroup name="activity_level" value={formData.activity_level || 'moderate'} onValueChange={handleRadioChange('activity_level')} className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="sedentary" id="sedentary" /><Label htmlFor="sedentary" className="font-normal cursor-pointer">Sedentary (little to no exercise)</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="light" id="light" /><Label htmlFor="light" className="font-normal cursor-pointer">Lightly Active (light exercise/sports 1-3 days/week)</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="moderate" id="moderate" /><Label htmlFor="moderate" className="font-normal cursor-pointer">Moderately Active (moderate exercise/sports 3-5 days/week)</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="very" id="very" /><Label htmlFor="very" className="font-normal cursor-pointer">Very Active (hard exercise/sports 6-7 days a week)</Label></div>
                    </RadioGroup>
                </div>
                 <div className="p-3 border rounded-md flex items-center justify-between">
                    <Label htmlFor="fitnessSyncOnboarding" className="text-sm">Sync fitness tracker?</Label>
                    <Button size="sm" type="button" variant="outline" onClick={() => handlePlaceholderFeatureClick('Fitness Tracker Sync')}>Connect Health App</Button>
                 </div>
              </section>
          )}

           {currentStep === 3 && ( // Health Goals
              <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><Target className="h-6 w-6" /> Health Goals & Focus</h3>
                <div>
                  <Label>Primary Health Goals (select all that apply)</Label>
                  <div className="space-y-2 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {healthGoalOptions.map((goal) => (
                      <div key={goal.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50">
                        <Checkbox
                          id={`healthGoalsCheckbox-${goal.id}`}
                          name="healthGoalsCheckbox"
                          value={goal.label}
                          checked={(formData.health_goals || []).includes(goal.label)}
                          onCheckedChange={(checked) => {
                            const isChecked = !!checked;
                            handleChange({
                              target: {
                                name: "healthGoalsCheckbox",
                                value: goal.label,
                                type: "checkbox",
                                checked: isChecked,
                              }
                            } as ChangeEvent<HTMLInputElement>);
                          }}
                        />
                        <Label htmlFor={`healthGoalsCheckbox-${goal.id}`} className="font-normal cursor-pointer">{goal.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                 <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                    <Label htmlFor="also_track_sustainabilityOnboarding" className="flex flex-col">
                        <span>Also track sustainability?</span>
                        <span className="text-xs text-muted-foreground">Focus on eco-friendly choices.</span>
                    </Label>
                    <Switch id="also_track_sustainabilityOnboarding" name="also_track_sustainability" checked={!!formData.also_track_sustainability} onCheckedChange={handleSwitchChange('also_track_sustainability')} />
                </div>
                <div>
                  <Label htmlFor="exercise_frequency-onboarding">How many days a week do you typically exercise?</Label>
                  <Select name="exercise_frequency" value={formData.exercise_frequency || '1-2'} onValueChange={handleSelectChange('exercise_frequency')}>
                    <SelectTrigger id="exercise_frequency-onboarding"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 days</SelectItem>
                      <SelectItem value="1-2">1-2 days</SelectItem>
                      <SelectItem value="3-4">3-4 days</SelectItem>
                      <SelectItem value="5+">5+ days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div>
                  <Label>Customize Macro Split (Optional)</Label>
                  <div className="p-4 border rounded-md text-center bg-muted/50">
                    <PieChartIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                    <p className="text-sm text-muted-foreground">Carbs: {formData.macroSplit?.carbs}% | Protein: {formData.macroSplit?.protein}% | Fat: {formData.macroSplit?.fat}%</p>
                    <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => handlePlaceholderFeatureClick('Edit Macro Split during Onboarding')}>Edit Split</Button> or <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => handlePlaceholderFeatureClick('AI Macro Recommendation')}>Use AI Recommendation</Button>
                  </div>
                </div>
              </section>
          )}

          {currentStep === 4 && ( // Diet & Food Preferences
             <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><Salad className="h-6 w-6" /> Diet & Food Preferences</h3>
                 <div>
                  <Label htmlFor="diet_type-onboarding">Are you following any specific diet?</Label>
                  <Select name="diet_type" value={formData.diet_type || 'none'} onValueChange={handleSelectChange('diet_type')}>
                    <SelectTrigger id="diet_type-onboarding"><SelectValue placeholder="Select diet type" /></SelectTrigger>
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
                            id={`dietaryRestrictionsCheckbox-${allergy.id}`}
                            name="dietaryRestrictionsCheckbox"
                            value={allergy.label}
                            checked={(formData.dietary_restrictions || []).includes(allergy.label)}
                            onCheckedChange={(checked) => {
                               const isChecked = !!checked;
                                handleChange({
                                  target: {
                                    name: "dietaryRestrictionsCheckbox",
                                    value: allergy.label,
                                    type: "checkbox",
                                    checked: isChecked,
                                  }
                                } as ChangeEvent<HTMLInputElement>);
                            }}
                            />
                            <Label htmlFor={`dietaryRestrictionsCheckbox-${allergy.id}`} className="font-normal cursor-pointer">{allergy.label}</Label>
                        </div>
                        ))}
                    </div>
                </div>
                <Textarea id="dietaryRestrictionsOtherOnboarding" name="dietary_restrictions_other" placeholder="Other restrictions or allergies not listed (comma-separated)..." className="mt-2" value={formData.dietary_restrictions_other || ''} onChange={(e) => setFormData(prev => ({...prev, dietary_restrictions_other: e.target.value})) }/>

                <div>
                  <Label htmlFor="favorite_cuisines-onboarding">Favorite Cuisines (Optional)</Label>
                  <Input id="favorite_cuisines-onboarding" name="favorite_cuisines" value={formData.favorite_cuisines || ''} onChange={handleChange} placeholder="E.g., Italian, Mexican, Indian" />
                </div>
                <div>
                  <Label htmlFor="disliked_ingredients-onboarding">Disliked Ingredients (Optional)</Label>
                  <Input id="disliked_ingredients-onboarding" name="disliked_ingredients" value={formData.disliked_ingredients || ''} onChange={handleChange} placeholder="E.g., Cilantro, Olives, Mushrooms" />
                </div>
                 <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                  <Label htmlFor="enable_carbon_trackingOnboarding" className="flex flex-col">
                    <span>Enable Carbon Tracking?</span>
                    <span className="text-xs text-muted-foreground">Understand your food's eco-impact (EcoPro feature).</span>
                  </Label>
                  <Switch id="enable_carbon_trackingOnboarding" name="enable_carbon_tracking" checked={!!formData.enable_carbon_tracking} onCheckedChange={handleSwitchChange('enable_carbon_tracking')} />
                </div>
              </section>
          )}

          {currentStep === 5 && ( // Eco Mission & AI
             <section className="space-y-6 animate-in fade-in duration-500 text-center">
                 <h3 className="text-xl font-semibold flex items-center justify-center gap-2 text-primary"><Leaf className="h-6 w-6" /> Our Eco Mission & AI Power</h3>
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
                  <Label htmlFor="sleep_hours-onboarding">On average, how many hours of sleep do you get per night?</Label>
                  <Select name="sleep_hours" value={formData.sleep_hours || '7-8'} onValueChange={handleSelectChange('sleep_hours')}>
                    <SelectTrigger id="sleep_hours-onboarding"><SelectValue placeholder="Select sleep hours" /></SelectTrigger>
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
                  <RadioGroup name="stress_level" value={formData.stress_level || 'moderate'} onValueChange={handleRadioChange('stress_level')} className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="low" id="stress_low_onboarding" /><Label htmlFor="stress_low_onboarding" className="font-normal cursor-pointer">Low</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="moderate" id="stress_moderate_onboarding" /><Label htmlFor="stress_moderate_onboarding" className="font-normal cursor-pointer">Moderate</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="high" id="stress_high_onboarding" /><Label htmlFor="stress_high_onboarding" className="font-normal cursor-pointer">High</Label></div>
                    </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="water_goalOnboarding">Daily Water Goal (number of glasses, ~250ml or 8oz each)</Label>
                  <div className="flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-blue-500"/>
                    <Input id="water_goalOnboarding" name="water_goal" type="number" value={formData.water_goal?.toString() || '8'} onChange={handleChange} placeholder="E.g., 8" min="1" max="20"/>
                  </div>
                </div>
                {/* Removed Notification Preferences from here, will be part of review/final step or profile settings */}
              </section>
          )}

          {currentStep === TOTAL_STEPS && ( // Review Step
            <section className="space-y-4 animate-in fade-in duration-500">
                 <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><CheckCircle className="h-6 w-6" /> Review Your Information</h3>
                <div className="space-y-2 border p-4 rounded-md bg-muted/30 max-h-96 overflow-y-auto text-sm">
                  <p><strong>Name:</strong> {formData.name || 'Not set'}</p>
                  <p><strong>Email:</strong> {formData.email || authUser?.email || 'Not set'}</p>
                  <p><strong>Year of Birth:</strong> {formData.age || 'Not set'}</p>
                  <p><strong>Gender:</strong> {formData.gender || 'Not set'}</p>
                  <p><strong>Height:</strong> {formData.height || 'Not set'} {formData.height_unit || 'cm'}</p>
                  <p><strong>Weight:</strong> {formData.weight || 'Not set'} {formData.weight_unit || 'kg'}</p>
                  <p><strong>Activity Level:</strong> {formData.activity_level || 'Not set'}</p>
                  <p><strong>Health Goals:</strong> {(formData.health_goals || []).join(', ') || 'None selected'}</p>
                  <p><strong>Track Sustainability:</strong> {formData.also_track_sustainability ? 'Yes' : 'No'}</p>
                  <p><strong>Exercise Frequency:</strong> {formData.exercise_frequency || 'Not set'}</p>
                  <p><strong>Diet Type:</strong> {formData.diet_type || 'Not set'}</p>
                  <p><strong>Allergies/Restrictions (Selected):</strong> {(formData.dietary_restrictions || []).join(', ') || 'None'}</p>
                  <p><strong>Allergies/Restrictions (Other):</strong> {formData.dietary_restrictions_other || 'None'}</p>
                  <p><strong>Favorite Cuisines:</strong> {formData.favorite_cuisines || 'None specified'}</p>
                  <p><strong>Disliked Ingredients:</strong> {formData.disliked_ingredients || 'None specified'}</p>
                  <p><strong>Enable Carbon Tracking:</strong> {formData.enable_carbon_tracking ? 'Yes' : 'No'}</p>
                  <p><strong>Sleep per night:</strong> {formData.sleep_hours || 'Not set'}</p>
                  <p><strong>Stress Level:</strong> {formData.stress_level || 'Not set'}</p>
                  <p><strong>Water Goal:</strong> {formData.water_goal || '8'} glasses</p>
                  <p className="mt-3 font-medium">Notification Preferences (Editable later in Profile):</p>
                  <p><strong>Meal Reminders:</strong> {formData.reminderSettings?.mealRemindersEnabled ? `Enabled (${formData.reminderSettings.breakfastTime}, ${formData.reminderSettings.lunchTime}, ${formData.reminderSettings.dinnerTime})` : 'Disabled'}</p>
                  <p><strong>Water Reminders:</strong> {formData.reminderSettings?.waterReminderEnabled ? `Enabled, every ${formData.reminderSettings.waterReminderInterval} mins` : 'Disabled'}</p>
                </div>
                <div className="p-4 border rounded-lg text-center mt-4">
                    <h4 className="font-semibold mb-2">Data Privacy Assurance</h4>
                    <ShieldAlert className="h-8 w-8 text-primary mx-auto mb-2"/>
                    <p className="text-xs text-muted-foreground">Your data is yours. We use AI to provide insights, but your personal information is handled with care. By proceeding, you agree to our (placeholder) Privacy Policy and Terms of Service.</p>
                    <div className="mt-2 flex items-center justify-center space-x-2">
                        <Checkbox id="privacyConsentOnboarding" required defaultChecked/>
                        <Label htmlFor="privacyConsentOnboarding" className="text-xs font-normal cursor-pointer">I agree to the terms and conditions.</Label>
                    </div>
                </div>
              </section>
          )}

          <CardFooter className="flex justify-between mt-8 p-0">
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isLoading}>
              Previous
            </Button>
            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={handleNext}
                className="ml-auto"
                disabled={isLoading}
              >
                Next <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
            ) : (
              <Button type="submit" className="ml-auto bg-green-600 hover:bg-green-700" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Smile className="mr-2 h-4 w-4"/>}
                Save & Choose Plan
              </Button>
            )}
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
