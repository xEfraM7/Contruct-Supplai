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

    // Get all projects with related data
    const { data: projects, error: projectsError } = await supabase
      .from('project')
      .select(`
        *,
        clients(company_name),
        project_manager:contacts!project_manager_id(name)
      `)
      .eq('user_id', user.id);

    if (projectsError) throw projectsError;

    // Get all tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('contact_tasks')
      .select('*')
      .eq('user_id', user.id);

    if (tasksError) throw tasksError;

    // Calculate metrics
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
    const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
    
    const totalBudget = projects?.reduce((sum, p) => sum + (Number(p.estimated_budget) || 0), 0) || 0;
    const totalActualCost = projects?.reduce((sum, p) => sum + (Number(p.actual_cost) || 0), 0) || 0;
    const budgetVariance = totalBudget - totalActualCost;
    
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
    
    // Calculate overdue tasks
    const today = new Date();
    const overdueTasks = tasks?.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < today;
    }).length || 0;

    // Calculate projects over budget
    const projectsOverBudget = projects?.filter(p => {
      const budget = Number(p.estimated_budget) || 0;
      const actual = Number(p.actual_cost) || 0;
      return actual > budget && budget > 0;
    }).length || 0;

    // Calculate average completion percentage
    const avgCompletion = projects && projects.length > 0
      ? projects.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / projects.length
      : 0;

    // Calculate on-time delivery rate
    const projectsWithDates = projects?.filter(p => p.estimated_end_date) || [];
    const onTimeProjects = projectsWithDates.filter(p => {
      if (p.status !== 'completed' || !p.actual_end_date) return false;
      return new Date(p.actual_end_date) <= new Date(p.estimated_end_date);
    }).length;
    const onTimeRate = projectsWithDates.length > 0 
      ? (onTimeProjects / projectsWithDates.length) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          overBudget: projectsOverBudget,
          avgCompletion: Math.round(avgCompletion),
        },
        budget: {
          total: totalBudget,
          actualCost: totalActualCost,
          variance: budgetVariance,
          utilizationRate: totalBudget > 0 ? (totalActualCost / totalBudget) * 100 : 0,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          overdue: overdueTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        timeline: {
          onTimeRate: Math.round(onTimeRate),
          projectsWithDates: projectsWithDates.length,
          onTimeProjects,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener analytics' },
      { status: 500 }
    );
  }
}
