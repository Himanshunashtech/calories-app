
import { AppLogo } from '@/components/AppLogo';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import '../globals.css'; 

export const metadata: Metadata = {
  title: 'Login - EcoAI Calorie Tracker',
  description: 'Access your EcoAI account.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-background via-primary/5 to-background text-foreground'
      )}
    >
      <header className="mb-8">
        <AppLogo />
      </header>
      <main className="w-full max-w-md"> 
        {children}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} EcoAI Calorie Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}
