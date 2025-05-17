
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Placeholder for actual password reset logic
    if (email) {
      setTimeout(() => {
        toast({
          title: 'Password Reset Email Sent (Demo)',
          description: `If an account exists for ${email}, you will receive reset instructions.`,
        });
        setIsLoading(false);
        router.push('/login');
      }, 1500);
    } else {
      toast({
        variant: 'destructive',
        title: 'Missing Email',
        description: 'Please enter your email address.',
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl">
      <CardHeader className="text-center">
        <KeyRound className="mx-auto h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-2xl font-bold text-primary">Reset Your Password</CardTitle>
        <CardDescription>Enter your email to receive a password reset link.</CardDescription>
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
           <p className="text-xs text-muted-foreground">
            Use a strong, unique password. We recommend 12+ characters including uppercase, lowercase, numbers, and symbols.
          </p>
          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? 'Sending Link...' : 'Send Reset Link'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm">
         <Link href="/login" passHref>
          <Button variant="link" className="p-0 h-auto"><ArrowLeft className="mr-1 h-4 w-4"/>Back to Log In</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
