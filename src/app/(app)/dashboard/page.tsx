'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSelectedPlan, getAIScanUsage, type UserPlan, type AIScanUsage as AIScanUsageType } from '@/lib/localStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Camera, Leaf, Utensils, ShieldCheck, Zap, Brain, TreePine, BarChartBig, Users, MessageSquareHeart, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [plan, setPlan] = useState<UserPlan>('free');
  const [aiScanUsage, setAiScanUsage] = useState<AIScanUsageType | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const currentPlan = getSelectedPlan();
    setPlan(currentPlan);
    if (currentPlan === 'free') {
      setAiScanUsage(getAIScanUsage());
    }
  }, []);

  if (!isClient) {
    return (
      <div className="space-y-6 p-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  const scansUsedPercentage = aiScanUsage ? (aiScanUsage.count / aiScanUsage.limit) * 100 : 0;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg bg-gradient-to-br from-primary/10 via-background to-background">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Welcome to your EcoAI Dashboard!</CardTitle>
          <CardDescription className="text-lg">
            Your central hub for tracking nutrition and sustainability. Your current plan: <Badge variant={plan === 'free' ? 'secondary' : 'default'} className="capitalize text-sm ml-1">{plan}</Badge>
          </CardDescription>
        </CardHeader>
         <CardFooter>
            <Button onClick={() => router.push('/subscription')} variant="outline">
              Manage Subscription
            </Button>
          </CardFooter>
      </Card>

      {plan === 'free' && (
        <Card className="shadow-md border-l-4 border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-6 w-6" />Free Tier Limitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">You are currently on the Free plan. Upgrade to unlock more features!</p>
            {aiScanUsage && (
              <div>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium">AI Meal Scans Used:</span>
                    <span className="text-sm text-muted-foreground">{aiScanUsage.count} / {aiScanUsage.limit} this month</span>
                </div>
                <Progress value={scansUsedPercentage} aria-label={`${aiScanUsage.count} of ${aiScanUsage.limit} AI scans used`} className="h-2 [&>div]:bg-amber-500" />
                 <p className="text-xs text-muted-foreground mt-1">Results may be watermarked. Scans reset monthly.</p>
              </div>
            )}
            <div className="mt-4 p-4 bg-muted rounded-lg text-center">
              <p className="text-sm font-semibold text-muted-foreground">Advertisement</p>
              <Image src="https://placehold.co/300x100.png" data-ai-hint="advertisement banner" alt="Placeholder Ad" width={300} height={100} className="mx-auto mt-2 rounded shadow"/>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Camera className="text-primary"/> Log Meal</CardTitle>
            <CardDescription>Quickly log your meals, manually or with AI.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/log-meal" passHref legacyBehavior><Button className="w-full">Go to Log Meal</Button></Link>
          </CardFooter>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/> View Stats</CardTitle>
            <CardDescription>Track your progress and nutritional trends.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/stats" passHref legacyBehavior><Button className="w-full">Go to Stats</Button></Link>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Utensils className="text-primary"/> Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          {plan === 'free' && <p className="text-muted-foreground">Access 5 complimentary eco-friendly recipes. <Link href="#" className="text-primary hover:underline">View Recipes</Link></p>}
          {(plan === 'pro' || plan === 'ecopro') && <p className="text-muted-foreground">Access 50+ premium recipes. Filter by diet, sustainability, and more! <Link href="#" className="text-primary hover:underline">Explore Premium Recipes</Link></p>}
        </CardContent>
      </Card>

      {(plan === 'pro' || plan === 'ecopro') && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2"><Zap /> Pro Features Unlocked</h2>
          <Card className="shadow-md border-l-4 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700"><Brain className="h-6 w-6"/>Advanced AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Unlimited AI Meal Scans (via Log Meal page).</li>
                <li>Meal-by-meal carbon footprint tracking (coming soon to meal details).</li>
                <li>Detailed macro & micro-nutrient breakdowns (e.g., iron, vitamin D - view in Stats).</li>
              </ul>
              {(plan === 'pro' || plan === 'ecopro') && <Badge variant="default" className="mt-3"><CheckCircle className="mr-1 h-4 w-4"/> Ad-Free Experience</Badge>}
            </CardContent>
          </Card>
          <Card className="shadow-md border-l-4 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700"><MessageSquareHeart className="h-6 w-6"/>Personalized AI Coach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your AI coach provides:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Weekly goal adjustments (e.g., "Increase protein to 120g/day").</li>
                <li>Meal timing suggestions (e.g., "Eat carbs post-workout").</li>
              </ul>
               <Button variant="outline" className="mt-4" disabled>View Coach Recommendations (Coming Soon)</Button>
            </CardContent>
          </Card>
        </section>
      )}

      {plan === 'ecopro' && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-2"><Trees /> EcoPro Sustainability Hub</h2>
          <Card className="shadow-md border-l-4 border-teal-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700"><BarChartBig className="h-6 w-6" />Carbon Footprint Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Compare your diet's CO2 emissions to regional averages.</li>
                <li>Track your meal-related carbon offsets (e.g., "Your meals = 12kg CO2 → Plant 1 tree to neutralize").</li>
              </ul>
              <Button variant="outline" className="mt-4" disabled>View Full Analytics (Coming Soon)</Button>
            </CardContent>
          </Card>
          <Card className="shadow-md border-l-4 border-lime-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lime-700"><Users className="h-6 w-6"/>Eco-Score Leaderboards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Compete with friends on sustainability scores and earn badges!</p>
              <Button variant="outline" className="mt-4" disabled>View Leaderboards (Coming Soon)</Button>
            </CardContent>
          </Card>
          <Card className="shadow-md border-l-4 border-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700"><Leaf className="h-6 w-6"/>AI-Generated Meal Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Auto-generate weekly meal plans with low-carbon recipes.</li>
                <li>Get grocery lists with local and seasonal ingredient suggestions.</li>
              </ul>
              <Button className="mt-4" disabled>Generate My Eco Meal Plan (Coming Soon)</Button>
            </CardContent>
          </Card>
           <div className="mt-4 p-3 bg-primary/10 rounded-md text-primary flex items-center gap-2">
            <ShieldCheck className="h-5 w-5"/>
            <p className="text-sm">As an EcoPro member, you also get Priority Support!</p>
           </div>
        </section>
      )}
      
      {!isClient && plan === 'free' && !aiScanUsage && (
         <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Loading Usage...</CardTitle></CardHeader>
            <CardContent><div className="h-10 bg-muted animate-pulse rounded-md"></div></CardContent>
        </Card>
      )}

    </div>
  );
}
