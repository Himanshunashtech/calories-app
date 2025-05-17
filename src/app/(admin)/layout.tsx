
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { getIsAdmin, fakeLogout, setIsAdmin } from '@/lib/localStorage';
import { Shield, LayoutDashboard, Users, LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const adminStatus = getIsAdmin();
    if (!adminStatus) {
      router.replace('/login');
    } else {
      setIsAuthorized(true);
    }
    setIsLoading(false);
  }, [router]);

  const handleAdminLogout = () => {
    setIsAdmin(false); // Clear admin flag first
    fakeLogout();     // Then perform general logout
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-muted/50">
        <LayoutDashboard className="h-12 w-12 animate-pulse text-primary mb-4" />
        <p className="text-muted-foreground">Loading Admin Panel...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    // This state should ideally not be reached if redirect works, but as a fallback.
    return (
         <div className="flex flex-col min-h-screen items-center justify-center bg-muted/50">
            <Shield className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive font-semibold">Access Denied</p>
            <Link href="/login" passHref>
                <Button variant="link" className="mt-2">Go to Login</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="w-64 bg-background border-r p-4 space-y-6 flex flex-col">
        <div className="flex items-center justify-center border-b pb-4">
            <AppLogo /> <span className="ml-2 font-semibold text-sm">Admin</span>
        </div>
        <nav className="flex-grow space-y-2">
          <Link href="/admin/dashboard" passHref>
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <Link href="/admin/users" passHref>
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" /> User Management
            </Button>
          </Link>
          {/* Add more admin navigation links here */}
        </nav>
        <Button variant="outline" className="w-full mt-auto" onClick={handleAdminLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Log Out
        </Button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
