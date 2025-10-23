import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Retell from 'retell-sdk';

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || '',
});

// POST - Crear un nuevo LLM
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user name from metadata or email
    const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'the project manager';

    const body = await request.json();
    const {
      model = 'gpt-4o-mini',
      general_prompt,
      start_speaker = 'agent',
      begin_message,
    } = body;

    // Replace placeholder with actual user name
    const processedPrompt = general_prompt.replace(/\{\{project_manager_name\}\}/g, userName);

    const llmResponse = await retellClient.llm.create({
      model,
      general_prompt: processedPrompt,
      start_speaker,
      begin_message: begin_message || null,
      general_tools: [
        {
          type: 'end_call',
          name: 'end_call',
          description: 'End the call with the user.',
        },
      ],
    });

    return NextResponse.json({ llm: llmResponse }, { status: 201 });
  } catch (error) {
    console.error('Error creating LLM:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error creating LLM';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
