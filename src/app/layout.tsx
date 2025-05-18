
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { Suspense } from 'react';
import * as React from 'react';
// SplashScreenWrapper is imported from its own client component file
import { SplashScreenWrapper } from '@/components/layout/SplashScreenWrapper';


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
          geistSans.variable,
          geistMono.variable,
          'antialiased font-sans'
        )}
      >
        <Suspense fallback={<SplashScreen onFinished={() => {}} isQuickFallback={true} />}>
           <SplashScreenWrapper>{children}</SplashScreenWrapper>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
