
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const faqItems = [
  {
    question: 'How does the AI meal scanning work?',
    answer: 'Simply take a photo of your meal, and our AI (powered by Gemini) will analyze it to estimate calories, macronutrients, and even some micronutrients. For best results, ensure good lighting and a clear view of all food items.',
  },
  {
    question: 'Is my data private and secure?',
    answer: 'Yes, we take your privacy seriously. Your data is stored locally on your device by default. AI analysis is processed securely. Please review our Privacy Policy for full details (link in App Settings).',
  },
  {
    question: 'How is the Eco-Score calculated?',
    answer: 'The Eco-Score is a conceptual rating based on the general environmental impact of common food ingredients. Plant-based foods typically score higher (A or B), while items like red meat might score lower. This feature aims to raise awareness and is an estimation.',
  },
  {
    question: 'How do I manage my subscription?',
    answer: 'You can manage your subscription by going to App Settings > Manage Subscription, or by tapping the Settings icon in the main header and selecting "Subscription".',
  },
  {
    question: 'How can I reset my AI scan limit (Free Tier)?',
    answer: 'The AI scan limit for the Free Tier (currently 3 scans) automatically resets at the beginning of each calendar month.',
  },
];

export default function HelpCenterPage() {
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
          </div>

          <section>
            <h3 className="text-xl font-semibold mb-3 text-foreground">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-left hover:no-underline">{item.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="text-center">
            <h3 className="text-xl font-semibold mb-3 text-foreground">Still Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to assist you. EcoPro members get priority support.
            </p>
            <Button size="lg" disabled>
              <MessageSquare className="mr-2 h-5 w-5" /> Contact Support (Live Chat Placeholder)
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
