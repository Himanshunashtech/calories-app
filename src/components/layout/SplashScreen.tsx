
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onFinished?: () => void; // Make onFinished optional
  isQuickFallback?: boolean;
}

const motivationalQuotes = [
  "The journey of a thousand miles begins with a single step.",
  "Believe you can and you're halfway there.",
  "Your health is an investment, not an expense.",
  "Small changes can make a big difference.",
  "Nourish to flourish.",
  "Be stronger than your excuses.",
  "Healthy is an outfit that looks different on everybody.",
];

export function SplashScreen({ onFinished, isQuickFallback = false }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    if (isQuickFallback) {
      return;
    }

    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          if (onFinished) { // Only call onFinished if it's provided
            onFinished();
          }
          return 100;
        }
        return prevProgress + 20;
      });
    }, 400);

    return () => clearInterval(timer);
  }, [onFinished, isQuickFallback]);

  if (isQuickFallback) {
    return (
      <div className="splash-screen-fallback">
        <Leaf className="h-16 w-16 text-primary animate-ping" />
      </div>
    );
  }

  return (
    <div className="splash-screen">
      <div className="splash-image-container">
        <Image
          src="https://placehold.co/1200x800.png?text=EcoAI+Splash"
          alt="EcoAI Calorie Tracker Loading"
          fill // Changed from layout="fill" to fill for Next 13+
          style={{ objectFit: "cover" }} // Used style for objectFit with fill
          priority
          data-ai-hint="salad healthy food"
        />
        <div className="splash-overlay"></div>
      </div>
      <div className="splash-content">
        <div className="flex items-center gap-3 mb-6 text-primary-foreground">
          <Leaf className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">EcoAI Tracker</h1>
        </div>
        <p className="text-xl italic text-primary-foreground/90 mb-8 max-w-md text-center">
          &ldquo;{quote || 'Loading your healthy journey...'}&rdquo;
        </p>
        <div className="w-full max-w-sm">
          <Progress value={progress} className="h-3 bg-primary/30 [&>div]:bg-primary" />
          <p className="text-sm text-primary-foreground/80 mt-2 text-center">Loading... {progress}%</p>
        </div>
      </div>
    </div>
  );
}
