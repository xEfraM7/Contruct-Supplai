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

    // Get active contracts count
    const { data: activeProjects, error: activeError } = await supabase
      .from('project')
      .select('id, estimated_budget, start_date, estimated_end_date, actual_end_date, status')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (activeError) {
      console.error('Error fetching active projects:', activeError);
      return NextResponse.json({ error: "Failed to fetch active projects" }, { status: 500 });
    }

    // Calculate total budget from active projects
    const totalBudget = activeProjects?.reduce((sum, project) => {
      return sum + (Number(project.estimated_budget) || 0);
    }, 0) || 0;

    // Get completed projects for on-time delivery calculation
    const { data: completedProjects, error: completedError } = await supabase
      .from('project')
      .select('estimated_end_date, actual_end_date')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('estimated_end_date', 'is', null)
      .not('actual_end_date', 'is', null);

    if (completedError) {
      console.error('Error fetching completed projects:', completedError);
      return NextResponse.json({ error: "Failed to fetch completed projects" }, { status: 500 });
    }

    // Calculate on-time delivery percentage
    let onTimeDelivery = 0;
    if (completedProjects && completedProjects.length > 0) {
      const onTimeCount = completedProjects.filter(project => {
        const estimatedDate = new Date(project.estimated_end_date);
        const actualDate = new Date(project.actual_end_date);
        return actualDate <= estimatedDate;
      }).length;
      
      onTimeDelivery = Math.round((onTimeCount / completedProjects.length) * 100);
    }

    return NextResponse.json({
      activeContracts: activeProjects?.length || 0,
      totalBudget,
      onTimeDelivery,
    });

  } catch (error) {
    console.error('Error in dashboard metrics API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}