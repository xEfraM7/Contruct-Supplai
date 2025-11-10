import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all contacts for this client
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .eq('client_id', clientId)
      .eq('user_id', user.id);

    if (contactsError) throw contactsError;

    const contactIds = contacts.map(c => c.id);

    if (contactIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get task statistics for each contact
    const { data: tasks, error: tasksError } = await supabase
      .from('contact_tasks')
      .select('contact_id, status, estimated_hours, actual_hours')
      .in('contact_id', contactIds);

    if (tasksError) throw tasksError;

    // Calculate workload summary
    const workloadMap = new Map();

    tasks.forEach(task => {
      if (!workloadMap.has(task.contact_id)) {
        workloadMap.set(task.contact_id, {
          contact_id: task.contact_id,
          total_tasks: 0,
          active_tasks: 0,
          completed_tasks: 0,
          total_hours: 0,
          utilization_rate: 0,
        });
      }

      const summary = workloadMap.get(task.contact_id);
      summary.total_tasks++;

      if (task.status === 'in_progress' || task.status === 'pending') {
        summary.active_tasks++;
      }

      if (task.status === 'completed') {
        summary.completed_tasks++;
      }

      summary.total_hours += task.actual_hours || task.estimated_hours || 0;
    });

    // Calculate utilization rate (assuming 40 hours per week)
    workloadMap.forEach(summary => {
      const weeklyCapacity = 40;
      summary.utilization_rate = Math.min(
        (summary.total_hours / weeklyCapacity) * 100,
        100
      );
    });

    const workloadSummary = Array.from(workloadMap.values());

    return NextResponse.json(workloadSummary);
  } catch (error) {
    console.error('Error fetching workload summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workload summary' },
      { status: 500 }
    );
  }
}
