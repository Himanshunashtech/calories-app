
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock, UserPlus, ExternalLink, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { fakeLogin, getUserProfile, saveUserProfile, setOnboardingComplete, isUserLoggedIn, isOnboardingComplete } from '@/lib/localStorage';
import { Skeleton } from '@/components/ui/skeleton';


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
    if (isUserLoggedIn() && isOnboardingComplete()) {
      router.replace('/dashboard');
    }
  }, [router, searchParams]);

  const handleEmailPasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login with localStorage
    const profile = fakeLogin(email); // This will set user as logged in

    // This is now the final step of onboarding/signup if coming from that flow
    if (!profile.onboarding_complete) {
        profile.onboarding_complete = true;
        setOnboardingComplete(true); // Set the flag
        saveUserProfile(profile); // Save the profile with onboarding complete
    }


    toast({ title: 'Login Successful!', description: `Welcome back, ${profile.name || 'User'}!` });
    router.push('/dashboard');

    setIsLoading(false);
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
        <CardDescription>Enter your email and password to finalize your account.</CardDescription>
      </CardHeader>
      <CardContent>
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
            {isLoading ? 'Finalizing...' : 'Complete Account Setup'}
          </Button>
        </form>
      </CardContent>
       <CardFooter className="justify-center text-sm">
         <Link href="/" passHref>
          <Button variant="link" className="p-0 h-auto"><ArrowLeft className="mr-1 h-4 w-4"/>Back to Home</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
