import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/employees - Fetch all employees
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employees:', error);
      return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }

    // Fetch project counts for each employee
    const employeesWithStats = await Promise.all(
      (employees || []).map(async (employee) => {
        const { data: projects } = await supabase
          .from('project')
          .select('id, status')
          .eq('employee_manager_id', employee.id)
          .eq('user_id', user.id);

        const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
        const totalProjects = projects?.length || 0;

        return {
          ...employee,
          active_projects: activeProjects,
          total_projects: totalProjects,
        };
      })
    );

    return NextResponse.json({ employees: employeesWithStats });
  } catch (error) {
    console.error('Error in employees API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/employees - Create a new employee
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const { data: employee, error } = await supabase
      .from('employees')
      .insert([
        {
          ...body,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating employee:', error);
      return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error('Error in employees API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
