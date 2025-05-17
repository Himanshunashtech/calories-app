
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Edit3, Trash2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Import Badge

interface MockUser {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Pro' | 'EcoPro'; // More specific type
  joinedDate: string;
  lastActive?: string; // Optional
  status?: 'Active' | 'Suspended' | 'Banned'; // Optional
}

// Expanded Mock data - in a real app, this would come from your backend.
const mockUsersData: MockUser[] = [
  { id: '1', name: 'Alice Wonderland', email: 'alice@example.com', plan: 'EcoPro', joinedDate: '2023-10-15', lastActive: '2024-05-20', status: 'Active' },
  { id: '2', name: 'Bob The Builder', email: 'bob@example.com', plan: 'Pro', joinedDate: '2023-11-01', lastActive: '2024-05-22', status: 'Active' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', plan: 'Free', joinedDate: '2023-12-20', lastActive: '2024-04-10', status: 'Active' },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', plan: 'Pro', joinedDate: '2024-01-05', lastActive: '2024-05-18', status: 'Suspended' },
  { id: '5', name: 'Edward Scissorhands', email: 'edward@example.com', plan: 'Free', joinedDate: '2024-02-10', lastActive: '2024-03-01', status: 'Active' },
];

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<MockUser[]>(mockUsersData);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewUser = (userId: string) => {
    alert(`Placeholder: View details for user ID: ${userId}. This would typically navigate to a user detail page.`);
  };

  const handleEditUser = (userId: string) => {
    alert(`Placeholder: Edit user ID: ${userId}. This would open an edit modal or page.`);
  };
  
  const handleDeleteUser = (userId: string) => {
    if (confirm(`Are you sure you want to delete user ID: ${userId}? This is a mock action.`)) {
      // Simulate deletion for demo purposes
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      alert(`Mock: User ID: ${userId} deleted. (Client-side only)`);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">User Management</CardTitle>
          <CardDescription>View, search, and manage application users. (Mock Data)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge 
                            variant={user.plan === 'EcoPro' ? 'default' : user.plan === 'Pro' ? 'secondary' : 'outline'}
                            className={user.plan === 'EcoPro' ? 'bg-green-600 text-white' : user.plan === 'Pro' ? 'bg-blue-500 text-white' : ''}
                        >
                            {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.joinedDate}</TableCell>
                       <TableCell>
                        <Badge 
                            variant={user.status === 'Active' ? 'secondary' : 'destructive'}
                            className={user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                        >
                            {user.status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewUser(user.id)} title="View User">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user.id)} title="Edit User">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="text-destructive hover:text-destructive/80" title="Delete User">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No users found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="mt-4 text-xs text-center text-muted-foreground">
            Full user management capabilities (editing, detailed views, status changes) require backend integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

