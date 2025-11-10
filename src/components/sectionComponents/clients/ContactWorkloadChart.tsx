'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useContactWorkload } from '@/lib/hooks/use-contacts';
import { useContacts } from '@/lib/hooks/use-contacts';
import { Loader2 } from 'lucide-react';

interface ContactWorkloadChartProps {
  clientId: string;
}

export function ContactWorkloadChart({ clientId }: ContactWorkloadChartProps) {
  const { data: workload, isLoading: workloadLoading } = useContactWorkload(clientId);
  const { data: contacts, isLoading: contactsLoading } = useContacts(clientId);

  if (workloadLoading || contactsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData = workload?.map((w: any) => {
    const contact = contacts?.find(c => c.id === w.contact_id);
    return {
      name: contact?.name || 'Unknown',
      utilization: Math.round(w.utilization_rate),
      tasks: w.active_tasks,
      hours: w.total_hours,
    };
  }) || [];

  const getColor = (utilization: number) => {
    if (utilization < 50) return '#10b981'; // green
    if (utilization < 80) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No workload data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Workload Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on 40 hours per week capacity
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} 
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{payload[0].payload.name}</p>
                      <p className="text-sm">Utilization: {payload[0].value}%</p>
                      <p className="text-sm">Active Tasks: {payload[0].payload.tasks}</p>
                      <p className="text-sm">Total Hours: {payload[0].payload.hours}h</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="utilization" radius={[8, 8, 0, 0]}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.utilization)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
            <span className="text-muted-foreground">{'< 50%'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-muted-foreground">50-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-muted-foreground">{'> 80%'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
