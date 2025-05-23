
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { setSelectedPlan, getSelectedPlan as getLocalSelectedPlan, saveLocalOnboardingData, clearAllLocalUserData } from '@/lib/localStorage'; // For plan management pre-profile sync
import { FcGoogle } from 'react-icons/fc';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/types';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }

    // Check if user is already logged in and fully onboarded
    const checkSessionAndRedirect = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('onboarding_complete, selected_plan')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                if (profile.onboarding_complete) {
                    router.replace('/log-meal');
                } else {
                    // If session exists but onboarding not complete, means they dropped off.
                    saveLocalOnboardingData({ email: session.user.email, name: session.user.user_metadata?.full_name });
                    router.replace('/onboarding');
                }
            } else if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error("Error fetching profile for redirection:", error.message);
                 // If profile fetch fails but session exists, maybe go to onboarding as a fallback
                saveLocalOnboardingData({ email: session.user.email, name: session.user.user_metadata?.full_name });
                router.replace('/onboarding');
            } else if (!profile) { // No profile means new user or incomplete signup
                 saveLocalOnboardingData({ email: session.user.email, name: session.user.user_metadata?.full_name });
                 router.replace('/onboarding');
            }
        }
    };
    checkSessionAndRedirect();
  }, [router, searchParams]);


  const syncLocalPlanToProfile = async (userId: string) => {
    const localPlan = getLocalSelectedPlan();
    if (localPlan && localPlan !== 'free') { 
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('selected_plan')
            .eq('id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') { 
            console.error("Error fetching profile before plan sync:", profileError.message);
            return;
        }
        
        if (!profileData || profileData.selected_plan !== localPlan) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ selected_plan: localPlan, updated_at: new Date().toISOString() })
                .eq('id', userId);
            if (updateError) {
                console.error("Error syncing selected plan to profile:", updateError.message);
            } else {
                console.log("Synced local plan to Supabase profile:", localPlan);
            }
        }
    }
  };


  const handleEmailPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both email and password.",
      });
      return;
    }
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
      setIsLoading(false);
      return;
    }

    if (data.user) {
      await syncLocalPlanToProfile(data.user.id); 
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_complete, name')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { 
        toast({ variant: "destructive", title: "Profile Error", description: "Could not fetch your profile data." });
        setIsLoading(false);
        return;
      }
      
      clearAllLocalUserData(); // Clear temporary local data after successful login & profile fetch
      toast({ title: 'Logged In Successfully!', description: `Welcome back, ${profile?.name || data.user.email}!`, action: <CheckCircle className="text-green-500"/> });

      // Ensure onboarding_complete is true for this specific user flow finalization step
      // This is where the "Setup Account" implicitly completes onboarding
      if (!profile?.onboarding_complete) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
          .eq('id', data.user.id);
        if (updateError) {
          console.error("Error marking onboarding complete:", updateError.message);
          // Proceed to log-meal anyway, as login was successful
        }
      }
      router.push('/log-meal');
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
      setIsLoading(false);
    }
    // Supabase handles redirection. onAuthStateChange in layout will manage next steps.
    // Plan syncing for Google OAuth happens in the AppLayout's onAuthStateChange.
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
        <CardDescription>Finalize your account setup or log in if you have an existing account.</CardDescription>
      </CardHeader>
      <CardContent>
        {isClient ? (
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
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-right">
                <Link href="/password-reset" passHref>
                  <Button variant="link" className="p-0 h-auto text-xs">Forgot Password?</Button>
                </Link>
              </div>
            </div>
            <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2"/> : 'Complete Account Setup'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2"/> : <FcGoogle className="mr-2 h-5 w-5"/>}
          Continue with Google
        </Button>
      </CardContent>
       <CardFooter className="flex flex-col items-center text-sm space-y-2">
         <Link href="/" passHref>
          <Button variant="link" className="p-0 h-auto"><ArrowLeft className="mr-1 h-4 w-4"/>Back to Home</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
