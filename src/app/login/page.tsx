
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
import { fakeLogin, isOnboardingComplete } from '@/lib/localStorage';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Placeholder for actual authentication
    if (email && password) {
      fakeLogin(email); // Use the fakeLogin
      toast({
        title: 'Login Successful (Demo)',
        description: 'Welcome back to EcoAI Tracker!',
      });
      if (isOnboardingComplete()) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please enter valid credentials (demo).',
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader className="text-center">
        <LogIn className="mx-auto h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-2xl font-bold text-primary">Welcome Back!</CardTitle>
        <CardDescription>Log in to continue your eco-health journey.</CardDescription>
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
            {isLoading ? 'Logging In...' : 'Log In'}
          </Button>
        </form>
        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" disabled><ExternalLink className="mr-2 h-4 w-4"/> Google (Placeholder)</Button>
          <Button variant="outline" disabled><ExternalLink className="mr-2 h-4 w-4"/> Apple (Placeholder)</Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>Don't have an account?&nbsp;</p>
        <Link href="/signup" passHref>
          <Button variant="link" className="p-0 h-auto"><UserPlus className="mr-1 h-4 w-4"/>Sign Up</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
