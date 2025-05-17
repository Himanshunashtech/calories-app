
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock, ExternalLink, UserPlus } from 'lucide-react';
import { fakeLogin, getUserProfile, saveUserProfile, type UserProfile } from '@/lib/localStorage';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (email && password) {
      let profile = getUserProfile();
      
      if (profile) {
        // Onboarding data exists, associate email and log in
        const updatedProfile: UserProfile = { ...profile, email: email };
        saveUserProfile(updatedProfile);
        fakeLogin(email); // Sets loggedIn flag and ensures profile email is current

        toast({
          title: 'Account Ready!',
          description: 'Welcome to EcoAI Tracker! You are now logged in.',
        });
        router.push('/dashboard');
      } else {
        // This case should be rare if user followed onboarding -> plan -> login
        // Treat as a new user sign-up using this email and password
        // For demo, we'll create a minimal profile. A real app might need a name field here too.
        const newProfile: UserProfile = {
          name: 'New User', // Or derive from email, or have a name field on this page
          email: email,
          age: '', gender: '', height: '', heightUnit: 'cm', weight: '', weightUnit: 'kg',
          activityLevel: '', healthGoals: [], alsoTrackSustainability: false, exerciseFrequency: '', dietaryRestrictions: [],
          dietType: '', favoriteCuisines: '', dislikedIngredients: '', enableCarbonTracking: false,
          sleepHours: '', stressLevel: '', waterGoal: 8, macroSplit: { carbs: 50, protein: 25, fat: 25}, 
          phone: '', profileImageUri: null,
          // Assuming onboarding was skipped, these would be defaults
          reminderSettings: { mealRemindersEnabled: true, breakfastTime: '08:00', lunchTime: '12:30', dinnerTime: '18:30', waterReminderEnabled: false, waterReminderInterval: 60, snoozeDuration: 5 },
          appSettings: { darkModeEnabled: false, unitPreferences: { weight: 'kg', height: 'cm', volume: 'ml' }, hideNonCompliantRecipes: false }
        };
        saveUserProfile(newProfile);
        fakeLogin(email); // This will now use the newly created profile
        localStorage.setItem('onboardingComplete', 'true'); // Since they are "logging in" after plan selection

        toast({
          title: 'Account Created & Logged In!',
          description: 'Welcome to EcoAI Tracker!',
        });
        router.push('/dashboard');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please enter your email and password.',
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader className="text-center">
        <LogIn className="mx-auto h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-2xl font-bold text-primary">Set Up Your Account</CardTitle>
        <CardDescription>Enter your email and a password to access your plan.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
             <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
            </div>
            <div className="text-right">
              <Link href="/password-reset" passHref>
                <Button variant="link" size="sm" className="p-0 h-auto text-xs">Forgot password?</Button>
              </Link>
            </div>
          </div>
          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? 'Setting Up...' : 'Continue to Dashboard'}
          </Button>
        </form>
        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or (for existing users)
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" disabled><ExternalLink className="mr-2 h-4 w-4"/> Google (Placeholder)</Button>
          <Button variant="outline" disabled><ExternalLink className="mr-2 h-4 w-4"/> Apple (Placeholder)</Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>Want to create a separate account?&nbsp;</p>
        <Link href="/signup" passHref>
          <Button variant="link" className="p-0 h-auto"><UserPlus className="mr-1 h-4 w-4"/>Sign Up Separately</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
