import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Retell from 'retell-sdk';

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || '',
});

// GET - Obtener detalles de una llamada
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ call_id: string }> }
) {
  try {
    const { call_id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener detalles de Retell AI
    const callDetails = await retellClient.call.retrieve(call_id);

    // Actualizar en la base de datos local
    const { error: updateError } = await supabase
      .from('retell_calls')
      .update({
        call_status: callDetails.call_status,
        duration_ms: callDetails.duration_ms || null,
        transcript: callDetails.transcript || null,
        call_summary: callDetails.call_analysis?.call_summary || null,
        user_sentiment: callDetails.call_analysis?.user_sentiment || null,
        call_successful: callDetails.call_analysis?.call_successful || null,
        recording_url: callDetails.recording_url || null,
        end_timestamp: callDetails.end_timestamp || null,
        disconnection_reason: callDetails.disconnection_reason || null,
        call_analysis: callDetails.call_analysis || null,
        updated_at: new Date().toISOString(),
      })
      .eq('call_id', call_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating call in database:', updateError);
    }

    return NextResponse.json({ call: callDetails });
  } catch (error) {
    console.error('Error fetching call:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching call';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
