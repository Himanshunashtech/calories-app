
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

    // Pages that have their own layouts and don't need this AppLayout's protection/UI
    const standalonePages = ['/login', '/signup', '/password-reset', '/onboarding'];

    if (standalonePages.includes(pathname)) {
      // If we're on a page that should have its own layout,
      // and this AppLayout is somehow still active (e.g. during route transition before specific layout takes over),
      // we don't want to do auth checks here or show this layout's loader.
      // The rendering of AppLayout's UI (Header, Nav) is already skipped by the conditional below.
      setIsCheckingAuth(false); // Stop this layout's loading spinner.
      return;
    }

    // If we are on a page that *is* part of the (app) group and needs protection:
    if (!userLoggedIn) {
      router.replace('/login');
    } else if (!onboardingComplete) {
      router.replace('/onboarding');
    } else {
      // User is logged in and onboarding is complete, allow access.
      setIsCheckingAuth(false);
    }
  }, [router, pathname]);

  // Hide layout for auth pages, or pages that have their own distinct layout
  if (pathname === '/login' || pathname === '/signup' || pathname === '/password-reset' || pathname === '/onboarding') {
    return <>{children}</>;
  }

  // If we're not on an auth page, and checks are still happening
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }

  // If not an auth page and auth checks are complete, render the full app layout
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
