import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET - Obtener todas las llamadas de un subcontractor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subcontractor_id: string }> }
) {
  try {
    const { subcontractor_id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: calls, error } = await supabase
      .from('retell_calls')
      .select('*')
      .eq('user_id', user.id)
      .eq('subcontractor_id', subcontractor_id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ calls: calls || [] });
  } catch (error) {
    console.error('Error fetching calls:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching calls';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
