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

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener proyectos del usuario con datos relacionados
    const { data: projects, error } = await supabase
      .from('project')
      .select(`
        *,
        clients(id, company_name, company_email, company_phone),
        project_manager:contacts!project_manager_id(id, name, email, role)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        description: p.description,
        
        // Client data (new)
        client_id: p.client_id,
        client: p.clients,
        
        // Project Manager (new)
        project_manager_id: p.project_manager_id,
        project_manager: p.project_manager,
        
        // Legacy fields (for backward compatibility)
        clientName: p.client_name || p.clients?.company_name,
        clientPhone: p.client_phone || p.clients?.company_phone,
        clientEmail: p.client_email || p.clients?.company_email,
        
        // Dates
        startDate: p.start_date,
        estimatedEndDate: p.estimated_end_date,
        actualEndDate: p.actual_end_date,
        
        // Budget
        estimatedBudget: p.estimated_budget,
        actual_cost: p.actual_cost,
        
        // Progress
        status: p.status,
        completionPercentage: p.completion_percentage,
        
        // Timestamps
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Crear proyecto
    const { data: project, error } = await supabase
      .from('project')
      .insert({
        name: body.name,
        address: body.address,
        description: body.description || null,
        client_id: body.client_id || null,
        project_manager_id: body.project_manager_id || null,
        start_date: body.start_date || null,
        estimated_end_date: body.estimated_end_date || null,
        estimated_budget: body.estimated_budget || null,
        status: body.status || 'active',
        completion_percentage: 0,
        actual_cost: 0,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        address: project.address,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}
