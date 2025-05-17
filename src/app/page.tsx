import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf, Zap, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background text-foreground">
      <header className="mb-12">
        <AppLogo />
      </header>

      <main className="flex flex-col items-center">
        <Image
          src="https://placehold.co/300x200.png"
          alt="Healthy food illustration"
          data-ai-hint="healthy food"
          width={300}
          height={200}
          className="rounded-lg shadow-md mb-8"
        />
        <h1 className="text-4xl font-bold text-primary mb-4">
          Welcome to EcoAI Calorie Tracker
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Effortlessly track your meals and nutrition with the power of AI, wrapped in an eco-conscious design.
        </p>

        <Link href="/log-meal" passHref>
          <Button size="lg" className="mb-10">
            Get Started
            <Leaf className="ml-2 h-5 w-5" />
          </Button>
        </Link>

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
