import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Store para mantener conversaciones en memoria (en producción usar Redis o DB)
const conversationStore = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      conversationId: clientConversationId,
      projectId,
      blueprintId,
      analysisContext,
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Obtener contexto del usuario (inventario, proyecto, etc.)
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let contextInfo = "";

    if (user && projectId) {
      // Obtener información del proyecto
      const { data: project } = await supabase
        .from("projects")
        .select("name, description")
        .eq("id", projectId)
        .single();

      if (project) {
        contextInfo += `\n## PROJECT CONTEXT\nProject: ${project.name}\n`;
        if (project.description) {
          contextInfo += `Description: ${project.description}\n`;
        }
      }

      // Obtener inventario del usuario
      const { data: equipment } = await supabase
        .from("equipment")
        .select("name, tag, category, status, location, value, quantity")
        .eq("user_id", user.id)
        .order("category", { ascending: true });

      if (equipment && equipment.length > 0) {
        contextInfo += `\n## USER INVENTORY\n\`\`\`json\n${JSON.stringify(
          equipment,
          null,
          2
        )}\n\`\`\`\n`;
      }

      // Si hay un blueprint específico, obtener sus análisis
      if (blueprintId) {
        const { data: blueprint } = await supabase
          .from("blueprints")
          .select("file_name, category")
          .eq("id", blueprintId)
          .single();

        if (blueprint) {
          contextInfo += `\n## CURRENT BLUEPRINT\nFile: ${blueprint.file_name}\nCategory: ${blueprint.category}\n`;
        }

        const { data: analyses } = await supabase
          .from("blueprint_analyses")
          .select("category, prompt, result, created_at")
          .eq("blueprint_id", blueprintId)
          .order("created_at", { ascending: false })
          .limit(3);

        if (analyses && analyses.length > 0) {
          contextInfo += `\n## RECENT ANALYSES\n`;
          analyses.forEach((analysis, idx) => {
            contextInfo += `\nAnalysis ${idx + 1} (${analysis.category}):\nPrompt: ${analysis.prompt}\n`;
          });
        }
      }
    }

    // Agregar contexto del análisis actual si existe
    if (analysisContext) {
      contextInfo += `\n## CURRENT ANALYSIS RESULT\n${analysisContext}\n`;
    }

    // Obtener o crear thread de conversación
    let threadId: string;

    if (clientConversationId && conversationStore.has(clientConversationId)) {
      threadId = conversationStore.get(clientConversationId)!;
      console.log("[CHAT] Using existing thread:", threadId);
    } else {
      // Crear nuevo thread
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      const newConversationId = `conv_${Date.now()}`;
      conversationStore.set(newConversationId, threadId);
      console.log("[CHAT] Created new thread:", threadId);
    }

    // Agregar mensaje del usuario al thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: contextInfo
        ? `${contextInfo}\n\n---\n\nUser Question: ${message}`
        : message,
    });

    // Crear o obtener assistant
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    let assistant;

    if (assistantId) {
      assistant = await openai.beta.assistants.retrieve(assistantId);
    } else {
      // Crear assistant si no existe
      assistant = await openai.beta.assistants.create({
        name: "Blueprint Analysis Assistant",
        instructions: `You are an expert construction estimator and blueprint analyst. You help users understand their construction blueprints, provide cost estimates, identify discrepancies, and answer questions about their projects.

Key responsibilities:
- Answer questions about blueprint analyses
- Provide cost estimates based on user's inventory
- Explain technical details in clear language
- Help identify potential issues or discrepancies
- Suggest solutions and best practices

When referencing costs, always use the user's inventory data when available. Be concise but thorough in your responses.`,
        model: "gpt-4o",
        tools: [{ type: "file_search" }],
      });

      console.log(
        "[CHAT] Created new assistant:",
        assistant.id,
        "- Add this to your .env as OPENAI_ASSISTANT_ID"
      );
    }

    // Ejecutar el assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistant.id,
    });

    // Esperar a que termine la ejecución
    let runStatus = await openai.beta.threads.runs.retrieve(run.id, {
      thread_id: threadId,
    });
    let attempts = 0;
    const maxAttempts = 30;

    while (
      runStatus.status !== "completed" &&
      runStatus.status !== "failed" &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(run.id, {
        thread_id: threadId,
      });
      attempts++;
      console.log(`[CHAT] Run status: ${runStatus.status} (${attempts}/${maxAttempts})`);
    }

    if (runStatus.status === "failed") {
      throw new Error(
        `Assistant run failed: ${runStatus.last_error?.message || "Unknown error"}`
      );
    }

    if (runStatus.status !== "completed") {
      throw new Error("Assistant run timeout");
    }

    // Obtener los mensajes del thread
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0];

    if (!lastMessage || lastMessage.role !== "assistant") {
      throw new Error("No assistant response found");
    }

    // Extraer el contenido del mensaje
    let reply = "No response generated.";
    if (lastMessage.content && lastMessage.content.length > 0) {
      const content = lastMessage.content[0];
      if (content.type === "text") {
        reply = content.text.value;
      }
    }

    return NextResponse.json({
      reply,
      conversationId:
        clientConversationId ||
        Array.from(conversationStore.entries()).find(
          ([, tid]) => tid === threadId
        )?.[0],
    });
  } catch (error: unknown) {
    console.error("[CHAT_ERROR]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
