import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener clients del usuario con conteo de subcontractors
    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Contar subcontractors para cada client
    const clientsWithSubcontractors = await Promise.all(
      (clients || []).map(async (client) => {
        const { count } = await supabase
          .from("subcontractors")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id);

        return {
          ...client,
          subcontractors_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      clients: clientsWithSubcontractors,
    });
  } catch (error) {
    console.error("Error in clients API:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      company_name,
      company_email,
      company_phone,
      address,
      website,
      notes,
    } = await request.json();

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

    // Crear client
    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        company_name,
        company_email,
        company_phone,
        address,
        website,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating client:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      client: {
        ...client,
        subcontractors_count: 0,
      },
    });
  } catch (error) {
    console.error("Error in clients POST:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
