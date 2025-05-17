
import { AppLogo } from '@/components/AppLogo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, User } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Go to homepage">
            <AppLogo />
          </Link>
          {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Link href="/profile" passHref>
            <Button variant="ghost" size="icon" aria-label="User Profile">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/settings" passHref> 
            <Button variant="ghost" size="icon" aria-label="App Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
