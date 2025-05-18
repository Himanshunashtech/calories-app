
'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Lock, ExternalLink, Eye, EyeOff, Loader2 } from 'lucide-react';
import { fakeSignup, isUserLoggedIn, isOnboardingComplete } from '@/lib/localStorage';
import { Skeleton } from '@/components/ui/skeleton';


export default function SignupPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // This page is no longer part of the primary flow, redirect to onboarding.
    // If user is already logged in & onboarded, they should be on dashboard (handled by layout).
    // If logged in but not onboarded, they should be on onboarding (handled by layout).
    // If not logged in, this page should redirect to onboarding directly.
    if (typeof window !== 'undefined') { // ensure this runs client-side
      router.replace('/onboarding');
    }
  }, [router]);


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
     <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Redirecting to onboarding...</p>
    </div>
  );
}
