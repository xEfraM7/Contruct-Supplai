import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
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

    const { data: blueprints, error } = await supabase
      .from('blueprints')
      .select('*')
      .eq('project_id', projectId)
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
      blueprints: blueprints.map(b => ({
        id: b.id,
        fileName: b.file_name,
        fileUrl: b.file_url,
        fileSize: b.file_size,
        category: b.category,
        createdAt: b.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener blueprints' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('project_id') as string;
    const category = formData.get('category') as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { success: false, error: 'File and project ID are required' },
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

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${projectId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blueprints')
      .upload(fileName, file);

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 400 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blueprints')
      .getPublicUrl(fileName);

    // Save blueprint record
    const { data: blueprint, error: dbError } = await supabase
      .from('blueprints')
      .insert({
        project_id: projectId,
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        category,
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
      blueprint: {
        id: blueprint.id,
        fileName: blueprint.file_name,
        fileUrl: blueprint.file_url,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al guardar blueprint' },
      { status: 500 }
    );
  }
}
