import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Obtener el usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener subcontratistas del usuario
    const { data: subcontractors, error } = await supabase
      .from("subcontractors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subcontractors:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Contar proyectos activos para cada subcontratista (solo proyectos del usuario actual)
    const subcontractorsWithProjects = await Promise.all(
      (subcontractors || []).map(async (contractor) => {
        const { count } = await supabase
          .from("project_subcontractors")
          .select("project!inner(*)", { count: "exact", head: true })
          .eq("subcontractor_id", contractor.id)
          .eq("project.user_id", user.id);

        return {
          ...contractor,
          activeProjects: count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      subcontractors: subcontractorsWithProjects,
    });
  } catch (error) {
    console.error("Error in subcontractors API:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Obtener el usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, company, phone, email, status, projectId } = body;

    // Validar datos requeridos
    if (!name || !company || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Crear subcontratista
    const { data: subcontractor, error } = await supabase
      .from("subcontractors")
      .insert({
        user_id: user.id,
        name,
        company,
        phone,
        email,
        status: status || "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subcontractor:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Si se seleccionó un proyecto, validar que pertenezca al usuario y asignar el subcontratista
    if (projectId && projectId !== "" && projectId !== "none") {
      // Verificar que el proyecto pertenece al usuario actual
      const { data: project, error: projectError } = await supabase
        .from("project")
        .select("id")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();

      if (projectError || !project) {
        console.error("Project not found or doesn't belong to user:", projectError);
        return NextResponse.json(
          { success: false, error: "Proyecto no encontrado o no autorizado" },
          { status: 403 }
        );
      }

      // Asignar el subcontratista al proyecto
      const { error: assignmentError } = await supabase
        .from("project_subcontractors")
        .insert({
          project_id: projectId,
          subcontractor_id: subcontractor.id,
        });

      if (assignmentError) {
        console.error("Error assigning subcontractor to project:", assignmentError);
        // No fallar la creación del subcontratista si falla la asignación
        console.warn("Subcontractor created but project assignment failed");
      }
    }

    // Contar proyectos activos del nuevo subcontratista
    const { count } = await supabase
      .from("project_subcontractors")
      .select("*", { count: "exact", head: true })
      .eq("subcontractor_id", subcontractor.id);

    return NextResponse.json({
      success: true,
      subcontractor: {
        ...subcontractor,
        activeProjects: count || 0,
      },
    });
  } catch (error) {
    console.error("Error in subcontractors POST API:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}