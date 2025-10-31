import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id, file_name, file_url, category } = body;

    if (!project_id || !file_name || !file_url) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    // Calcular file_size desde la URL si es posible
    let file_size = 0;
    try {
      const headResponse = await fetch(file_url, { method: "HEAD" });
      const contentLength = headResponse.headers.get("content-length");
      if (contentLength) {
        file_size = parseInt(contentLength);
      }
    } catch {
      // Si falla, dejar en 0
    }

    // Save blueprint record
    const { data: blueprint, error: dbError } = await supabase
      .from("blueprints")
      .insert({
        project_id,
        user_id: user.id,
        file_name,
        file_url,
        file_size,
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
  } catch {
    return NextResponse.json(
      { success: false, error: "Error al guardar blueprint" },
      { status: 500 }
    );
  }
}
