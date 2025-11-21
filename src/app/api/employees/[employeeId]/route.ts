import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/employees/[employeeId] - Fetch single employee with details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params;
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch employee
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('user_id', user.id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Fetch projects managed by this employee
    const { data: projects, error: projectsError } = await supabase
      .from('project')
      .select(`
        id,
        name,
        status,
        client_id,
        clients (
          id,
          company_name
        )
      `)
      .eq('employee_manager_id', employeeId)
      .eq('user_id', user.id);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }

    // Calculate stats
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
    const totalProjects = projects?.length || 0;
    const clientNames = projects?.map(p => {
      const client = Array.isArray(p.clients) ? p.clients[0] : p.clients;
      return client?.company_name;
    }).filter(Boolean) || [];
    const clients = [...new Set(clientNames)];

    return NextResponse.json({
      employee: {
        ...employee,
        active_projects: activeProjects,
        total_projects: totalProjects,
        clients,
        projects,
      },
    });
  } catch (error) {
    console.error('Error in employee API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/employees/[employeeId] - Update employee
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params;
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const { data: employee, error } = await supabase
      .from('employees')
      .update(body)
      .eq('id', employeeId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('Error in employee API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/employees/[employeeId] - Delete employee
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params;
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting employee:', error);
      return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in employee API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
