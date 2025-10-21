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

    // Obtener proyectos del usuario
    const { data: projects, error } = await supabase
      .from('project')
      .select('*')
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
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, address } = await request.json();
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
        name,
        address,
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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}
