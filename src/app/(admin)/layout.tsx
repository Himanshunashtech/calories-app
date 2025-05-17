
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, LogOut, ShieldAlert } from 'lucide-react';
import { fakeLogout, getIsAdmin } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!getIsAdmin()) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the admin panel.',
        variant: 'destructive',
      });
      router.replace('/login');
    }
  }, [router, toast]);

  const handleAdminLogout = () => {
    fakeLogout();
    toast({ title: 'Admin Logged Out' });
    router.push('/login');
  };
  
  if (!getIsAdmin()) {
    // Render nothing or a loader while redirecting
    return null; 
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden md:flex flex-col w-64 border-r bg-background p-4 space-y-4">
        <div className="mb-4">
          <AppLogo />
        </div>
        <nav className="flex-grow space-y-1">
          <Link href="/admin/dashboard" passHref>
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/users" passHref>
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              User Management
            </Button>
          </Link>
        </nav>
        <div className="mt-auto">
          <div className="p-3 mb-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md text-xs">
            <ShieldAlert className="inline h-4 w-4 mr-1" />
            This is a demo admin panel with limited security.
          </div>
          <Button variant="outline" className="w-full" onClick={handleAdminLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Admin Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
