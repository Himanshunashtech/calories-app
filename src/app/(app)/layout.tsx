
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import { ChatFAB } from '@/components/layout/ChatFAB';
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/types'; // Assuming UserProfile type is defined

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
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'Session:', session);
        if (event === 'SIGNED_OUT') {
          // If already on a public page, no need to redirect from here
          // Auth pages themselves will handle redirect if user is logged out.
          // Only redirect if on a protected page.
          if (!pathname.startsWith('/login') && !pathname.startsWith('/signup') && !pathname.startsWith('/password-reset') && pathname !== '/') {
            router.replace('/login');
          }
          setIsLoading(false);
          setSessionChecked(true);
          return;
        }
        
        if (session?.user) {
          // User is signed in
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: no rows found, handled below
            console.error('Error fetching profile for layout:', error);
            // Potentially redirect to an error page or show a toast
          }
          
          if (profile && profile.onboarding_complete) {
             // Allow access to app pages
          } else {
            // Onboarding not complete or profile doesn't exist yet
            // (trigger should create profile, but this is a fallback)
            if (pathname !== '/onboarding' && pathname !== '/subscription') { // Allow access to onboarding and subscription
              router.replace('/onboarding');
            }
          }
        } else {
          // No session, user is not logged in
          const publicPages = ['/login', '/signup', '/password-reset', '/']; // Add landing page
          if (!publicPages.includes(pathname) && !pathname.startsWith('/auth/callback')) { // Allow callback route
            router.replace('/login');
          }
        }
        setIsLoading(false);
        setSessionChecked(true);
      }
    );
    
    // Initial check for session
     const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !pathname.startsWith('/login') && !pathname.startsWith('/signup') && !pathname.startsWith('/password-reset') && pathname !== '/' && !pathname.startsWith('/auth/callback')) {
        router.replace('/login');
      } else if (session) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .single();
          if (profile && !profile.onboarding_complete && pathname !== '/onboarding' && pathname !== '/subscription') {
             router.replace('/onboarding');
          }
      }
      setIsLoading(false);
      setSessionChecked(true);
    };

    if (!sessionChecked) {
      checkInitialSession();
    }


    return () => {
      authListener?.unsubscribe();
    };
  }, [pathname, router, sessionChecked]);

  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/password-reset';
  const isOnboardingPage = pathname === '/onboarding';
  const isSubscriptionPage = pathname === '/subscription';
  const isLandingPage = pathname === '/';


  // If on specific standalone pages, render children directly without AppLayout UI
  if (isAuthPage || isOnboardingPage || isSubscriptionPage || isLandingPage) {
    // If loading and not yet checked, show minimal loader
    if (isLoading && !sessionChecked && (isOnboardingPage || isSubscriptionPage)) {
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
