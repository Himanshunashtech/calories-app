
'use client';

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, saveUserProfile, fakeLogout, type UserProfile, type ReminderSettings, type AppSettings } from '@/lib/localStorage';
import { UserCircle2, Mail, Phone, Weight, Ruler, Activity, ShieldQuestion, Leaf, Save, UploadCloud, BellRing, Clock3, Repeat, Utensils, Vegan, Settings, Edit3, Cog, Palette, BarChartHorizontalBig, Droplet, LogOut, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { ALLERGY_OPTIONS } from '@/types';
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
} from "@/components/ui/alert-dialog";


const defaultProfile: UserProfile = {
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
  email: '',
  phone: '',
  profileImageUri: null,
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
  appSettings: {
    darkModeEnabled: false,
    unitPreferences: {
      weight: 'kg',
      height: 'cm',
      volume: 'ml',
    },
    hideNonCompliantRecipes: false,
  }
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    const loadedProfile = getUserProfile();
    if (loadedProfile) {
      const completeProfile: UserProfile = {
        ...defaultProfile, 
        ...loadedProfile,  
        dietaryRestrictions: Array.isArray(loadedProfile.dietaryRestrictions) ? loadedProfile.dietaryRestrictions : (loadedProfile.dietaryRestrictions ? [String(loadedProfile.dietaryRestrictions)] : []),
        reminderSettings: {
          ...defaultProfile.reminderSettings!,
          ...(loadedProfile.reminderSettings || {}),
        },
        appSettings: {
          ...defaultProfile.appSettings!,
          ...(loadedProfile.appSettings || {}),
          unitPreferences: {
            ...(defaultProfile.appSettings!.unitPreferences!),
            ...(loadedProfile.appSettings?.unitPreferences || {}),
          },
        },
      };
      setProfile(completeProfile);
    } else {
      setProfile(defaultProfile); // Should ideally not happen if onboarding is enforced
    }
    setIsLoading(false);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleReminderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
     setProfile((prev) => ({
      ...prev,
      reminderSettings: {
        ...(prev.reminderSettings || defaultProfile.reminderSettings!), 
        [name]: value,
      },
    }));
  };
  
   const handleReminderSelectChange = (name: keyof ReminderSettings) => (value: string | number) => {
    setProfile((prev) => ({
      ...prev,
      reminderSettings: {
        ...(prev.reminderSettings || defaultProfile.reminderSettings!),
        [name]: value,
      },
    }));
  };


  const handleSwitchChange = (name: keyof UserProfile | `appSettings.${keyof AppSettings}` | `reminderSettings.${keyof ReminderSettings}`) => (checked: boolean) => {
     if (name === 'enableCarbonTracking') {
      setProfile((prev) => ({ ...prev, enableCarbonTracking: checked }));
    } else if (name === 'alsoTrackSustainability') {
      setProfile((prev) => ({ ...prev, alsoTrackSustainability: checked }));
    } else if (name === 'reminderSettings.waterReminderEnabled') {
       setProfile((prev) => ({
        ...prev,
        reminderSettings: { ...(prev.reminderSettings || defaultProfile.reminderSettings!), waterReminderEnabled: checked },
      }));
    } else if (name === 'reminderSettings.mealRemindersEnabled') {
       setProfile((prev) => ({
        ...prev,
        reminderSettings: { ...(prev.reminderSettings || defaultProfile.reminderSettings!), mealRemindersEnabled: checked },
      }));
    } else {
        // For appSettings, this should be handled in the settings page
        console.warn("Unhandled switch change on profile page:", name);
    }
  };


  const handleSelectChange = (name: keyof UserProfile | `appSettings.unitPreferences.${'weight' | 'height' | 'volume'}`) => (value: string) => {
    // App unit preferences are managed on the App Settings page
    // This function on the profile page should only handle profile-specific selects
    if (!name.startsWith('appSettings.unitPreferences.')) {
         setProfile((prev) => ({ ...prev, [name as keyof UserProfile]: value as any }));
    } else {
        console.warn("Unit preferences should be changed on the App Settings page.");
    }
  };
  
  const handleDietaryRestrictionChange = (restriction: string) => (checked: boolean) => {
    setProfile((prev) => {
      const currentRestrictions = Array.isArray(prev.dietaryRestrictions) ? prev.dietaryRestrictions : [];
      return {
        ...prev,
        dietaryRestrictions: checked
          ? [...currentRestrictions, restriction]
          : currentRestrictions.filter((r) => r !== restriction),
      };
    });
  };


  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, profileImageUri: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    saveUserProfile(profile);
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been saved.',
      action: <Save className="text-green-500" />,
    });
  };

  const handleLogout = () => {
    fakeLogout();
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
    });
    router.push('/login');
  }

  if (!isClient || isLoading) {
    return (
      <div className="space-y-6 p-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader>
              <div className="h-8 w-1/3 bg-muted rounded animate-pulse mb-2 self-center"></div>
              {i === 0 && <div className="h-20 w-20 bg-muted rounded-full animate-pulse self-center mb-2"></div>}
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              { i % 2 === 0 && <div className="h-10 bg-muted rounded animate-pulse"></div> }
            </CardContent>
            <CardFooter>
              <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="relative mb-4">
            <Image
              src={profile.profileImageUri || `https://placehold.co/128x128.png?text=${profile.name ? profile.name.charAt(0).toUpperCase() : 'P'}`}
              alt="Profile Picture"
              data-ai-hint="profile avatar"
              width={128}
              height={128}
              className="rounded-full object-cover border-4 border-primary/50 shadow-md"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-0 right-0 rounded-full bg-background/80 hover:bg-muted"
              onClick={triggerImageUpload}
              aria-label="Upload profile picture"
            >
              <UploadCloud className="h-5 w-5" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="sr-only"
              id="profileImageUpload"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">{profile.name || 'Your Profile'}</CardTitle>
          <CardDescription>View and update your personal information and preferences.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><UserCircle2 /> Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <Label htmlFor="name">Full Name</Label> <Input id="name" name="name" value={profile.name} onChange={handleChange} placeholder="Your Name" /> </div>
              <div> <Label htmlFor="age">Age</Label> <Input id="age" name="age" type="number" value={profile.age} onChange={handleChange} placeholder="Your Age" /> </div>
              <div> <Label htmlFor="gender">Gender</Label> <Select name="gender" value={profile.gender} onValueChange={handleSelectChange('gender')}> <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger> <SelectContent> <SelectItem value="male">Male</SelectItem> <SelectItem value="female">Female</SelectItem> <SelectItem value="non-binary">Non-binary</SelectItem> <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> <SelectItem value="other">Other</SelectItem> </SelectContent> </Select> </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><Mail /> Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <Label htmlFor="email">Email Address</Label> <Input id="email" name="email" type="email" value={profile.email || ''} onChange={handleChange} placeholder="your.email@example.com" /> </div>
              <div> <Label htmlFor="phone">Phone Number</Label> <Input id="phone" name="phone" type="tel" value={profile.phone || ''} onChange={handleChange} placeholder="+1 123-456-7890" /> </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><Ruler /> Physical Attributes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> 
                <Label htmlFor="height">Height ({profile.appSettings?.unitPreferences?.height || 'cm'})</Label> 
                <Input id="height" name="height" type="number" value={profile.height} onChange={handleChange} placeholder={`Height in ${profile.appSettings?.unitPreferences?.height || 'cm'}`} /> 
              </div>
              <div> 
                <Label htmlFor="weight">Weight ({profile.appSettings?.unitPreferences?.weight || 'kg'})</Label> 
                <Input id="weight" name="weight" type="number" value={profile.weight} onChange={handleChange} placeholder={`Weight in ${profile.appSettings?.unitPreferences?.weight || 'kg'}`} /> 
              </div>
               <div>
                <Label htmlFor="waterGoal">Daily Water Goal ({profile.appSettings?.unitPreferences?.volume === 'fl oz' ? 'fl oz' : (profile.appSettings?.unitPreferences?.volume === 'ml' ? 'glasses (approx. 250ml)' : 'glasses')})</Label>
                <Input id="waterGoal" name="waterGoal" type="number" value={profile.waterGoal?.toString() || '8'} onChange={(e) => setProfile(prev => ({...prev, waterGoal: parseInt(e.target.value) || 8}))} placeholder="E.g., 8" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><Activity /> Goals & Activity</h3>
             <div className="space-y-4">
                <div> <Label>Primary Health Goals</Label> <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50 min-h-[40px]"> {profile.healthGoals && profile.healthGoals.length > 0 ? profile.healthGoals.join(', ') : 'Not set'} </p> <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => router.push('/onboarding')}><Edit3 className="mr-1 h-3 w-3"/>Edit Goals (Re-run Onboarding)</Button></div>
                 <div> <Label htmlFor="activityLevel">Activity Level</Label> <Select name="activityLevel" value={profile.activityLevel} onValueChange={handleSelectChange('activityLevel')}> <SelectTrigger id="activityLevel"><SelectValue placeholder="Select activity level" /></SelectTrigger> <SelectContent> <SelectItem value="sedentary">Sedentary</SelectItem> <SelectItem value="light">Lightly Active</SelectItem> <SelectItem value="moderate">Moderately Active</SelectItem> <SelectItem value="very">Very Active</SelectItem> </SelectContent> </Select> </div>
                <div> <Label htmlFor="exerciseFrequency">Exercise Frequency</Label> <Select name="exerciseFrequency" value={profile.exerciseFrequency} onValueChange={handleSelectChange('exerciseFrequency')}> <SelectTrigger id="exerciseFrequency"><SelectValue placeholder="Select frequency" /></SelectTrigger> <SelectContent> <SelectItem value="0">0 days/week</SelectItem> <SelectItem value="1-2">1-2 days/week</SelectItem> <SelectItem value="3-4">3-4 days/week</SelectItem> <SelectItem value="5+">5+ days/week</SelectItem> </SelectContent> </Select> </div>
                 <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                    <Label htmlFor="alsoTrackSustainability" className="flex flex-col">
                        <span>Track Sustainability Focus?</span>
                    </Label>
                    <Switch id="alsoTrackSustainability" checked={!!profile.alsoTrackSustainability} onCheckedChange={handleSwitchChange('alsoTrackSustainability')} />
                </div>
                 <div>
                  <Label>Current Macro Split (Placeholder)</Label>
                  <div className="p-4 border rounded-md text-center bg-muted/50">
                    <PieChart className="h-8 w-8 mx-auto text-muted-foreground mb-2"/>
                    <p className="text-sm text-muted-foreground">C: {profile.macroSplit?.carbs}% | P: {profile.macroSplit?.protein}% | F: {profile.macroSplit?.fat}%</p>
                    <Button variant="link" size="sm" className="p-0 h-auto" disabled>Edit Split</Button>
                  </div>
                </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><Utensils /> Dietary Habits</h3>
            <div className="space-y-4">
              <div> <Label htmlFor="dietType">Diet Type</Label> <Select name="dietType" value={profile.dietType} onValueChange={handleSelectChange('dietType')}> <SelectTrigger id="dietType"><SelectValue placeholder="Select diet type" /></SelectTrigger> <SelectContent> <SelectItem value="none">None</SelectItem> <SelectItem value="vegetarian">Vegetarian</SelectItem> <SelectItem value="vegan">Vegan</SelectItem> <SelectItem value="keto">Keto</SelectItem> <SelectItem value="paleo">Paleo</SelectItem><SelectItem value="pescatarian">Pescatarian</SelectItem> <SelectItem value="mediterranean">Mediterranean</SelectItem> <SelectItem value="custom">Custom</SelectItem><SelectItem value="other">Other</SelectItem> </SelectContent> </Select> </div>
              
              <div>
                <Label>Allergies/Dietary Restrictions</Label>
                <div className="space-y-2 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-md">
                  {ALLERGY_OPTIONS.map((allergy) => (
                    <div key={allergy.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`profile-allergy-${allergy.id}`}
                        checked={(profile.dietaryRestrictions || []).includes(allergy.label)}
                        onCheckedChange={(checked) => handleDietaryRestrictionChange(allergy.label)(!!checked)}
                      />
                      <Label htmlFor={`profile-allergy-${allergy.id}`} className="font-normal cursor-pointer">{allergy.label}</Label>
                    </div>
                  ))}
                </div>
                 <Textarea id="dietaryRestrictionsOtherProfile" name="dietaryRestrictionsOther" placeholder="Other restrictions (comma-separated)..." className="mt-2" value={(profile.dietaryRestrictions || []).filter(r => !ALLERGY_OPTIONS.find(ao => ao.label === r)).join(', ')} onChange={(e) => { const custom = e.target.value.split(',').map(s => s.trim()).filter(Boolean); setProfile(prev => ({...prev, dietaryRestrictions: [...(prev.dietaryRestrictions || []).filter(r => ALLERGY_OPTIONS.find(ao => ao.label ===r)), ...custom]}))}}/>
              </div>

              <div> <Label htmlFor="favoriteCuisines">Favorite Cuisines</Label> <Input id="favoriteCuisines" name="favoriteCuisines" value={profile.favoriteCuisines || ''} onChange={handleChange} placeholder="e.g., Italian, Mexican" /> </div>
              <div> <Label htmlFor="dislikedIngredients">Disliked Ingredients</Label> <Input id="dislikedIngredients" name="dislikedIngredients" value={profile.dislikedIngredients || ''} onChange={handleChange} placeholder="e.g., Cilantro, Olives" /> </div>
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="enableCarbonTracking" className="flex items-center gap-2"><Leaf className="h-5 w-5"/> Enable Carbon Tracking (EcoPro)</Label>
                <Switch id="enableCarbonTracking" checked={!!profile.enableCarbonTracking} onCheckedChange={handleSwitchChange('enableCarbonTracking')} />
              </div>
            </div>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><ShieldQuestion /> Lifestyle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div> <Label htmlFor="sleepHours">Sleep per night</Label> <Select name="sleepHours" value={profile.sleepHours} onValueChange={handleSelectChange('sleepHours')}> <SelectTrigger id="sleepHours"><SelectValue placeholder="Select sleep hours" /></SelectTrigger> <SelectContent> <SelectItem value="<5">&lt;5 hours</SelectItem> <SelectItem value="5-6">5-6 hours</SelectItem> <SelectItem value="7-8">7-8 hours</SelectItem> <SelectItem value="8+">8+ hours</SelectItem> </SelectContent> </Select> </div>
                <div> <Label htmlFor="stressLevel">Stress Level</Label> <Select name="stressLevel" value={profile.stressLevel} onValueChange={handleSelectChange('stressLevel')}> <SelectTrigger id="stressLevel"><SelectValue placeholder="Select stress level" /></SelectTrigger> <SelectContent> <SelectItem value="low">Low</SelectItem> <SelectItem value="moderate">Moderate</SelectItem> <SelectItem value="high">High</SelectItem> </SelectContent> </Select> </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><BellRing /> Reminder Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="mealRemindersEnabledProfile" className="flex items-center gap-2"><Utensils className="h-5 w-5"/> Meal Reminders</Label>
                <Switch id="mealRemindersEnabledProfile" checked={!!profile.reminderSettings?.mealRemindersEnabled} onCheckedChange={handleSwitchChange('reminderSettings.mealRemindersEnabled')} />
              </div>
              {profile.reminderSettings?.mealRemindersEnabled && (
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end p-3 border rounded-md bg-muted/30">
                    <div> <Label htmlFor="breakfastTimeProfile"><Clock3 className="inline mr-1 h-4 w-4"/>Breakfast</Label> <Input id="breakfastTimeProfile" name="breakfastTime" type="time" value={profile.reminderSettings?.breakfastTime || '08:00'} onChange={handleReminderChange} /> </div>
                    <div> <Label htmlFor="lunchTimeProfile"><Clock3 className="inline mr-1 h-4 w-4"/>Lunch</Label> <Input id="lunchTimeProfile" name="lunchTime" type="time" value={profile.reminderSettings?.lunchTime || '12:30'} onChange={handleReminderChange} /> </div>
                    <div> <Label htmlFor="dinnerTimeProfile"><Clock3 className="inline mr-1 h-4 w-4"/>Dinner</Label> <Input id="dinnerTimeProfile" name="dinnerTime" type="time" value={profile.reminderSettings?.dinnerTime || '18:30'} onChange={handleReminderChange} /> </div>
                </div>
              )}
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="waterReminderEnabledProfile" className="flex items-center gap-2"><Droplet className="h-5 w-5 text-blue-500"/> Water Reminder</Label>
                <Switch id="waterReminderEnabledProfile" checked={!!profile.reminderSettings?.waterReminderEnabled} onCheckedChange={handleSwitchChange('reminderSettings.waterReminderEnabled')} />
              </div>
              {profile.reminderSettings?.waterReminderEnabled && (
                <div className="p-3 border rounded-md bg-muted/30 space-y-2">
                  <Label htmlFor="waterReminderIntervalProfile">Remind every:</Label>
                  <Select name="waterReminderInterval" value={profile.reminderSettings?.waterReminderInterval?.toString() || '60'} onValueChange={(val) => handleReminderSelectChange('waterReminderInterval')(parseInt(val))}>
                    <SelectTrigger id="waterReminderIntervalProfile"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
               <div>
                <Label htmlFor="snoozeDurationProfile">Notification Snooze Duration (Placeholder)</Label>
                 <Select name="snoozeDuration" value={profile.reminderSettings?.snoozeDuration?.toString() || '5'} onValueChange={(val) => handleReminderSelectChange('snoozeDuration')(parseInt(val))}>
                    <SelectTrigger id="snoozeDurationProfile" disabled><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
              <p className="text-xs text-muted-foreground">Note: Actual notification delivery depends on browser/device settings and app capabilities.</p>
            </div>
          </section>
        </CardContent>
        <CardFooter className="flex-col space-y-2 pt-6">
          <Button onClick={handleSubmit} className="w-full text-lg py-6">
            <Save className="mr-2 h-5 w-5" />
            Save Profile &amp; Preferences
          </Button>
           <Button onClick={() => router.push('/app/settings')} className="w-full" variant="outline">
            <Cog className="mr-2 h-5 w-5"/>
            Go to App Settings
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <LogOut className="mr-2 h-5 w-5" /> Log Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out of your EcoAI Calorie Tracker account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className={cn(buttonVariants({variant: 'destructive'}))}>
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}

    