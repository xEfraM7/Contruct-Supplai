import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Get all tasks with contact information
    const { data: tasks, error: tasksError } = await supabase
      .from('contact_tasks')
      .select(`
        *,
        contact:contacts(id, name, role, hourly_rate)
      `)
      .eq('user_id', user.id);

    if (tasksError) throw tasksError;

    // Group tasks by contact
    const contactMap = new Map();

    tasks?.forEach(task => {
      if (!task.contact) return;

      const contactId = task.contact.id;
      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          id: contactId,
          name: task.contact.name,
          role: task.contact.role || 'N/A',
          hourlyRate: Number(task.contact.hourly_rate) || 0,
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          estimatedHours: 0,
          actualHours: 0,
          overdueTasks: 0,
        });
      }

      const contact = contactMap.get(contactId);
      contact.totalTasks++;
      
      if (task.status === 'completed') contact.completedTasks++;
      if (task.status === 'pending') contact.pendingTasks++;
      if (task.status === 'in_progress') contact.inProgressTasks++;
      
      contact.estimatedHours += Number(task.estimated_hours) || 0;
      contact.actualHours += Number(task.actual_hours) || 0;

      // Check if overdue
      if (task.due_date && task.status !== 'completed') {
        const dueDate = new Date(task.due_date);
        if (dueDate < new Date()) {
          contact.overdueTasks++;
        }
      }
    });

    // Convert map to array and calculate metrics
    const teamMetrics = Array.from(contactMap.values()).map(contact => ({
      ...contact,
      completionRate: contact.totalTasks > 0 
        ? Math.round((contact.completedTasks / contact.totalTasks) * 100) 
        : 0,
      efficiency: contact.estimatedHours > 0 && contact.actualHours > 0
        ? Math.round((contact.estimatedHours / contact.actualHours) * 100)
        : 0,
      totalCost: contact.actualHours * contact.hourlyRate,
    }));

    // Sort by completion rate
    teamMetrics.sort((a, b) => b.completionRate - a.completionRate);

    // Calculate overall team stats
    const totalTeamHours = teamMetrics.reduce((sum, m) => sum + m.actualHours, 0);
    const totalTeamCost = teamMetrics.reduce((sum, m) => sum + m.totalCost, 0);
    const avgCompletionRate = teamMetrics.length > 0
      ? teamMetrics.reduce((sum, m) => sum + m.completionRate, 0) / teamMetrics.length
      : 0;

    return NextResponse.json({
      success: true,
      teamMetrics,
      summary: {
        totalMembers: teamMetrics.length,
        totalHours: Math.round(totalTeamHours * 10) / 10,
        totalCost: Math.round(totalTeamCost * 100) / 100,
        avgCompletionRate: Math.round(avgCompletionRate),
      },
    });
  } catch (error) {
    console.error('Error fetching team productivity:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener productividad del equipo' },
      { status: 500 }
    );
  }
}
