
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
import { supabase } from '@/lib/supabaseClient';
import type { UserProfile, ReminderSettings, AppSettings } from '@/types';
import { ALLERGY_OPTIONS, defaultUserProfileData } from '@/types'; // Import defaultUserProfileData
import { UserCircle2, Mail, Phone, Weight, Ruler, Activity, ShieldQuestion, Leaf, Save, UploadCloud, BellRing, Clock3, Utensils, Settings, Edit3, Cog, Palette, Droplet, LogOut, PieChart, CalendarDays, Trash2, Sprout, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter as ModalFooter, DialogTrigger as ModalTrigger } from "@/components/ui/dialog"; // Renamed DialogFooter for clarity
import { buttonVariants } from '@/components/ui/button';


export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfileData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMacroModalOpen, setIsMacroModalOpen] = useState(false);
  const [tempMacroSplit, setTempMacroSplit] = useState(profile.macroSplit || { carbs: 50, protein: 25, fat: 25 });
  const [authUser, setAuthUser] = useState<any>(null); // To store Supabase auth user

  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    const fetchUserAndProfile = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthUser(user);
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching profile:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load profile." });
        } else if (profileData) {
          const completeProfile: UserProfile = {
            ...defaultUserProfileData,
            ...profileData,
            email: user.email || profileData.email, // Prioritize auth email
            profile_image_url: profileData.profile_image_url || user.user_metadata?.avatar_url || defaultUserProfileData.profile_image_url,
            name: profileData.name || user.user_metadata?.full_name || defaultUserProfileData.name,
            health_goals: Array.isArray(profileData.health_goals) ? profileData.health_goals : [],
            dietary_restrictions: Array.isArray(profileData.dietary_restrictions) ? profileData.dietary_restrictions : [],
            reminderSettings: {
              ...defaultUserProfileData.reminderSettings!,
              ...(profileData.reminderSettings as ReminderSettings || {}),
            },
            appSettings: {
              ...defaultUserProfileData.appSettings!,
              ...(profileData.appSettings as AppSettings || {}),
              unitPreferences: {
                ...(defaultUserProfileData.appSettings!.unitPreferences!),
                ...((profileData.appSettings as AppSettings)?.unitPreferences || {}),
              },
            },
            macroSplit: profileData.macroSplit || defaultUserProfileData.macroSplit,
          };
          setProfile(completeProfile);
          setTempMacroSplit(completeProfile.macroSplit!);
        } else {
          // No profile in DB, create one based on auth user if possible
          const newProfile: UserProfile = {
            ...defaultUserProfileData,
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name,
            profile_image_url: user.user_metadata?.avatar_url,
          };
          setProfile(newProfile);
          setTempMacroSplit(newProfile.macroSplit!);
          // Consider saving this initial profile to DB here or prompt user to complete profile
        }
      } else {
        router.push('/login'); // No user, redirect to login
      }
      setIsLoading(false);
    };
    fetchUserAndProfile();
  }, [router, toast]);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleReminderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      reminderSettings: {
        ...(prev.reminderSettings || defaultUserProfileData.reminderSettings!),
        [name]: value,
      },
    }));
  };

  const handleReminderSelectChange = (name: keyof ReminderSettings) => (value: string | number) => {
    setProfile((prev) => ({
      ...prev,
      reminderSettings: {
        ...(prev.reminderSettings || defaultUserProfileData.reminderSettings!),
        [name]: value,
      },
    }));
  };

  const handleSwitchChange = (name: keyof UserProfile | `reminderSettings.${keyof ReminderSettings}` | `appSettings.${keyof AppSettings}`) => (checked: boolean) => {
    if (name === 'enable_carbon_tracking') {
      setProfile((prev) => ({ ...prev, enable_carbon_tracking: checked }));
    } else if (name === 'also_track_sustainability') {
      setProfile((prev) => ({ ...prev, also_track_sustainability: checked }));
    } else if (name === 'reminderSettings.waterReminderEnabled') {
      setProfile((prev) => ({ ...prev, reminderSettings: { ...(prev.reminderSettings || defaultUserProfileData.reminderSettings!), waterReminderEnabled: checked } }));
    } else if (name === 'reminderSettings.mealRemindersEnabled') {
      setProfile((prev) => ({ ...prev, reminderSettings: { ...(prev.reminderSettings || defaultUserProfileData.reminderSettings!), mealRemindersEnabled: checked } }));
    } else if (name === 'appSettings.darkModeEnabled') {
      setProfile(prev => ({ ...prev, appSettings: { ...(prev.appSettings || defaultUserProfileData.appSettings!), darkModeEnabled: checked } }));
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', checked);
      }
    } else if (name === 'appSettings.hideNonCompliantRecipes') {
      setProfile(prev => ({ ...prev, appSettings: { ...(prev.appSettings || defaultUserProfileData.appSettings!), hideNonCompliantRecipes: checked } }));
    } else {
      console.warn("Unhandled switch change on profile page:", name);
    }
  };

  const handleSelectChange = (name: keyof UserProfile | `appSettings.unitPreferences.${keyof AppSettings['unitPreferences']}` | 'height_unit' | 'weight_unit') => (value: string) => {
    if (name.startsWith('appSettings.unitPreferences.')) {
      const unitKey = name.split('.').pop() as keyof AppSettings['unitPreferences'];
      setProfile(prev => ({
        ...prev,
        appSettings: {
          ...(prev.appSettings || defaultUserProfileData.appSettings!),
          unitPreferences: {
            ...(prev.appSettings?.unitPreferences || defaultUserProfileData.appSettings!.unitPreferences!),
            [unitKey]: value,
          }
        }
      }));
    } else if (name === 'height_unit' || name === 'weight_unit') {
       setProfile((prev) => ({ ...prev, [name]: value as 'cm' | 'in' | 'kg' | 'lbs' }));
    }
    
    else {
      setProfile((prev) => ({ ...prev, [name as keyof UserProfile]: value as any }));
    }
  };
  
  const handleDietaryRestrictionChange = (restriction: string) => (checked: boolean) => {
    setProfile((prev) => {
      const currentRestrictions = Array.isArray(prev.dietary_restrictions) ? prev.dietary_restrictions : [];
      return {
        ...prev,
        dietary_restrictions: checked
          ? [...currentRestrictions, restriction]
          : currentRestrictions.filter((r) => r !== restriction),
      };
    });
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && authUser?.id) {
      setIsSaving(true);
      const filePath = `${authUser.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('avatars') // Ensure you have an "avatars" bucket in Supabase Storage
        .upload(filePath, file);

      if (error) {
        toast({ variant: "destructive", title: "Upload Failed", description: error.message });
        setIsSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      if (publicUrl) {
        setProfile((prev) => ({ ...prev, profile_image_url: publicUrl }));
        // Optimistically update UI, then save to profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ profile_image_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', authUser.id);
        if (updateError) {
          toast({ variant: "destructive", title: "Profile Update Failed", description: "Could not save new avatar to profile. "  + updateError.message });
        } else {
          toast({ title: "Avatar Updated!", description: "Your new profile picture is set."});
        }
      }
      setIsSaving(false);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!authUser?.id) {
      toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
      return;
    }
    setIsSaving(true);
    const { id, created_at, email: authEmail, ...profileToSave } = profile; // Exclude id, created_at, email from direct update
    
    const dataToUpdate = {
        ...profileToSave,
        updated_at: new Date().toISOString(),
        // Ensure nested objects are correctly structured if your DB expects JSON
        reminderSettings: profile.reminderSettings || defaultUserProfileData.reminderSettings,
        appSettings: profile.appSettings || defaultUserProfileData.appSettings,
        macroSplit: profile.macroSplit || defaultUserProfileData.macroSplit,
    };


    const { error } = await supabase
      .from('profiles')
      .update(dataToUpdate)
      .eq('id', authUser.id);

    if (error) {
      toast({ variant: "destructive", title: "Profile Update Failed", description: error.message });
    } else {
      toast({ title: 'Profile Updated', description: 'Your profile information has been saved.', action: <Save className="text-green-500" /> });
    }
    setIsSaving(false);
  };

  const handleMacroSplitChange = (macro: 'carbs' | 'protein' | 'fat', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setTempMacroSplit(prev => ({ ...(prev || defaultUserProfileData.macroSplit!), [macro]: numValue }));
    } else if (value === '') {
      setTempMacroSplit(prev => ({ ...(prev || defaultUserProfileData.macroSplit!), [macro]: 0 }));
    }
  };

  const saveMacroSplit = () => {
    const { carbs, protein, fat } = tempMacroSplit || defaultUserProfileData.macroSplit!;
    if (carbs + protein + fat !== 100) {
      toast({ variant: 'destructive', title: 'Invalid Macro Split', description: 'Carbs, Protein, and Fat percentages must sum to 100.' });
      return;
    }
    setProfile(prev => ({ ...prev, macroSplit: { ...(tempMacroSplit || defaultUserProfileData.macroSplit!) } }));
    setIsMacroModalOpen(false);
    // Consider calling handleSubmit here or let user save all changes together
    toast({ title: 'Macro Split Updated (Locally)', description: 'Your new macro targets are set. Click Save Profile to persist.' });
  };

  const handleLogout = async () => {
    setIsSaving(true);
    const { error } = await supabase.auth.signOut();
    // clearAllNonAuthLocalStorage(); // Clear other app data if desired
    if (error) {
      toast({ variant: "destructive", title: "Logout Failed", description: error.message });
    } else {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    }
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!authUser?.id) {
      toast({variant: "destructive", title: "Error", description: "User not found for deletion."});
      return;
    }
    // This is a complex operation. For a real app, you'd call a Supabase Edge Function
    // to delete auth user and related data transactionally.
    // Client-side deletion is not recommended for auth.users table.
    // For now, we'll just sign out and clear local data.
    
    // 1. Delete from 'profiles' table
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', authUser.id);

    if (profileDeleteError) {
      toast({variant: "destructive", title: "Deletion Error", description: `Could not delete profile data: ${profileDeleteError.message}. Please contact support.`});
      return;
    }

    // 2. Attempt to sign out
    await supabase.auth.signOut();
    // clearAllNonAuthLocalStorage(); // Clear other local data

    toast({ title: 'Account Data Cleared (Locally)', description: 'Your profile data on this device has been removed. For full account deletion, contact support (placeholder).', variant: 'default', duration: 7000 });
    router.push('/signup'); 
    // In a real app, you'd also need to delete the user from `auth.users` via a server-side function.
  };

  const handlePlaceholderFeatureClick = (featureName: string) => {
    toast({ title: `${featureName} Coming Soon!`, description: `This feature will be available in a future update.` });
  };

  if (!isClient || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="relative mb-4">
            <Image
              src={profile.profile_image_url || `https://placehold.co/128x128.png?text=${profile.name ? profile.name.charAt(0).toUpperCase() : 'P'}`}
              alt="Profile Picture"
              data-ai-hint="profile avatar"
              width={128}
              height={128}
              className="rounded-full object-cover border-4 border-primary/50 shadow-md"
              unoptimized={!!profile.profile_image_url} // Add this if Supabase URLs aren't in next.config.js images domains
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-0 right-0 rounded-full bg-background/80 hover:bg-muted"
              onClick={triggerImageUpload}
              aria-label="Upload profile picture"
              disabled={isSaving}
            >
              {isSaving && profile.profile_image_url === null ? <Loader2 className="h-5 w-5 animate-spin"/> : <UploadCloud className="h-5 w-5" />}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="sr-only" id="profileImageUpload" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">{profile.name || 'Your Profile'}</CardTitle>
          <CardDescription>View and update your personal information and preferences.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><UserCircle2 /> Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <Label htmlFor="name">Full Name</Label> <Input id="name" name="name" value={profile.name || ''} onChange={handleChange} placeholder="Your Name" /> </div>
              <div> <Label htmlFor="age">Year of Birth</Label> <Input id="age" name="age" type="number" value={profile.age || ''} onChange={handleChange} placeholder={`E.g., ${new Date().getFullYear() - 30}`} /> </div>
              <div> <Label htmlFor="gender">Gender</Label> <Select name="gender" value={profile.gender || ''} onValueChange={handleSelectChange('gender')}> <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger> <SelectContent> <SelectItem value="male">Male</SelectItem> <SelectItem value="female">Female</SelectItem> <SelectItem value="non-binary">Non-binary</SelectItem> <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> <SelectItem value="other">Other</SelectItem> </SelectContent> </Select> </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><Mail /> Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <Label htmlFor="email-profile">Email Address</Label> <Input id="email-profile" name="email" type="email" value={profile.email || ''} disabled className="bg-muted/50" /> </div>
              <div> <Label htmlFor="phone">Phone Number (Optional)</Label> <Input id="phone" name="phone" type="tel" value={profile.phone || ''} onChange={handleChange} placeholder="+1 123-456-7890" /> </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><Ruler /> Physical Attributes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height">Height ({profile.appSettings?.unitPreferences?.height || profile.height_unit || 'cm'})</Label>
                <Input id="height" name="height" type="number" value={profile.height || ''} onChange={handleChange} placeholder={`Height in ${profile.appSettings?.unitPreferences?.height || profile.height_unit || 'cm'}`} />
              </div>
              <div>
                <Label htmlFor="weight">Weight ({profile.appSettings?.unitPreferences?.weight || profile.weight_unit || 'kg'})</Label>
                <Input id="weight" name="weight" type="number" value={profile.weight || ''} onChange={handleChange} placeholder={`Weight in ${profile.appSettings?.unitPreferences?.weight || profile.weight_unit || 'kg'}`} />
              </div>
              <div>
                <Label htmlFor="water_goal">Daily Water Goal ({profile.appSettings?.unitPreferences?.volume === 'fl oz' ? 'fl oz' : (profile.appSettings?.unitPreferences?.volume === 'ml' ? 'glasses (approx. 250ml)' : 'glasses')})</Label>
                <Input id="water_goal" name="water_goal" type="number" value={profile.water_goal?.toString() || '8'} onChange={(e) => setProfile(prev => ({ ...prev, water_goal: parseInt(e.target.value) || 8 }))} placeholder="E.g., 8" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><Activity /> Goals & Activity</h3>
            <div className="space-y-4">
              <div> <Label>Primary Health Goals</Label> <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50 min-h-[40px]"> {profile.health_goals && profile.health_goals.length > 0 ? profile.health_goals.join(', ') : 'Not set'} </div> <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => router.push('/onboarding')}><Edit3 className="mr-1 h-3 w-3" />Edit Goals (Re-run Onboarding)</Button></div>
              <div> <Label htmlFor="activity_level">Activity Level</Label> <Select name="activity_level" value={profile.activity_level || ''} onValueChange={handleSelectChange('activity_level')}> <SelectTrigger id="activity_level"><SelectValue placeholder="Select activity level" /></SelectTrigger> <SelectContent> <SelectItem value="sedentary">Sedentary</SelectItem> <SelectItem value="light">Lightly Active</SelectItem> <SelectItem value="moderate">Moderately Active</SelectItem> <SelectItem value="very">Very Active</SelectItem> </SelectContent> </Select> </div>
              <div> <Label htmlFor="exercise_frequency">Exercise Frequency</Label> <Select name="exercise_frequency" value={profile.exercise_frequency || ''} onValueChange={handleSelectChange('exercise_frequency')}> <SelectTrigger id="exercise_frequency"><SelectValue placeholder="Select frequency" /></SelectTrigger> <SelectContent> <SelectItem value="0">0 days/week</SelectItem> <SelectItem value="1-2">1-2 days/week</SelectItem> <SelectItem value="3-4">3-4 days/week</SelectItem> <SelectItem value="5+">5+ days/week</SelectItem> </SelectContent> </Select> </div>
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="also_track_sustainability" className="flex flex-col"><span>Track Sustainability Focus?</span></Label>
                <Switch id="also_track_sustainability" checked={!!profile.also_track_sustainability} onCheckedChange={handleSwitchChange('also_track_sustainability')} />
              </div>
              <div>
                <Label>Current Macro Split</Label>
                <div className="p-4 border rounded-md text-center bg-muted/50">
                  <PieChart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">C: {profile.macroSplit?.carbs}% | P: {profile.macroSplit?.protein}% | F: {profile.macroSplit?.fat}%</p>
                  <ModalTrigger asChild>
                    <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => { setTempMacroSplit(profile.macroSplit || { carbs: 50, protein: 25, fat: 25 }); setIsMacroModalOpen(true); }}>Edit Split</Button>
                  </ModalTrigger>
                  or <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => handlePlaceholderFeatureClick('AI Macro Recommendation')}>Use AI Recommendation</Button>
                </div>
              </div>
              <div className="p-3 border rounded-md flex items-center justify-between">
                <Label htmlFor="fitnessSyncProfile" className="text-sm">Sync fitness tracker?</Label>
                <Button size="sm" variant="outline" onClick={() => handlePlaceholderFeatureClick('Fitness Tracker Sync')}>Connect Health App</Button>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><Utensils /> Dietary Habits</h3>
            <div className="space-y-4">
              <div> <Label htmlFor="diet_type">Diet Type</Label> <Select name="diet_type" value={profile.diet_type || ''} onValueChange={handleSelectChange('diet_type')}> <SelectTrigger id="diet_type"><SelectValue placeholder="Select diet type" /></SelectTrigger> <SelectContent> <SelectItem value="none">None</SelectItem> <SelectItem value="vegetarian">Vegetarian</SelectItem> <SelectItem value="vegan">Vegan</SelectItem> <SelectItem value="keto">Keto</SelectItem> <SelectItem value="paleo">Paleo</SelectItem><SelectItem value="pescatarian">Pescatarian</SelectItem> <SelectItem value="mediterranean">Mediterranean</SelectItem> <SelectItem value="custom">Custom</SelectItem><SelectItem value="other">Other</SelectItem> </SelectContent> </Select> </div>
              <div>
                <Label>Allergies/Dietary Restrictions</Label>
                <div className="space-y-2 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-md">
                  {ALLERGY_OPTIONS.map((allergy) => (
                    <div key={allergy.id} className="flex items-center space-x-2">
                      <Checkbox id={`profile-allergy-${allergy.id}`} checked={(profile.dietary_restrictions || []).includes(allergy.label)} onCheckedChange={(checked) => handleDietaryRestrictionChange(allergy.label)(!!checked)} />
                      <Label htmlFor={`profile-allergy-${allergy.id}`} className="font-normal cursor-pointer">{allergy.label}</Label>
                    </div>
                  ))}
                </div>
                <Textarea id="dietaryRestrictionsOtherProfile" name="dietary_restrictions" placeholder="Other restrictions (comma-separated)..." className="mt-2" value={(profile.dietary_restrictions || []).filter(r => !ALLERGY_OPTIONS.find(ao => ao.label === r)).join(', ')} onChange={(e) => { const custom = e.target.value.split(',').map(s => s.trim()).filter(Boolean); setProfile(prev => ({ ...prev, dietary_restrictions: [...(prev.dietary_restrictions || []).filter(r => ALLERGY_OPTIONS.find(ao => ao.label === r)), ...custom] })) }} />
              </div>
              <div> <Label htmlFor="favorite_cuisines">Favorite Cuisines</Label> <Input id="favorite_cuisines" name="favorite_cuisines" value={profile.favorite_cuisines || ''} onChange={handleChange} placeholder="e.g., Italian, Mexican" /> </div>
              <div> <Label htmlFor="disliked_ingredients">Disliked Ingredients</Label> <Input id="disliked_ingredients" name="disliked_ingredients" value={profile.disliked_ingredients || ''} onChange={handleChange} placeholder="e.g., Cilantro, Olives" /> </div>
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="enable_carbon_tracking" className="flex items-center gap-2"><Sprout className="h-5 w-5 text-green-600" /> Enable Carbon Tracking (EcoPro)</Label>
                <Switch id="enable_carbon_tracking" checked={!!profile.enable_carbon_tracking} onCheckedChange={handleSwitchChange('enable_carbon_tracking')} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><ShieldQuestion /> Lifestyle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <Label htmlFor="sleep_hours">Sleep per night</Label> <Select name="sleep_hours" value={profile.sleep_hours || ''} onValueChange={handleSelectChange('sleep_hours')}> <SelectTrigger id="sleep_hours"><SelectValue placeholder="Select sleep hours" /></SelectTrigger> <SelectContent> <SelectItem value="<5">&lt;5 hours</SelectItem> <SelectItem value="5-6">5-6 hours</SelectItem> <SelectItem value="7-8">7-8 hours</SelectItem> <SelectItem value="8+">8+ hours</SelectItem> </SelectContent> </Select> </div>
              <div> <Label htmlFor="stress_level">Stress Level</Label> <Select name="stress_level" value={profile.stress_level || ''} onValueChange={handleSelectChange('stress_level')}> <SelectTrigger id="stress_level"><SelectValue placeholder="Select stress level" /></SelectTrigger> <SelectContent> <SelectItem value="low">Low</SelectItem> <SelectItem value="moderate">Moderate</SelectItem> <SelectItem value="high">High</SelectItem> </SelectContent> </Select> </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><BellRing /> Reminder Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="mealRemindersEnabledProfile" className="flex items-center gap-2"><Utensils className="h-5 w-5" /> Meal Reminders</Label>
                <Switch id="mealRemindersEnabledProfile" checked={!!profile.reminderSettings?.mealRemindersEnabled} onCheckedChange={handleSwitchChange('reminderSettings.mealRemindersEnabled')} />
              </div>
              {profile.reminderSettings?.mealRemindersEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end p-3 border rounded-md bg-muted/30">
                  <div> <Label htmlFor="breakfastTimeProfile"><Clock3 className="inline mr-1 h-4 w-4" />Breakfast</Label> <Input id="breakfastTimeProfile" name="breakfastTime" type="time" value={profile.reminderSettings?.breakfastTime || '08:00'} onChange={handleReminderChange} /> </div>
                  <div> <Label htmlFor="lunchTimeProfile"><Clock3 className="inline mr-1 h-4 w-4" />Lunch</Label> <Input id="lunchTimeProfile" name="lunchTime" type="time" value={profile.reminderSettings?.lunchTime || '12:30'} onChange={handleReminderChange} /> </div>
                  <div> <Label htmlFor="dinnerTimeProfile"><Clock3 className="inline mr-1 h-4 w-4" />Dinner</Label> <Input id="dinnerTimeProfile" name="dinnerTime" type="time" value={profile.reminderSettings?.dinnerTime || '18:30'} onChange={handleReminderChange} /> </div>
                </div>
              )}
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="waterReminderEnabledProfile" className="flex items-center gap-2"><Droplet className="h-5 w-5 text-blue-500" /> Water Reminder</Label>
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
                <Label htmlFor="snoozeDurationProfile">Notification Snooze Duration</Label>
                <Select name="snoozeDuration" value={profile.reminderSettings?.snoozeDuration?.toString() || '5'} onValueChange={(val) => handleReminderSelectChange('snoozeDuration')(parseInt(val))} disabled>
                  <SelectTrigger id="snoozeDurationProfile" disabled><SelectValue /></SelectTrigger>
                  <SelectContent> <SelectItem value="5">5 minutes</SelectItem> <SelectItem value="10">10 minutes</SelectItem> <SelectItem value="15">15 minutes</SelectItem> </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Snooze feature placeholder. Full notification system coming soon.</p>
              </div>
              <p className="text-xs text-muted-foreground">Note: Actual notification delivery depends on browser/device settings and app capabilities.</p>
            </div>
          </section>
        </CardContent>
        <CardFooter className="flex-col space-y-2 pt-6">
          <Button onClick={handleSubmit} className="w-full text-lg py-6" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Save className="mr-2 h-5 w-5" />}
            Save Profile & Preferences
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={isSaving}> <LogOut className="mr-2 h-5 w-5" /> Log Out </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader> <AlertDialogTitle>Confirm Logout</AlertDialogTitle> <AlertDialogDescription> Are you sure you want to log out of your EcoAI Calorie Tracker account? </AlertDialogDescription> </AlertDialogHeader>
              <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={handleLogout} className={cn(buttonVariants({ variant: 'destructive' }))}> Log Out </AlertDialogAction> </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full mt-2" disabled={isSaving}> <Trash2 className="mr-2 h-5 w-5" /> Delete Account Data (Client-side) </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader> <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle> <AlertDialogDescription> This action cannot be undone. This will permanently delete your profile data from Supabase and sign you out. For full account deletion from the authentication system, you would typically contact support. </AlertDialogDescription> </AlertDialogHeader>
              <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={handleDeleteAccount} className={cn(buttonVariants({ variant: 'destructive' }))}> Yes, Delete My Data </AlertDialogAction> </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
           <Button variant="outline" className="w-full" onClick={() => router.push('/app/settings')} disabled={isSaving}>
              <Cog className="mr-2 h-5 w-5"/> Go to App Settings
            </Button>
        </CardFooter>
      </Card>

      {/* Macro Split Modal */}
      <Dialog open={isMacroModalOpen} onOpenChange={setIsMacroModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Macro Split</DialogTitle>
              <DialogDescription>Adjust your target macronutrient percentages. They must sum to 100%.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="macro-carbs" className="text-right">Carbs (%)</Label>
                <Input id="macro-carbs" type="number" value={tempMacroSplit?.carbs || ''} onChange={(e) => handleMacroSplitChange('carbs', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="macro-protein" className="text-right">Protein (%)</Label>
                <Input id="macro-protein" type="number" value={tempMacroSplit?.protein || ''} onChange={(e) => handleMacroSplitChange('protein', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="macro-fat" className="text-right">Fat (%)</Label>
                <Input id="macro-fat" type="number" value={tempMacroSplit?.fat || ''} onChange={(e) => handleMacroSplitChange('fat', e.target.value)} className="col-span-3" />
              </div>
              <p className="text-sm text-center text-muted-foreground">Total: {(tempMacroSplit?.carbs || 0) + (tempMacroSplit?.protein || 0) + (tempMacroSplit?.fat || 0)}%</p>
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsMacroModalOpen(false)}>Cancel</Button>
              <Button type="button" onClick={saveMacroSplit}>Save Split</Button>
            </ModalFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
