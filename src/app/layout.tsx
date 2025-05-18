
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { SplashScreen } from '@/components/layout/SplashScreen'; // Import SplashScreen
import { Suspense } from 'react'; // Import Suspense
import * as React from 'react'; // Import React

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EcoAI Calorie Tracker',
  description: 'Track your calories and nutrition with AI assistance.',
  manifest: "/manifest.json",
  icons: { apple: "/icon.png" },
  themeColor: "#F5F5DC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased font-sans'
        )}
      >
        <Suspense fallback={<SplashScreen onFinished={() => {}} isQuickFallback={true} />}> {/* Provide a quick fallback for Suspense */}
           <SplashScreenWrapper>{children}</SplashScreenWrapper>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}

// Create a client component wrapper for SplashScreen logic
function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = React.useState(true);

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  return <div className="flex flex-col min-h-screen">{children}</div>;
}
