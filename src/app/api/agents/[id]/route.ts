import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Retell from 'retell-sdk';

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || '',
});

// GET - Obtener un agente específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: agent, error } = await supabase
      .from('retell_agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Obtener detalles actualizados de Retell
    try {
      const retellAgent = await retellClient.agent.retrieve(agent.agent_id);
      return NextResponse.json({ agent, retell_details: retellAgent });
    } catch {
      return NextResponse.json({ agent });
    }
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Error fetching agent' }, { status: 500 });
  }
}

// PATCH - Actualizar un agente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verificar que el agente pertenece al usuario
    const { data: existingAgent, error: fetchError } = await supabase
      .from('retell_agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Actualizar en Supabase
    const { data: agent, error } = await supabase
      .from('retell_agents')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Error updating agent' }, { status: 500 });
  }
}

// DELETE - Eliminar un agente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el agente pertenece al usuario
    const { data: existingAgent, error: fetchError } = await supabase
      .from('retell_agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Intentar eliminar de Retell AI primero
    try {
      await retellClient.agent.delete(existingAgent.agent_id);
    } catch (retellError) {
      console.error('Error deleting agent from Retell AI:', retellError);
      // Continuar con la eliminación local incluso si falla en Retell
    }

    // Eliminar de Supabase
    const { error } = await supabase
      .from('retell_agents')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Error deleting agent' }, { status: 500 });
  }
}
