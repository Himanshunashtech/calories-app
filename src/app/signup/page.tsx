
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Lock, ExternalLink, LogIn } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fakeSignup, isUserLoggedIn, isOnboardingComplete, getUserProfile, saveUserProfile } from '@/lib/localStorage';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import type { UserProfile } from '@/types';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
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

  const checkPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength += 25;
    if (pass.match(/\d/)) strength += 25;
    if (pass.match(/[^a-zA-Z\d]/)) strength += 25;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleEmailPasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Name Required', description: 'Please enter your name.' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    if (passwordStrength < 75) {
         toast({ variant: 'destructive', title: 'Weak Password', description: 'Please choose a stronger password.' });
        return;
    }
    setIsLoading(true);
    
    fakeSignup(email, name); 
    toast({
      title: 'Signup Successful!',
      description: "Welcome! Let's personalize your experience.",
    });
    router.push('/onboarding'); 
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user && user.email) {
        // For Google Sign-Up, we create a new profile or update if one somehow exists (e.g. user backed out)
        const newProfile: UserProfile = {
          name: user.displayName || user.email.split('@')[0] || 'User',
          email: user.email,
          profileImageUri: user.photoURL || null,
          // Initialize other onboarding fields to defaults or empty
          age: '', 
          gender: '',
          height: '',
          weight: '',
          activityLevel: '',
          healthGoals: [],
          dietType: '',
          dietaryRestrictions: [],
          alsoTrackSustainability: false,
          enableCarbonTracking: false,
          exerciseFrequency: '',
          favoriteCuisines: '',
          dislikedIngredients: '',
          sleepHours: '',
          stressLevel: '',
          waterGoal: 8,
          heightUnit: 'cm',
          weightUnit: 'kg',
          macroSplit: { carbs: 50, protein: 25, fat: 25 },
          reminderSettings: { /* default reminders */ 
            mealRemindersEnabled: true, breakfastTime: '08:00', lunchTime: '12:30', dinnerTime: '18:30',
            waterReminderEnabled: false, waterReminderInterval: 60, snoozeDuration: 5,
          },
          appSettings: { /* default app settings */ 
            darkModeEnabled: false, unitPreferences: { weight: 'kg', height: 'cm', volume: 'ml' }, hideNonCompliantRecipes: false,
          },
        };
        
        saveUserProfile(newProfile); // Save this new profile
        fakeSignup(user.email, newProfile.name); // Sets loggedIn = true, onboardingComplete = false

        toast({
          title: 'Signed up with Google!',
          description: `Welcome, ${user.displayName || user.email}! Let's personalize your experience.`,
        });
        router.push('/onboarding'); // Always go to onboarding after Google sign up
      } else {
         throw new Error("Google sign-up did not return user email.");
      }
    } catch (error: any) {
      console.error("Google Sign-Up Error: ", error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-Up Failed',
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
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <Skeleton className="h-12 w-full mt-2" />
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
        <UserPlus className="mx-auto h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-2xl font-bold text-primary">Create Your Account</CardTitle>
        <CardDescription>Join EcoAI and start your sustainable health journey.</CardDescription>
      </CardHeader>
      <CardContent>
        {isClient && (
          <>
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Alex Green"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10"/>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={handlePasswordChange} required className="pl-10"/>
                </div>
                <Progress value={passwordStrength} className="h-1 mt-1 [&>div]:bg-primary" />
                <p className="text-xs text-muted-foreground">Use 8+ characters with a mix of letters, numbers & symbols.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pl-10"/>
                </div>
              </div>
              <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || isGoogleLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up with Email'}
              </Button>
            </form>
            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or sign up with</span></div>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={handleGoogleSignUp} disabled={isLoading || isGoogleLoading}>
                <ExternalLink className="mr-2 h-4 w-4"/> 
                {isGoogleLoading ? 'Signing up...' : 'Sign up with Google'}
            </Button>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>Already have an account?&nbsp;</p>
        <Link href="/login" passHref>
          <Button variant="link" className="p-0 h-auto"><LogIn className="mr-1 h-4 w-4"/>Log In</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
