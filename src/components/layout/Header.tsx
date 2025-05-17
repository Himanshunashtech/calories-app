import { AppLogo } from '@/components/AppLogo';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Go to homepage">
          <AppLogo />
        </Link>
        {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
        {/* Placeholder for potential user menu or settings */}
      </div>
    </header>
  );
}
