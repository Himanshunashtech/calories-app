
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageSquare, Search, BookOpen, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const faqItems = [
  {
    question: 'How does the AI meal scanning work?',
    answer: 'Simply take a photo of your meal using the "Log Meal" feature. Our AI (powered by Gemini) will analyze it to estimate calories, macronutrients, and even some micronutrients. For best results, ensure good lighting and a clear view of all food items. Free users have a limit on AI scans per month.',
  },
  {
    question: 'Is my data private and secure?',
    answer: 'Yes, we take your privacy seriously. Your data is stored locally on your device by default. AI analysis is processed securely. Please review our Privacy Policy for full details (link in App Settings - placeholder).',
  },
  {
    question: 'How is the Eco-Score calculated?',
    answer: 'The Eco-Score is a conceptual rating (A-F) based on the general environmental impact of common food ingredients. Plant-based foods typically score higher (A or B), while items like red meat might score lower. This feature aims to raise awareness and is an estimation, primarily available for EcoPro users.',
  },
  {
    question: 'How do I manage my subscription?',
    answer: 'You can manage your subscription by going to App Settings > Manage Subscription, or by tapping the Settings icon in the main header and selecting "Subscription".',
  },
  {
    question: 'How can I reset my AI scan limit (Free Tier)?',
    answer: 'The AI scan limit for the Free Tier (currently 3 scans) automatically resets at the beginning of each calendar month.',
  },
  {
    question: 'How do Reminders work?',
    answer: 'You can set reminders for meals and water intake in your Profile settings. Actual notification delivery depends on your browser and device settings allowing notifications for this app. We are working to enhance this feature for PWAs.',
  },
  {
    question: 'What is Carbon Footprint Tracking?',
    answer: 'EcoPro users can see an estimated carbon footprint for meals logged via AI scan. This helps you understand the environmental impact of your food choices. You can also see comparisons to regional averages on your dashboard.',
  },
];

export default function HelpCenterPage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleContactSupport = () => {
    toast({
        title: "Live Chat Coming Soon!",
        description: "Our support team will be available via live chat in a future update. For now, please check the FAQs."
    });
  }

  const handlePlaceholderLink = (featureName: string) => {
    toast({
      title: "Coming Soon!",
      description: `${featureName} will be available in a future update.`
    });
  }

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading Help Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl md:text-3xl font-bold text-primary">Help Center</CardTitle>
          <CardDescription>Find answers to common questions and get support.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search help articles..." className="pl-8 w-full" disabled />
            <p className="text-xs text-muted-foreground mt-1 text-center">Full search coming soon.</p>
          </div>

          <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground flex items-center gap-2"><BookOpen/> Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border-b last:border-b-0">
                  <AccordionTrigger className="text-left hover:no-underline py-3 text-base">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-1 pb-3">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck/> Privacy Policy</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">Understand how we handle your data.</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => handlePlaceholderLink('Privacy Policy')}>Read Policy</Button>
                </CardContent>
            </Card>
            <Card className="bg-muted/30">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Sparkles/> Feature Guide</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">Learn more about EcoTrack's features.</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => handlePlaceholderLink('Feature Guide')}>Explore Features</Button>
                </CardContent>
            </Card>
          </div>

          <section className="text-center pt-6 border-t">
            <h3 className="text-xl font-semibold mb-3 text-foreground">Still Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to assist you. EcoPro members get priority support.
            </p>
            <Button size="lg" onClick={handleContactSupport}>
              <MessageSquare className="mr-2 h-5 w-5" /> Contact Support
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

    