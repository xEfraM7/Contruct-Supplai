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

    const { data: projects, error } = await supabase
      .from('project')
      .select(`
        id,
        name,
        status,
        completion_percentage,
        start_date,
        estimated_end_date,
        actual_end_date,
        estimated_budget,
        actual_cost,
        clients(company_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate expected progress based on timeline
    const projectsWithProgress = projects?.map(project => {
      let expectedProgress = 0;
      
      if (project.start_date && project.estimated_end_date) {
        const start = new Date(project.start_date).getTime();
        const end = new Date(project.estimated_end_date).getTime();
        const now = Date.now();
        
        if (now < start) {
          expectedProgress = 0;
        } else if (now > end) {
          expectedProgress = 100;
        } else {
          const totalDuration = end - start;
          const elapsed = now - start;
          expectedProgress = Math.round((elapsed / totalDuration) * 100);
        }
      }

      const actualProgress = project.completion_percentage || 0;
      const progressVariance = actualProgress - expectedProgress;

      const clientData = project.clients as unknown as { company_name?: string } | null;
      
      return {
        id: project.id,
        name: project.name,
        client: clientData?.company_name || 'N/A',
        status: project.status,
        actualProgress,
        expectedProgress,
        progressVariance,
        isOnTrack: progressVariance >= -10, // Within 10% tolerance
        estimatedBudget: Number(project.estimated_budget) || 0,
        actualCost: Number(project.actual_cost) || 0,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      projects: projectsWithProgress,
    });
  } catch (error) {
    console.error('Error fetching project progress:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener progreso de proyectos' },
      { status: 500 }
    );
  }
}
