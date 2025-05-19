
'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import { ChatFAB } from '@/components/layout/ChatFAB';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { UserProfile } from '@/types';
import { getSupabaseUserProfile } from '@/lib/supabaseClient'; // Import helper


interface AuthContextType {
  user: any | null; // Supabase user object
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any | null>(null); // Supabase user
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const fetchAndSetUserProfile = async (currentAuthUser: any) => {
    if (currentAuthUser) {
      const userProfile = await getSupabaseUserProfile(currentAuthUser.id);
      setProfile(userProfile);
      return userProfile;
    }
    setProfile(null);
    return null;
  };
  
  const refreshUserProfile = async () => {
    if (user) {
        await fetchAndSetUserProfile(user);
    }
  };


  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        const currentAuthUser = session?.user || null;
        setUser(currentAuthUser);

        if (currentAuthUser) {
          const userProfile = await fetchAndSetUserProfile(currentAuthUser);
          
          const publicPages = ['/login', '/signup', '/password-reset', '/', '/onboarding', '/subscription'];
          const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/auth/callback');

          if (userProfile) {
            if (!userProfile.onboarding_complete && pathname !== '/onboarding' && pathname !== '/subscription') {
              router.replace('/onboarding');
            } else if (userProfile.onboarding_complete && (pathname === '/onboarding' || pathname === '/login' || pathname === '/signup')) {
              router.replace('/log-meal'); // Default to log-meal after full setup
            } else if (!isPublicPage && !userProfile.onboarding_complete){
                router.replace('/onboarding'); // If trying to access app page without onboarding
            }
          } else if (!isPublicPage) { // No profile yet, likely new signup or error
            router.replace('/onboarding'); // Guide to onboarding
          }
        } else { // No session, user is logged out
          setProfile(null);
          const protectedPages = !(['/login', '/signup', '/password-reset', '/'].includes(pathname) || pathname.startsWith('/auth/callback'));
          if (protectedPages) {
            router.replace('/login');
          }
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, [pathname, router]);


  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/password-reset';
  const isOnboardingPage = pathname === '/onboarding';
  const isSubscriptionPage = pathname === '/subscription';
  const isLandingPage = pathname === '/';

  if (isAuthPage || isOnboardingPage || isSubscriptionPage || isLandingPage) {
     if (isLoading && (isAuthPage || isOnboardingPage || isSubscriptionPage)) { // Show loader for these initial pages
        return (
         <div className="flex flex-col min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
         </div>
        );
    }
    return <AuthContext.Provider value={{ user, profile, isLoading, refreshProfile: refreshUserProfile }}>{children}</AuthContext.Provider>;
  }


  if (isLoading || !user) { // Keep loading if session/profile check is ongoing or no user for protected area
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }
  
  // If user exists but profile is still loading (rare, but possible race condition)
  // or if onboarding isn't complete and we are past public page checks.
  if (!profile && !isLoading && user && !isLandingPage && !isAuthPage && !isSubscriptionPage && pathname !== '/onboarding') {
     router.replace('/onboarding'); // Fallback to ensure onboarding if profile somehow missing
     return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Preparing your profile...</p>
        </div>
        );
  }


  return (
    <AuthContext.Provider value={{ user, profile, isLoading, refreshProfile: refreshUserProfile }}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto max-w-2xl px-4 py-8 pb-24">
          {children}
        </main>
        <ChatFAB />
        <BottomNavigationBar />
      </div>
    </AuthContext.Provider>
  );
}
