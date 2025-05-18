
"use client"; // Must be the very first line

import React, { useState, useEffect } from 'react';
import { SplashScreen } from '@/components/layout/SplashScreen';

export function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Simulate loading or initial setup
    const timer = setTimeout(() => {
      if (isMounted) { // Check if still mounted
        setShowSplash(false);
      }
    }, 2500); // Duration of the splash screen

    return () => {
      clearTimeout(timer);
    };
  }, [isMounted]);


  if (!isMounted || showSplash) {
    // Pass onFinished to the actual SplashScreen component
    // It will call this when its internal logic (e.g., animation) completes.
    // For this wrapper, we primarily use a timeout.
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  return <>{children}</>;
}
