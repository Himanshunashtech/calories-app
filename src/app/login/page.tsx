
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock, UserPlus, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/types';
import { setSelectedPlan, getSelectedPlan } from '@/lib/localStorage'; // Keep for plan selection logic

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
    // Optional: Redirect if already logged in
    // const checkSession = async () => {
    //   const { data: { session } } = await supabase.auth.getSession();
    //   if (session) {
    //     const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    //     if (profile && profile.onboarding_complete) {
    //       router.replace('/dashboard');
    //     } else if (profile) {
    //       router.replace('/onboarding');
    //     }
    //   }
    // };
    // checkSession();
  }, [router, searchParams]);

  const handleEmailPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    } else if (data.user) {
      // Fetch profile to check onboarding status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_complete, selected_plan')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found
        toast({ variant: 'destructive', title: 'Error fetching profile', description: profileError.message });
        setIsLoading(false);
        return;
      }
      
      toast({ title: 'Login Successful!', description: `Welcome back!` });

      // Ensure selected_plan from localStorage is synced if not set in profile
      const localPlan = getSelectedPlan();
      if (profileData && profileData.selected_plan !== localPlan) {
        // If local plan exists and profile plan doesn't match or is null, update profile
        await supabase.from('profiles').update({ selected_plan: localPlan }).eq('id', data.user.id);
      }


      if (profileData && profileData.onboarding_complete) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback` // Ensure this callback is configured
      }
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Google Sign-In Failed', description: error.message });
      setIsGoogleLoading(false);
    }
    // On success, Supabase redirects to Google, then back to the callback URL.
    // The callback URL should handle session creation and then redirect based on onboarding status.
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
          <Skeleton className="h-10 w-full mt-4" />
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
        <CardTitle className="text-2xl font-bold text-primary">Log In to Your Account</CardTitle>
        <CardDescription>Welcome back! Access your EcoAI dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-login">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email-login"
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
            <Label htmlFor="password-login">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password-login"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10"
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
          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || isGoogleLoading}>
            {isLoading ? 'Logging In...' : 'Log In'}
          </Button>
        </form>
        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
        </div>
        <Button variant="outline" className="w-full mt-4" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
          <ExternalLink className="mr-2 h-4 w-4" />
          {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
        </Button>
      </CardContent>
      <CardFooter className="justify-center text-sm">
         <p className="text-muted-foreground">Don't have an account?&nbsp;</p>
        <Link href="/signup" passHref>
          <Button variant="link" className="p-0 h-auto">Sign Up</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
