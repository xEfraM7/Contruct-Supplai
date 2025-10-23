import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Retell from "retell-sdk";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

// GET - Listar todos los agentes del usuario
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: agents, error } = await supabase
      .from("retell_agents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Error al obtener agentes" },
      { status: 500 }
    );
  }
}

const DEFAULT_PROMPT = `Act as a phone-based AI assistant working within a construction management application, representing the project manager of an ongoing construction project.

Your role is to call subcontractors who are assigned to different areas of the project (e.g., electrical, plumbing, structural, etc.) and follow up on their progress.

During each call, follow this structure:

1. Professional and clear introduction: Introduce yourself as the assistant of the project manager {{project_manager_name}}.

2. Quick verification: Confirm you're speaking with the person responsible for the subcontracted work.

3. Project context: Mention the name or location of the project if available.

4. Reason for the call:
   - If there is a specific task assigned: Ask if it has been completed, what the current status is, if any blockers have come up, and when they expect to finish.
   - If there is no specific task assigned: Ask for a general update on their area of responsibility (progress, delays, needs).

5. Record key information: Summarize the critical points and confirm that the report will be forwarded to the project manager.

6. Professional closing: Thank them for their time and let them know that you will follow up again if needed.

Keep a professional but friendly tone. Be direct, focused on gathering clear and actionable information. If the subcontractor mentions any blockers or requests for coordination with other teams, make sure to capture and report that as well.`;

// POST - Crear un nuevo agente
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      agent_name,
      voice_id,
      voice_model,
      language = "es-ES",
      llm_id,
      auto_create_llm = false,
      response_engine_type = "retell-llm",
      agent_config = {},
    } = body;

    let finalLlmId = llm_id;

    // Si auto_create_llm es true, siempre crear un nuevo LLM con el prompt correcto
    if (auto_create_llm && !llm_id) {
      try {
        // Siempre crear un nuevo LLM para asegurar que tenga el prompt correcto
        const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'the project manager';
        const processedPrompt = DEFAULT_PROMPT.replace(/\{\{project_manager_name\}\}/g, userName);
        
        const llmResponse = await retellClient.llm.create({
          model: 'gpt-4o-mini',
          general_prompt: processedPrompt,
          start_speaker: 'agent',
          begin_message: 'Hello, how is everything going? Please give me a status update on the current situation.',
          general_tools: [
            {
              type: 'end_call',
              name: 'end_call',
              description: 'End the call with the user.',
            },
          ],
        });
        
        finalLlmId = llmResponse.llm_id;
      } catch (llmError) {
        console.error('Error with LLM:', llmError);
        return NextResponse.json({ error: 'Error setting up LLM' }, { status: 500 });
      }
    }

    if (!finalLlmId) {
      return NextResponse.json({ error: 'LLM ID is required' }, { status: 400 });
    }

    // Crear agente en Retell AI
    const agentResponse = await retellClient.agent.create({
      agent_name,
      voice_id,
      voice_model: voice_model || null,
      language,
      response_engine: {
        type: response_engine_type,
        llm_id: finalLlmId,
      },
      ...agent_config,
    });

    // Guardar en Supabase
    const { data: agent, error } = await supabase
      .from("retell_agents")
      .insert({
        user_id: user.id,
        agent_id: agentResponse.agent_id,
        agent_name,
        voice_id,
        voice_model,
        language,
        llm_id: finalLlmId,
        response_engine: {
          type: response_engine_type,
          llm_id: finalLlmId,
        },
        agent_config,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { agent, retell_response: agentResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating agent:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al crear agente";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
