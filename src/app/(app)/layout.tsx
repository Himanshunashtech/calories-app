
'use client'; // Required for useEffect and useRouter

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import { ChatFAB } from '@/components/layout/ChatFAB';
import { isUserLoggedIn, isOnboardingComplete } from '@/lib/localStorage';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const userLoggedIn = isUserLoggedIn();
    const onboardingComplete = isOnboardingComplete();

    if (!userLoggedIn && pathname !== '/login' && pathname !== '/signup' && pathname !== '/password-reset') {
      router.replace('/login');
    } else if (userLoggedIn && !onboardingComplete && pathname !== '/onboarding') {
      router.replace('/onboarding');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router, pathname]);

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }
  
  // Hide layout for auth pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/password-reset' || pathname === '/onboarding') {
    return <>{children}</>;
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
