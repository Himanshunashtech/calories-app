
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BarChart2, Settings, Bell, ShieldAlert } from 'lucide-react';
import { getUserProfile, type UserProfile } from '@/lib/localStorage'; // For mock data
import Link from 'next/link';

interface MockUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  joinedDate: string;
}

// Mock data - in a real app, this would come from your backend.
const mockUsers: MockUser[] = [
  { id: '1', name: 'Alice Wonderland', email: 'alice@example.com', plan: 'EcoPro', joinedDate: '2023-10-15' },
  { id: '2', name: 'Bob The Builder', email: 'bob@example.com', plan: 'Pro', joinedDate: '2023-11-01' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', plan: 'Free', joinedDate: '2023-12-20' },
];


export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [recentSignups, setRecentSignups] = useState(0);

  useEffect(() => {
    // Simulate fetching data
    setTotalUsers(mockUsers.length);
    setActiveSubscriptions(mockUsers.filter(u => u.plan !== 'Free').length);
    // Simulate recent signups (e.g., users joined in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setRecentSignups(mockUsers.filter(u => new Date(u.joinedDate) > thirtyDaysAgo).length);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">+ {recentSignups} in the last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Pro & EcoPro plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Engagement (Placeholder)</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">Daily Active Users (Example)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/admin/users" passHref>
            <Button variant="outline" className="w-full">
              <Users className="mr-2 h-4 w-4" /> Manage Users
            </Button>
          </Link>
          <Button variant="outline" className="w-full" disabled>
            <Bell className="mr-2 h-4 w-4" /> Send Notifications (Placeholder)
          </Button>
          <Button variant="outline" className="w-full" disabled>
            <Settings className="mr-2 h-4 w-4" /> App Configuration (Placeholder)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent User Activity (Conceptual)</CardTitle>
          <CardDescription>This section would show recent sign-ups, meal logs, etc. Needs backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>User 'alice@example.com' logged a meal.</li>
            <li>User 'newbie@example.com' just signed up.</li>
            <li>User 'bob@example.com' completed an AI scan.</li>
          </ul>
           <p className="mt-4 text-xs text-center text-gray-500">Full activity tracking requires a backend implementation.</p>
        </CardContent>
      </Card>
       <div className="text-center mt-8">
        <p className="text-sm text-destructive-foreground bg-destructive/80 p-3 rounded-md inline-block">
          <ShieldAlert className="inline mr-2 h-4 w-4" />
          <strong>Security Warning:</strong> This admin panel is for demonstration only.
          Do not use hardcoded credentials or client-side admin flags in a production environment.
        </p>
      </div>
    </div>
  );
}
