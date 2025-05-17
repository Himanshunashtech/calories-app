import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import Script from 'next/script'; // Import Script component

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
  manifest: "/manifest.json", // For PWA capabilities
  icons: { apple: "/icon.png" }, // For PWA capabilities
  themeColor: "#F5F5DC", // Light Beige
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head> {/* Added head tag to include scripts */}
        <Script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
          strategy="beforeInteractive" // Load before page becomes interactive
        />
      </head>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased font-sans'
        )}
      >
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
