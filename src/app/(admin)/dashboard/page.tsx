
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BarChart2, ShieldAlert, Settings, Bell } from 'lucide-react';
import Link from 'next/link';

// Mock data for admin dashboard
const mockAdminStats = {
  totalUsers: 1250,
  activeSubscriptions: {
    pro: 350,
    ecopro: 150,
  },
  recentSignups: 25, // Last 7 days
  mealLogsToday: 870,
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Admin Dashboard</CardTitle>
          <CardDescription>Overview of the EcoAI Calorie Tracker application.</CardDescription>
        </CardHeader>
      </Card>

      <div className="p-4 mb-4 bg-destructive/10 border-l-4 border-destructive text-destructive-foreground rounded-md">
        <ShieldAlert className="inline h-5 w-5 mr-2" />
        <span className="font-semibold">Security Warning:</span> This admin panel is for demonstration purposes only and has limited security. Do not use in a production environment with real user data without implementing robust backend authentication and authorization.
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAdminStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{mockAdminStats.recentSignups} from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pro Subscriptions</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAdminStats.activeSubscriptions.pro.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EcoPro Subscriptions</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAdminStats.activeSubscriptions.ecopro.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meal Logs Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAdminStats.mealLogsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total entries for today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            <Link href="/admin/users" passHref>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" /> Manage Users
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Bell className="mr-2 h-4 w-4" /> Send Global Notification (Coming Soon)
            </Button>
             <Button variant="outline" className="w-full justify-start" disabled>
              <Settings className="mr-2 h-4 w-4" /> App Configuration (Coming Soon)
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent User Activity (Conceptual)</CardTitle>
            <CardDescription>Placeholder for recent signups, logs, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>User 'john.doe@example.com' signed up.</li>
              <li>User 'jane.smith@example.com' logged 5 meals.</li>
              <li>New 'Pro' subscription started by 'user123@example.com'.</li>
              <li>Meal "Salad" (ID: xyz) flagged for review (Placeholder).</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
