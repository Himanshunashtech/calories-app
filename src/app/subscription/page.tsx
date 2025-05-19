
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Leaf, Sparkles, Trees, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { setSelectedPlan as saveSelectedPlanToLocal, type UserPlan } from '@/lib/localStorage'; // Using local for now
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    priceSuffix: '/ month',
    icon: Leaf,
    description: 'Start tracking your meals and calories effortlessly.',
    features: [
      'Basic meal logging',
      'Calorie tracking (manual & AI-assisted)',
      'Limited AI analysis (3 scans/month)',
    ],
    cta: 'Continue Free',
    tier: 'free' as UserPlan,
    variant: 'outline' as 'outline' | 'default',
  },
  {
    name: 'Pro',
    price: '$9.99',
    priceSuffix: '/ month',
    icon: Sparkles,
    description: 'Unlock advanced AI insights for optimal results.',
    features: [
      'All Free features, plus:',
      'Unlimited AI meal analysis & logging',
      'Detailed nutritional insights & reports',
      'Advanced macronutrient tracking',
      'Personalized AI-driven tips & recommendations',
    ],
    cta: 'Upgrade to Pro',
    tier: 'pro' as UserPlan,
    variant: 'default' as 'outline' | 'default',
    highlight: true,
  },
  {
    name: 'EcoPro',
    price: '$12.99',
    priceSuffix: '/ month',
    icon: Trees,
    description: 'Maximize your health and minimize your carbon footprint.',
    features: [
      'All Pro features, plus:',
      'Meal carbon footprint estimations',
      'Eco-friendly food suggestions',
      'Track your positive environmental impact',
      'AI-Generated Eco Meal Plans',
    ],
    cta: 'Go EcoPro',
    tier: 'ecopro' as UserPlan,
    variant: 'outline' as 'outline' | 'default',
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ variant: "destructive", title: "Not Authenticated", description: "Please complete onboarding or log in." });
        router.push('/onboarding'); // Or /login if user might have an account
      } else {
        setAuthUser(user);
      }
    };
    fetchUser();
  }, [router, toast]);

  const handleSelectPlan = async (tier: UserPlan, planName: string) => {
    if (!authUser) {
      toast({ variant: "destructive", title: "Authentication Error", description: "User session not found. Please try logging in." });
      router.push('/login');
      return;
    }
    setIsLoading(true);

    // Save selected plan to Supabase profile
    const { error } = await supabase
      .from('profiles')
      .update({ selected_plan: tier, updated_at: new Date().toISOString() })
      .eq('id', authUser.id);

    if (error) {
      toast({ variant: "destructive", title: "Update Failed", description: `Could not save plan choice: ${error.message}` });
      setIsLoading(false);
      return;
    }
    
    // Also save to local for immediate access if needed, though Supabase is source of truth
    saveSelectedPlanToLocal(tier); 

    toast({
      title: 'Plan Selected!',
      description: `You've chosen the ${planName} plan. Welcome to the core app!`,
      action: <Check className="text-green-500" />,
    });
    router.push('/log-meal'); // Redirect to log-meal page
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Choose Your EcoAI Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Unlock powerful features to supercharge your health journey while being mindful of our planet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={cn(
              'flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300',
              plan.highlight ? 'border-primary border-2 ring-2 ring-primary/30 md:scale-105 z-10 bg-card' : 'bg-card'
            )}
          >
            <CardHeader className="items-center text-center pt-8">
              <plan.icon className={cn('h-12 w-12 mb-4', plan.highlight ? 'text-primary' : 'text-accent')} />
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-primary mt-2">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground">{plan.priceSuffix}</span>
              </div>
              <CardDescription className="mt-1 min-h-[60px] px-2 text-sm">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow pt-0">
              <ul className="space-y-2.5 text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-4 w-4 text-green-600 mr-2 shrink-0 mt-1" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto pb-6 px-6">
              <Button
                onClick={() => handleSelectPlan(plan.tier, plan.name)}
                className="w-full text-base py-5"
                variant={plan.highlight ? 'default' : 'outline'}
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin mr-2"/> : plan.cta} 
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-6 space-y-2">
        <p className="text-muted-foreground">All plans are commitment-free. Cancel anytime (conceptual).</p>
        <p className="text-xs text-muted-foreground">Payment processing is a placeholder. No actual charges will be made.</p>
         <Link href="/log-meal" passHref>
          <Button variant="link">Skip for now</Button>
        </Link>
      </div>
    </div>
  );
}
