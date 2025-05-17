
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Edit2, Trash2, Search, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock user data - in a real app, this would come from a backend
const mockUsers = [
  { id: '1', name: 'Alice Wonderland', email: 'alice@example.com', plan: 'EcoPro', joinDate: '2023-01-15', status: 'Active' },
  { id: '2', name: 'Bob The Builder', email: 'bob@example.com', plan: 'Pro', joinDate: '2023-02-20', status: 'Active' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', plan: 'Free', joinDate: '2023-03-10', status: 'Active' },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', plan: 'EcoPro', joinDate: '2023-04-05', status: 'Suspended' },
  { id: '5', name: 'Edward Scissorhands', email: 'edward@example.com', plan: 'Free', joinDate: '2023-05-01', status: 'Active' },
];

export default function AdminUserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return mockUsers;
    return mockUsers.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleViewUser = (userId: string) => alert(`View User (ID: ${userId}) - Placeholder`);
  const handleEditUser = (userId: string) => alert(`Edit User (ID: ${userId}) - Placeholder`);
  const handleDeleteUser = (userId: string) => alert(`Delete User (ID: ${userId}) - Placeholder. Ensure proper confirmation and data handling in a real app.`);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">User Management</CardTitle>
          <CardDescription>View, edit, and manage user accounts.</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="p-4 mb-4 bg-destructive/10 border-l-4 border-destructive text-destructive-foreground rounded-md">
        <ShieldAlert className="inline h-5 w-5 mr-2" />
        <span className="font-semibold">Security Warning:</span> User data management is a sensitive operation. The functionality here is for demonstration only. Real implementation requires secure backend APIs and authorization.
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Join Date</TableHead>
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
                      <Badge variant={user.plan === 'Free' ? 'outline' : user.plan === 'Pro' ? 'secondary' : 'default'}>
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                       <Badge variant={user.status === 'Active' ? 'default' : 'destructive'} className={user.status === 'Active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {user.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewUser(user.id)} aria-label="View user">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(user.id)} aria-label="Edit user">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="text-destructive hover:text-destructive/80" aria-label="Delete user">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
