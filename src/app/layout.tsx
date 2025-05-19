
import type { Metadata, Viewport } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import * as React from 'react';
// SplashScreenWrapper is imported from its own client component file
import { SplashScreenWrapper } from '@/components/layout/SplashScreenWrapper';
import { SplashScreen } from '@/components/layout/SplashScreen';


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Standard Tailwind variable for sans-serif
});

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono', // Standard Tailwind variable for monospace
});

export const metadata: Metadata = {
  title: 'EcoAI Calorie Tracker',
  description: 'Track your calories and nutrition with AI assistance.',
  manifest: "/manifest.json",
  icons: { apple: "/icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#F5F5DC", // Matched to light beige background
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
          inter.variable,
          roboto_mono.variable,
          'antialiased font-sans' // This will now use --font-sans (Inter)
        )}
      >
        {/* The Suspense fallback now only passes isQuickFallback */}
        <Suspense fallback={<SplashScreen onFinished={() => {}} isQuickFallback={true} />}>
           <SplashScreenWrapper>{children}</SplashScreenWrapper>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
