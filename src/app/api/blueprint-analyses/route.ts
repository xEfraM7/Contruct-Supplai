import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const blueprintId = searchParams.get('blueprint_id');

    if (!blueprintId) {
      return NextResponse.json(
        { success: false, error: 'Blueprint ID is required' },
        { status: 400 }
      );
    }

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

    const { data: analyses, error } = await supabase
      .from('blueprint_analyses')
      .select('*')
      .eq('blueprint_id', blueprintId)
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
      analyses: analyses.map(a => ({
        id: a.id,
        blueprintId: a.blueprint_id,
        category: a.category,
        prompt: a.prompt,
        result: a.result,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener análisis' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { blueprint_id, category, prompt, result } = await request.json();

    if (!blueprint_id || !prompt || !result) {
      return NextResponse.json(
        { success: false, error: 'Blueprint ID, prompt and result are required' },
        { status: 400 }
      );
    }

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

    const { data: analysis, error: dbError } = await supabase
      .from('blueprint_analyses')
      .insert({
        blueprint_id,
        user_id: user.id,
        category,
        prompt,
        result,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { success: false, error: dbError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        blueprintId: analysis.blueprint_id,
        category: analysis.category,
        prompt: analysis.prompt,
        result: analysis.result,
        createdAt: analysis.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al guardar análisis' },
      { status: 500 }
    );
  }
}
