
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot } from 'lucide-react';
import { getSelectedPlan, type UserPlan } from '@/lib/localStorage';
import { cn } from '@/lib/utils';

export function ChatFAB() {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    setUserPlan(getSelectedPlan());
  }, []);

  if (!isClient || !userPlan || userPlan !== 'ecopro') {
    return null; // Don't render if not client-side, plan not loaded, or not EcoPro
  }

  const handleChatClick = () => {
    router.push('/chat');
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className={cn(
              "fixed bottom-20 right-4 md:right-6 h-14 w-14 rounded-full shadow-xl z-30", // z-30 to be below modals but above most content
              "bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90",
              "transition-transform hover:scale-110"
            )}
            onClick={handleChatClick}
            aria-label="Chat with AI Coach"
          >
            <Bot className="h-7 w-7 text-primary-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-popover text-popover-foreground border-primary shadow-md">
          <p>I am your AI Coach!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
