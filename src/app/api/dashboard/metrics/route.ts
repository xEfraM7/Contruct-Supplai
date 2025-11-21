import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active projects count
    const { count: activeProjectsCount, error: activeError } = await supabase
      .from('project')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (activeError) {
      console.error('Error fetching active projects:', activeError);
      return NextResponse.json({ error: "Failed to fetch active projects" }, { status: 500 });
    }

    // Get total equipment count
    const { count: equipmentCount, error: equipmentError } = await supabase
      .from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
      return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 });
    }

    // Get pending tasks count
    const { count: pendingTasksCount, error: tasksError } = await supabase
      .from('contact_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress']);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    return NextResponse.json({
      activeProjects: activeProjectsCount || 0,
      totalEquipment: equipmentCount || 0,
      pendingTasks: pendingTasksCount || 0,
    });

  } catch (error) {
    console.error('Error in dashboard metrics API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}