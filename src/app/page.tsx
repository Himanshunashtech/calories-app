
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf, Zap, BarChart3, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background text-foreground">
      <header className="mb-12">
        <AppLogo />
      </header>

      <main className="flex flex-col items-center">
        <div className="w-full max-w-md h-auto mb-8 rounded-lg overflow-hidden shadow-xl">
          <Image
            src="https://placehold.co/600x400.png"
            alt="EcoAI Calorie Tracker App Hero Image"
            width={600}
            height={400}
            className="object-cover"
            data-ai-hint="healthy food app"
            priority
          />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-4">
          Welcome to EcoAI Calorie Tracker
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Effortlessly track your meals and nutrition with the power of AI, wrapped in an eco-conscious design.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <Link href="/onboarding" passHref>
            <Button size="lg" className="w-full sm:w-auto text-lg py-6 px-8">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-accent" />}
            title="AI Food Scan"
            description="Snap a photo, and let our AI estimate calories and nutrition instantly."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8 text-accent" />}
            title="Stats Overview"
            description="Monitor your daily intake, macros, and dietary trends with clear visuals."
          />
           <FeatureCard
            icon={<Leaf className="h-8 w-8 text-accent" />}
            title="Eco-Friendly"
            description="Designed with nature in mind, promoting health and environmental awareness."
          />
        </div>
      </main>

      <footer className="mt-16 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} EcoAI Calorie Tracker. Eat well, live green.</p>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm flex flex-col items-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-primary mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
