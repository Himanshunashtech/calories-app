
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Lock, ExternalLink, LogIn } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { fakeSignup } from '@/lib/localStorage';


export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    if (passwordStrength < 75) {
         toast({ variant: 'destructive', title: 'Weak Password', description: 'Please choose a stronger password.' });
        return;
    }
    setIsLoading(true);
    
    // Placeholder for actual signup
    fakeSignup(email, name); // Use fakeSignup
    toast({
      title: 'Signup Successful (Demo)',
      description: 'Welcome to EcoAI Tracker! Please complete your profile.',
    });
    router.push('/onboarding'); // Redirect to onboarding after signup
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader className="text-center">
        <UserPlus className="mx-auto h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-2xl font-bold text-primary">Create Your Account</CardTitle>
        <CardDescription>Join EcoAI and start your sustainable health journey.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
         <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or sign up with</span></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" disabled><ExternalLink className="mr-2 h-4 w-4"/> Google (Placeholder)</Button>
          <Button variant="outline" disabled><ExternalLink className="mr-2 h-4 w-4"/> Apple (Placeholder)</Button>
        </div>
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
