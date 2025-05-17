
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
import { getUserProfile, saveUserProfile, type UserProfile, type ReminderSettings } from '@/lib/localStorage';
import { UserCircle2, Mail, Phone, Weight, Ruler, Activity, ShieldQuestion, Leaf, Save, UploadCloud, BellRing, Clock3, Repeat } from 'lucide-react';

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
  exerciseFrequency: '',
  dietaryRestrictions: '',
  dietType: '',
  sleepHours: '',
  stressLevel: '',
  email: '',
  phone: '',
  profileImageUri: null,
  reminderSettings: {
    breakfastTime: '08:00',
    lunchTime: '12:30',
    dinnerTime: '18:30',
    waterReminderEnabled: false,
    waterReminderInterval: 60,
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
      setProfile(loadedProfile);
    } else {
      setProfile(defaultProfile);
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
        ...prev.reminderSettings!,
        [name]: value,
      },
    }));
  };

  const handleReminderToggle = (name: keyof ReminderSettings) => (checked: boolean) => {
     setProfile((prev) => ({
      ...prev,
      reminderSettings: {
        ...prev.reminderSettings!,
        [name]: checked,
      },
    }));
  };
  
  const handleReminderSelectChange = (name: keyof ReminderSettings) => (value: string) => {
     setProfile((prev) => ({
      ...prev,
      reminderSettings: {
        ...prev.reminderSettings!,
        [name]: Number(value),
      },
    }));
  };


  const handleSelectChange = (name: keyof UserProfile | `reminderSettings.${keyof ReminderSettings}`) => (value: string) => {
    if (name.startsWith('reminderSettings.')) {
      const key = name.split('.')[1] as keyof ReminderSettings;
       setProfile((prev) => ({
        ...prev,
        reminderSettings: {
          ...prev.reminderSettings!,
          [key]: value,
        },
      }));
    } else {
      setProfile((prev) => ({ ...prev, [name as keyof UserProfile]: value as any }));
    }
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

  if (!isClient || isLoading) {
    return (
      <div className="space-y-6 p-4">
        {[...Array(4)].map((_, i) => (
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
              <div className="h-10 bg-muted rounded animate-pulse"></div>
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
              <div> <Label htmlFor="height">Height ({profile.heightUnit})</Label> <Input id="height" name="height" type="number" value={profile.height} onChange={handleChange} placeholder={`Height in ${profile.heightUnit}`} /> </div>
              <div> <Label htmlFor="weight">Weight ({profile.weightUnit})</Label> <Input id="weight" name="weight" type="number" value={profile.weight} onChange={handleChange} placeholder={`Weight in ${profile.weightUnit}`} /> </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><Activity /> Goals & Activity</h3>
             <div className="space-y-4">
                <div> <Label>Primary Health Goals</Label> <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50 min-h-[40px]"> {profile.healthGoals && profile.healthGoals.length > 0 ? profile.healthGoals.join(', ') : 'Not set'} </p> </div>
                 <div> <Label htmlFor="activityLevel">Activity Level</Label> <Select name="activityLevel" value={profile.activityLevel} onValueChange={handleSelectChange('activityLevel')}> <SelectTrigger id="activityLevel"><SelectValue placeholder="Select activity level" /></SelectTrigger> <SelectContent> <SelectItem value="sedentary">Sedentary</SelectItem> <SelectItem value="light">Lightly Active</SelectItem> <SelectItem value="moderate">Moderately Active</SelectItem> <SelectItem value="very">Very Active</SelectItem> </SelectContent> </Select> </div>
                <div> <Label htmlFor="exerciseFrequency">Exercise Frequency</Label> <Select name="exerciseFrequency" value={profile.exerciseFrequency} onValueChange={handleSelectChange('exerciseFrequency')}> <SelectTrigger id="exerciseFrequency"><SelectValue placeholder="Select frequency" /></SelectTrigger> <SelectContent> <SelectItem value="0">0 days/week</SelectItem> <SelectItem value="1-2">1-2 days/week</SelectItem> <SelectItem value="3-4">3-4 days/week</SelectItem> <SelectItem value="5+">5+ days/week</SelectItem> </SelectContent> </Select> </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><Leaf /> Dietary Habits</h3>
            <div className="space-y-4">
              <div> <Label htmlFor="dietaryRestrictions">Dietary Restrictions/Allergies</Label> <Textarea id="dietaryRestrictions" name="dietaryRestrictions" value={profile.dietaryRestrictions} onChange={handleChange} placeholder="e.g., Gluten-free, nut allergy" /> </div>
              <div> <Label htmlFor="dietType">Diet Type</Label> <Select name="dietType" value={profile.dietType} onValueChange={handleSelectChange('dietType')}> <SelectTrigger id="dietType"><SelectValue placeholder="Select diet type" /></SelectTrigger> <SelectContent> <SelectItem value="none">None</SelectItem> <SelectItem value="vegetarian">Vegetarian</SelectItem> <SelectItem value="vegan">Vegan</SelectItem> <SelectItem value="keto">Keto</SelectItem> <SelectItem value="paleo">Paleo</SelectItem> <SelectItem value="pescatarian">Pescatarian</SelectItem> <SelectItem value="other">Other</SelectItem> </SelectContent> </Select> </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><BellRing /> Reminder Settings</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div> <Label htmlFor="breakfastTime"><Clock3 className="inline mr-1 h-4 w-4"/>Breakfast Time</Label> <Input id="breakfastTime" name="breakfastTime" type="time" value={profile.reminderSettings?.breakfastTime || '08:00'} onChange={handleReminderChange} /> </div>
                <div> <Label htmlFor="lunchTime"><Clock3 className="inline mr-1 h-4 w-4"/>Lunch Time</Label> <Input id="lunchTime" name="lunchTime" type="time" value={profile.reminderSettings?.lunchTime || '12:30'} onChange={handleReminderChange} /> </div>
                <div> <Label htmlFor="dinnerTime"><Clock3 className="inline mr-1 h-4 w-4"/>Dinner Time</Label> <Input id="dinnerTime" name="dinnerTime" type="time" value={profile.reminderSettings?.dinnerTime || '18:30'} onChange={handleReminderChange} /> </div>
              </div>
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="waterReminderEnabled" className="flex items-center gap-2"><Repeat className="h-5 w-5"/> Water Reminder</Label>
                <Switch id="waterReminderEnabled" checked={profile.reminderSettings?.waterReminderEnabled} onCheckedChange={handleReminderToggle('waterReminderEnabled')} />
              </div>
              {profile.reminderSettings?.waterReminderEnabled && (
                <div>
                  <Label htmlFor="waterReminderInterval">Water Reminder Interval (minutes)</Label>
                  <Select value={profile.reminderSettings?.waterReminderInterval?.toString() || '60'} onValueChange={handleReminderSelectChange('waterReminderInterval')}>
                    <SelectTrigger id="waterReminderInterval"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes (1 hour)</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes (2 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Note: Actual notification delivery depends on browser/device settings and app capabilities.</p>
            </div>
          </section>


           <section>
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-3 text-primary"><ShieldQuestion /> Lifestyle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div> <Label htmlFor="sleepHours">Sleep per night</Label> <Select name="sleepHours" value={profile.sleepHours} onValueChange={handleSelectChange('sleepHours')}> <SelectTrigger id="sleepHours"><SelectValue placeholder="Select sleep hours" /></SelectTrigger> <SelectContent> <SelectItem value="<5">&lt;5 hours</SelectItem> <SelectItem value="5-6">5-6 hours</SelectItem> <SelectItem value="7-8">7-8 hours</SelectItem> <SelectItem value="8+">8+ hours</SelectItem> </SelectContent> </Select> </div>
                <div> <Label htmlFor="stressLevel">Stress Level</Label> <Select name="stressLevel" value={profile.stressLevel} onValueChange={handleSelectChange('stressLevel')}> <SelectTrigger id="stressLevel"><SelectValue placeholder="Select stress level" /></SelectTrigger> <SelectContent> <SelectItem value="low">Low</SelectItem> <SelectItem value="moderate">Moderate</SelectItem> <SelectItem value="high">High</SelectItem> </SelectContent> </Select> </div>
            </div>
          </section>

        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} className="w-full text-lg py-6">
            <Save className="mr-2 h-5 w-5" />
            Save Profile & Preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
