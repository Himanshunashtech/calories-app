
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Lock, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { saveLocalOnboardingData, defaultUserProfileData } from '@/lib/localStorage';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/types';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    // Optional: Redirect if already logged in by Supabase session
    // const checkSession = async () => {
    //   const { data: { session } } = await supabase.auth.getSession();
    //   if (session) {
    //     router.replace('/dashboard');
    //   }
    // };
    // checkSession();
  }, [router]);

  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 8) score++;
    if (pass.match(/[a-z]/)) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^A-Za-z0-9]/)) score++;
    setPasswordStrength(score);
  };

  const handlePasswordChange = (e: FormEvent<HTMLInputElement>) => {
    const newPassword = e.currentTarget.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleEmailPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match', description: 'Please re-enter your passwords.' });
      return;
    }
    if (passwordStrength < 3) {
      toast({ variant: 'destructive', title: 'Weak Password', description: 'Password should be stronger. Include uppercase, lowercase, numbers, and symbols for better security.' });
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: name, // This will be available in raw_user_meta_data for the trigger
        }
      }
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Signup Failed', description: error.message });
    } else if (data.user) {
      // The trigger `handle_new_user` in Supabase should create a profile row.
      // We save initial onboarding data (name, email) locally to pre-fill onboarding.
      const initialOnboardingData: UserProfile = {
        ...defaultUserProfileData,
        email: data.user.email,
        name: name,
        onboarding_complete: false, // Explicitly set to false
      };
      saveLocalOnboardingData(initialOnboardingData);

      toast({ title: 'Signup Successful!', description: data.session ? 'You are now signed up. Please complete your profile.' : 'Please check your email to verify your account, then complete your profile.' });
      router.push('/onboarding'); // Always go to onboarding after signup
    }
    setIsLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback` // Ensure this callback is configured in Supabase
      }
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Google Sign-Up Failed', description: error.message });
      setIsGoogleLoading(false);
    }
    // On success, Supabase redirects to Google, then back to the callback URL.
    // The callback URL should handle session creation and then redirect to onboarding.
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
        <UserPlus className="mx-auto h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-2xl font-bold text-primary">Create Your EcoAI Account</CardTitle>
        <CardDescription>Join us on a journey to healthier eating and a greener planet.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" type="text" placeholder="Alex Green" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signup">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email-signup" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signup">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password-signup" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={handlePasswordChange} required className="pl-10 pr-10" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {password && (
              <div className="flex items-center gap-2 text-xs mt-1">
                <span>Strength:</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      passwordStrength <= 1 ? 'bg-red-500' : passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pl-10 pr-10" />
               <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || isGoogleLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up with Email'}
          </Button>
        </form>
        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
        </div>
        <Button variant="outline" className="w-full mt-4" onClick={handleGoogleSignUp} disabled={isLoading || isGoogleLoading}>
          <ExternalLink className="mr-2 h-4 w-4" /> {/* Using ExternalLink as a generic icon for Google */}
          {isGoogleLoading ? 'Redirecting...' : 'Sign Up with Google'}
        </Button>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p className="text-muted-foreground">Already have an account?&nbsp;</p>
        <Link href="/login" passHref>
          <Button variant="link" className="p-0 h-auto">Log In</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
