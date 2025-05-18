
"use client";

import React, { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/layout/SplashScreen';

export function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isClientRendered, setIsClientRendered] = useState(false);

  useEffect(() => {
    // This effect runs once after the component mounts on the client
    setIsClientRendered(true);
  }, []);

  const handleSplashFinished = () => {
    // Defer the state update to ensure it happens after the current render/effect cycle
    setTimeout(() => {
      // Check if the component is still considered "client rendered" / mounted
      // This is a good check though in this specific flow, 
      // if handleSplashFinished is called, isClientRendered should be true.
      if (isClientRendered) { 
        setShowSplash(false);
      }
    }, 0);
  };

  if (!isClientRendered) {
    // During SSR or initial client render before useEffect runs,
    // render nothing or a very minimal static placeholder.
    // The Suspense fallback in RootLayout will provide the initial visual.
    return null; 
  }

  if (showSplash) {
    // Pass the callback to SplashScreen.
    // Also ensure isQuickFallback is false so the full splash screen animation runs.
    return <SplashScreen onFinished={handleSplashFinished} isQuickFallback={false} />;
  }

  return <>{children}</>;
}
