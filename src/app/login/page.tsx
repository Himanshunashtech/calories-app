
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock, UserPlus, ExternalLink } from 'lucide-react';
import { fakeLogin, isUserLoggedIn, isOnboardingComplete, getUserProfile, saveUserProfile, setSelectedPlan } from '@/lib/localStorage';
import { Skeleton } from '@/components/ui/skeleton';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import type { UserProfile } from '@/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    if (isUserLoggedIn() && isOnboardingComplete()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleEmailPasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (email && password) {
      fakeLogin(email); 

      toast({
        title: 'Account Finalized!',
        description: 'Welcome to EcoAI Calorie Tracker!',
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please enter your email and password.',
      });
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user && user.email) {
        let userProfile = getUserProfile(); 
        
        if (!userProfile || userProfile.email !== user.email) { 
            const googleName = user.displayName || user.email.split('@')[0] || 'User';
            userProfile = {
                ...(userProfile || {}), 
                name: googleName,
                email: user.email,
                profileImageUri: user.photoURL || null,
                age: userProfile?.age || '', 
                gender: userProfile?.gender || '',
                height: userProfile?.height || '',
                heightUnit: userProfile?.heightUnit || 'cm',
                weight: userProfile?.weight || '',
                weightUnit: userProfile?.weightUnit || 'kg',
                activityLevel: userProfile?.activityLevel || '',
                healthGoals: userProfile?.healthGoals || [],
                alsoTrackSustainability: userProfile?.alsoTrackSustainability || false,
                exerciseFrequency: userProfile?.exerciseFrequency || '',
                dietType: userProfile?.dietType || '',
                dietaryRestrictions: userProfile?.dietaryRestrictions || [],
                favoriteCuisines: userProfile?.favoriteCuisines || '',
                dislikedIngredients: userProfile?.dislikedIngredients || '',
                enableCarbonTracking: userProfile?.enableCarbonTracking || false,
                sleepHours: userProfile?.sleepHours || '',
                stressLevel: userProfile?.stressLevel || '',
                waterGoal: userProfile?.waterGoal || 8,
                macroSplit: userProfile?.macroSplit || { carbs: 50, protein: 25, fat: 25 },
                reminderSettings: userProfile?.reminderSettings || { mealRemindersEnabled: true, breakfastTime: '08:00', lunchTime: '12:30', dinnerTime: '18:30', waterReminderEnabled: false, waterReminderInterval: 60, snoozeDuration: 5 },
                appSettings: userProfile?.appSettings || { darkModeEnabled: false, unitPreferences: { weight: 'kg', height: 'cm', volume: 'ml' }, hideNonCompliantRecipes: false },
            } as UserProfile;
        } else { 
             userProfile = {
                ...userProfile,
                name: user.displayName || userProfile.name || 'User',
                profileImageUri: user.photoURL || userProfile.profileImageUri,
            };
        }
        
        saveUserProfile(userProfile);
        fakeLogin(user.email); 

        toast({
          title: 'Signed in with Google!',
          description: `Welcome, ${user.displayName || user.email}!`,
        });
        
        router.push('/dashboard');

      } else {
        throw new Error("Google sign-in did not return user email.");
      }
    } catch (error: any) {
      console.error("Google Sign-In Error: ", error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message || 'An unexpected error occurred. Please ensure pop-ups are allowed and try again.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (!isClient) {
    return (
      <Card className="shadow-2xl w-full max-w-md">
        <CardHeader className="text-center">
          <Skeleton className="h-10 w-10 mx-auto mb-2 rounded-full" />
          <Skeleton className="h-7 w-3/4 mx-auto mb-1" />
          <Skeleton className="h-5 w-1/2 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </CardContent>
        <CardFooter className="justify-center">
          <Skeleton className="h-5 w-3/4" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-2xl">
      <CardHeader className="text-center">
        <LogIn className="mx-auto h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-2xl font-bold text-primary">Set Up Your Account</CardTitle>
        <CardDescription>Finalize your account with an email and password, or sign in with Google.</CardDescription>
      </CardHeader>
      <CardContent>
        {isClient && (
          <>
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
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
              </div>
              <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || isGoogleLoading}>
                {isLoading ? 'Finalizing...' : 'Complete Account Setup'}
              </Button>
            </form>
            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
              <ExternalLink className="mr-2 h-4 w-4"/> 
              {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>Want to sign up with email/password separately?&nbsp;</p>
        <Link href="/signup" passHref>
          <Button variant="link" className="p-0 h-auto"><UserPlus className="mr-1 h-4 w-4"/>Sign Up Separately</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
