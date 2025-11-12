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

    const risks: Array<{
      id: string;
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      description: string;
      projectId?: string;
      projectName?: string;
      value?: number;
    }> = [];

    // Get projects
    const { data: projects } = await supabase
      .from('project')
      .select('*')
      .eq('user_id', user.id);

    // Get tasks
    const { data: tasks } = await supabase
      .from('contact_tasks')
      .select(`
        *,
        project:project(name)
      `)
      .eq('user_id', user.id);

    const today = new Date();

    // Check for budget overruns
    projects?.forEach(project => {
      const budget = Number(project.estimated_budget) || 0;
      const actual = Number(project.actual_cost) || 0;
      
      if (budget > 0 && actual > budget) {
        const overrun = actual - budget;
        const percentage = ((overrun / budget) * 100).toFixed(1);
        
        risks.push({
          id: `budget-${project.id}`,
          type: 'budget_overrun',
          severity: overrun > budget * 0.2 ? 'critical' : overrun > budget * 0.1 ? 'high' : 'medium',
          title: `Budget Overrun: ${project.name}`,
          description: `Project is $${overrun.toLocaleString()} (${percentage}%) over budget`,
          projectId: project.id,
          projectName: project.name,
          value: overrun,
        });
      }
    });

    // Check for overdue projects
    projects?.forEach(project => {
      if (project.status === 'active' && project.estimated_end_date) {
        const endDate = new Date(project.estimated_end_date);
        if (endDate < today) {
          const daysOverdue = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
          
          risks.push({
            id: `overdue-project-${project.id}`,
            type: 'overdue_project',
            severity: daysOverdue > 30 ? 'critical' : daysOverdue > 14 ? 'high' : 'medium',
            title: `Overdue Project: ${project.name}`,
            description: `Project is ${daysOverdue} days past estimated completion date`,
            projectId: project.id,
            projectName: project.name,
            value: daysOverdue,
          });
        }
      }
    });

    // Check for overdue tasks
    const overdueTasks = tasks?.filter(task => {
      if (task.status === 'completed' || !task.due_date) return false;
      return new Date(task.due_date) < today;
    }) || [];

    if (overdueTasks.length > 0) {
      // Group by project
      const tasksByProject = new Map<string, typeof overdueTasks>();
      overdueTasks.forEach(task => {
        const projectId = task.project_id || 'unassigned';
        if (!tasksByProject.has(projectId)) {
          tasksByProject.set(projectId, []);
        }
        tasksByProject.get(projectId)!.push(task);
      });

      tasksByProject.forEach((projectTasks, projectId) => {
        const projectName = projectTasks[0]?.project?.name || 'Unassigned';
        const count = projectTasks.length;
        
        risks.push({
          id: `overdue-tasks-${projectId}`,
          type: 'overdue_tasks',
          severity: count > 10 ? 'critical' : count > 5 ? 'high' : 'medium',
          title: `${count} Overdue Task${count > 1 ? 's' : ''}`,
          description: `${projectName} has ${count} overdue task${count > 1 ? 's' : ''}`,
          projectId: projectId !== 'unassigned' ? projectId : undefined,
          projectName,
          value: count,
        });
      });
    }

    // Check for projects with low completion but near deadline
    projects?.forEach(project => {
      if (project.status === 'active' && project.estimated_end_date) {
        const endDate = new Date(project.estimated_end_date);
        const daysUntilDeadline = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const completion = project.completion_percentage || 0;
        
        if (daysUntilDeadline > 0 && daysUntilDeadline <= 30 && completion < 70) {
          risks.push({
            id: `at-risk-${project.id}`,
            type: 'at_risk',
            severity: completion < 50 ? 'high' : 'medium',
            title: `At Risk: ${project.name}`,
            description: `Only ${completion}% complete with ${daysUntilDeadline} days until deadline`,
            projectId: project.id,
            projectName: project.name,
            value: 100 - completion,
          });
        }
      }
    });

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Count by severity
    const riskCounts = {
      critical: risks.filter(r => r.severity === 'critical').length,
      high: risks.filter(r => r.severity === 'high').length,
      medium: risks.filter(r => r.severity === 'medium').length,
      low: risks.filter(r => r.severity === 'low').length,
      total: risks.length,
    };

    return NextResponse.json({
      success: true,
      risks,
      counts: riskCounts,
    });
  } catch (error) {
    console.error('Error fetching risks:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener riesgos' },
      { status: 500 }
    );
  }
}
