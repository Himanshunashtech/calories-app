
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import { ChatFAB } from '@/components/layout/ChatFAB';
import { Loader2 } from 'lucide-react';
import { isUserLoggedIn, isOnboardingComplete, getUserProfile } from '@/lib/localStorage';
import type { UserProfile } from '@/types';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const loggedIn = isUserLoggedIn();
    const onboardingDone = isOnboardingComplete();

    const publicPages = ['/login', '/signup', '/password-reset', '/'];
    const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/auth/callback'); // Assuming /auth/callback for potential future OAuth

    if (loggedIn) {
      if (!onboardingDone && pathname !== '/onboarding' && pathname !== '/subscription') {
        router.replace('/onboarding');
      } else if (onboardingDone && (pathname === '/onboarding' || pathname === '/login' || pathname === '/signup')) {
        router.replace('/dashboard');
      }
    } else {
      if (!isPublicPage) {
        router.replace('/login');
      }
    }
    setIsLoading(false);
    setSessionChecked(true);
  }, [pathname, router]);


  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/password-reset';
  const isOnboardingPage = pathname === '/onboarding';
  const isSubscriptionPage = pathname === '/subscription';
  const isLandingPage = pathname === '/';

  if (isAuthPage || isOnboardingPage || isSubscriptionPage || isLandingPage) {
    if (isLoading && !sessionChecked && (isOnboardingPage || isSubscriptionPage || isAuthPage)) {
        return (
         <div className="flex flex-col min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
         </div>
        );
    }
    return <>{children}</>;
  }

  if (isLoading || !sessionChecked) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto max-w-2xl px-4 py-8 pb-24">
        {children}
      </main>
      <ChatFAB />
      <BottomNavigationBar />
    </div>
  );
}
