'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, ListTodo } from 'lucide-react';
import { useContacts } from '@/lib/hooks/use-contacts';
import { useContactWorkload } from '@/lib/hooks/use-contacts';

interface ContactStatsCardsProps {
  clientId: string;
}

export function ContactStatsCards({ clientId }: ContactStatsCardsProps) {
  const { data: contacts = [] } = useContacts(clientId);
  const { data: workload = [] } = useContactWorkload(clientId);

  const stats = {
    total: contacts.length,
    active: contacts.filter(c => c.status === 'active').length,
    withRole: contacts.filter(c => c.role).length,
    activeTasks: workload.reduce((sum, w) => sum + w.active_tasks, 0),
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">With Assigned Role</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.withRole}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          <ListTodo className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeTasks}</div>
        </CardContent>
      </Card>
    </div>
  );
}
