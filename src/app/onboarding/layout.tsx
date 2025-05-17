
import { AppLogo } from '@/components/AppLogo';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import '../globals.css'; // Ensure global styles are applied

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
    <html lang="en">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased font-sans bg-background text-foreground'
        )}
      >
        <div className="flex flex-col min-h-screen items-center justify-center p-4">
          <header className="mb-8">
            <AppLogo />
          </header>
          <main className="w-full max-w-2xl">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
