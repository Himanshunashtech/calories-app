
import { AppLogo } from '@/components/AppLogo';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
// Removed Geist and Geist_Mono imports as they are handled by RootLayout
import type { Metadata } from 'next';
import '../globals.css'; // Ensure global styles are applied

export const metadata: Metadata = {
  title: 'Onboarding - EcoAI Calorie Tracker',
  description: 'Set up your personalized health plan.',
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Removed <html> and <body> tags.
    // The main div now takes the necessary styling.
    // Font variables and 'antialiased font-sans' are inherited from RootLayout.
    <div
      className={cn(
        'flex flex-col min-h-screen items-center justify-center p-4 bg-background text-foreground'
        // geistSans.variable, // Handled by RootLayout
        // geistMono.variable,  // Handled by RootLayout
        // 'antialiased font-sans' // Handled by RootLayout
      )}
    >
      <header className="mb-8">
        <AppLogo />
      </header>
      <main className="w-full max-w-2xl">
        {children}
      </main>
      {/* Toaster is already in RootLayout, so it's removed from here to avoid duplication */}
    </div>
  );
}

