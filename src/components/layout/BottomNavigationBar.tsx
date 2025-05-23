
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, BarChart3, Utensils, CalendarDays } from 'lucide-react'; // Removed LayoutDashboard
import { cn } from '@/lib/utils';

const navItems = [
  // { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, // Removed Dashboard
  { href: '/log-meal', label: 'Log Meal', icon: Camera },
  { href: '/recipes', label: 'Recipes', icon: Utensils },
  { href: '/meal-planner', label: 'Planner', icon: CalendarDays },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
];

export function BottomNavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-md items-center justify-around px-1 sm:px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors duration-200 flex-1', 
                isActive ? 'text-primary font-semibold scale-105' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
