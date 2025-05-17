
import { AppLogo } from '@/components/AppLogo';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import '../globals.css'; // Ensure global styles are applied

export const metadata: Metadata = {
  title: 'Choose Your Plan - EcoAI Calorie Tracker',
  description: 'Select a subscription plan that fits your needs.',
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 bg-background text-foreground'
      )}
    >
      <header className="mb-8">
        <AppLogo />
      </header>
      <main className="w-full max-w-5xl"> {/* Increased max-width for plans */}
        {children}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} EcoAI Calorie Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}
