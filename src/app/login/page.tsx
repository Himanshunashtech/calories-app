
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock, UserPlus, UserCheck } from 'lucide-react';
import { fakeLogin, isUserLoggedIn, isOnboardingComplete, getUserProfile, saveUserProfile, getSelectedPlan, setSelectedPlan, setOnboardingComplete } from '@/lib/localStorage';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This page is now part of the primary onboarding flow
    // If user lands here directly and is fully set up, redirect.
    if (isUserLoggedIn() && isOnboardingComplete()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (email && password) {
      // In this flow, 'fakeLogin' finalizes the account creation process
      // by associating the email with the previously gathered onboarding data.
      fakeLogin(email); // This function now also handles setting onboarding to complete

      toast({
        title: 'Account Finalized!',
        description: 'Welcome to EcoAI Calorie Tracker!',
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Setup Failed',
        description: 'Please enter your email and password.',
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader className="text-center">
        <UserCheck className="mx-auto h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-2xl font-bold text-primary">Set Up Your Account</CardTitle>
        <CardDescription>Finalize your account with an email and password.</CardDescription>
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
          </div>
          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? 'Finalizing...' : 'Complete Account Setup'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>Want to sign up separately?&nbsp;</p>
        <Link href="/signup" passHref>
          <Button variant="link" className="p-0 h-auto"><UserPlus className="mr-1 h-4 w-4"/>Sign Up Separately</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
