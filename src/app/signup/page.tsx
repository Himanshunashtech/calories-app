
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { saveLocalOnboardingData } from '@/lib/localStorage';
import type { UserProfile } from '@/types';
import { FcGoogle } from 'react-icons/fc';
import { Skeleton } from '@/components/ui/skeleton';


export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    // Redirect if already logged in (Supabase session check will happen in layout)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', session.user.id)
          .single();
        if (profile?.onboarding_complete) {
          router.replace('/log-meal');
        } else {
          router.replace('/onboarding');
        }
      }
    };
    checkSession();
  }, [router]);

  const handleEmailPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Name Required", description: "Please enter your name." });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match", description: "Please re-enter your password." });
      return;
    }
    setIsLoading(true);

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { // This data is passed to the handle_new_user trigger
          full_name: name,
          // You can add more metadata here if your trigger handles it
        }
      }
    });

    if (error) {
      toast({ variant: "destructive", title: "Signup Failed", description: error.message });
      setIsLoading(false);
      return;
    }

    if (signUpData.user) {
      // Save initial data for onboarding pre-fill if needed.
      // The handle_new_user trigger in Supabase should create the profile row.
      const initialOnboardingData: Partial<UserProfile> = { name, email };
      saveLocalOnboardingData(initialOnboardingData);

      toast({ title: 'Account Created!', description: "Let's personalize your experience.", action: <CheckCircle className="text-green-500"/> });
      router.push('/onboarding'); // Redirect to onboarding
    } else if (signUpData.session) {
      // This case might happen if email confirmation is disabled and user is auto-logged in
      // Or if user already existed but was unconfirmed, and now confirms.
      toast({ title: 'Welcome!', description: "Let's personalize your experience." });
      router.push('/onboarding');
    } else {
      // This case implies email confirmation is required
       toast({ title: 'Confirmation Email Sent', description: 'Please check your email to confirm your account before proceeding to onboarding.' });
       // Optionally, redirect to a page that says "Check your email"
    }
    setIsLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // Ensure this matches your Supabase settings
      },
    });
    if (error) {
      toast({ variant: "destructive", title: "Google Sign-Up Failed", description: error.message });
      setIsLoading(false);
    }
    // Supabase handles redirection. onAuthStateChange in layout will manage next steps.
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
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
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
        <CardDescription>Join EcoAI and start your health journey today.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name-signup">Full Name</Label>
            <Input
              id="name-signup"
              type="text"
              placeholder="Alex Green"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signup">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email-signup"
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
            <Label htmlFor="password-signup">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password-signup"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10"
                autoComplete="new-password"
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex space-x-1 mt-1">
              <div className={`h-1 flex-1 rounded-full ${password.length >= 1 ? (password.length < 6 ? 'bg-red-500' : password.length < 10 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-muted'}`}></div>
              <div className={`h-1 flex-1 rounded-full ${password.length >= 6 ? (password.length < 10 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-muted'}`}></div>
              <div className={`h-1 flex-1 rounded-full ${password.length >= 10 ? 'bg-green-500' : 'bg-muted'}`}></div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword-signup">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword-signup"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pl-10 pr-10"
                autoComplete="new-password"
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Sign Up with Email'}
          </Button>
        </form>
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
        <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2"/> : <FcGoogle className="mr-2 h-5 w-5"/>}
          Sign Up with Google
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center text-sm space-y-2">
        <div className="flex items-center">
            <p>Already have an account?</p>
            <Link href="/login" passHref>
                <Button variant="link" className="p-1 h-auto">Log In</Button>
            </Link>
        </div>
        <Link href="/" passHref>
            <Button variant="link" className="p-0 h-auto"><ArrowLeft className="mr-1 h-4 w-4"/>Back to Home</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
