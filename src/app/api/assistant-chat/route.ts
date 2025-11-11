import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    const blueprintFileIds: string[] = [];

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

      // Si hay un blueprint específico, obtener sus análisis Y el archivo PDF
      if (blueprintId) {
        const { data: blueprint } = await supabase
          .from("blueprints")
          .select("file_name, category, file_url, openai_file_id")
          .eq("id", blueprintId)
          .single();

        if (blueprint) {
          contextInfo += `\n## CURRENT BLUEPRINT\nFile: ${blueprint.file_name}\nCategory: ${blueprint.category}\n`;

          // Si el blueprint tiene un openai_file_id guardado, usarlo
          if (blueprint.openai_file_id) {
            blueprintFileIds.push(blueprint.openai_file_id);
            console.log("[CHAT] Using existing OpenAI file:", blueprint.openai_file_id);
          } else if (blueprint.file_url) {
            // Si no tiene openai_file_id, subir el PDF a OpenAI
            try {
              console.log("[CHAT] Uploading blueprint to OpenAI...");
              const response = await fetch(blueprint.file_url);
              if (response.ok) {
                const blob = await response.blob();
                const file = new File([blob], blueprint.file_name, {
                  type: "application/pdf",
                });

                const uploadedFile = await openai.files.create({
                  file: file,
                  purpose: "assistants",
                });

                blueprintFileIds.push(uploadedFile.id);
                console.log("[CHAT] Blueprint uploaded:", uploadedFile.id);

                // Guardar el openai_file_id para futuras consultas
                await supabase
                  .from("blueprints")
                  .update({ openai_file_id: uploadedFile.id })
                  .eq("id", blueprintId);
              }
            } catch (uploadError) {
              console.error("[CHAT] Error uploading blueprint:", uploadError);
            }
          }
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

    // Obtener o crear conversación usando Supabase
    let openaiConversationId: string;
    let conversationId: string;

    if (clientConversationId) {
      // Buscar conversación existente
      const { data: existingConv } = await supabase
        .from("chat_conversations")
        .select("id, thread_id")
        .eq("id", clientConversationId)
        .eq("user_id", user!.id)
        .single();

      if (existingConv) {
        openaiConversationId = existingConv.thread_id;
        conversationId = existingConv.id;
        console.log("[CHAT] Using existing conversation:", openaiConversationId);
      } else {
        // Si no existe, crear nueva conversación en OpenAI (sin model ni instructions)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conversation = await (openai as any).conversations.create({
          metadata: {
            project_id: projectId || "",
            blueprint_id: blueprintId || "",
          },
        });

        openaiConversationId = conversation.id;

        const { data: newConv } = await supabase
          .from("chat_conversations")
          .insert({
            user_id: user!.id,
            project_id: projectId || null,
            blueprint_id: blueprintId || null,
            thread_id: openaiConversationId,
            title: message.substring(0, 100),
          })
          .select()
          .single();

        conversationId = newConv!.id;
        console.log("[CHAT] Created new conversation:", openaiConversationId);
      }
    } else {
      // Crear nueva conversación en OpenAI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversation = await (openai as any).conversations.create({
        metadata: {
          project_id: projectId || "",
          blueprint_id: blueprintId || "",
        },
      });

      openaiConversationId = conversation.id;

      const { data: newConv } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user!.id,
          project_id: projectId || null,
          blueprint_id: blueprintId || null,
          thread_id: openaiConversationId,
          title: message.substring(0, 100),
        })
        .select()
        .single();

      conversationId = newConv!.id;
      console.log("[CHAT] Created new conversation:", conversationId);
    }

    // Preparar el mensaje con contexto
    const messageContent = contextInfo
      ? `${contextInfo}\n\n---\n\nUser Question: ${message}`
      : message;

    // Preparar items para agregar a la conversación
    const items = [
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: messageContent }],
      },
    ];

    // Agregar items a la conversación
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (openai as any).conversations.items.create(openaiConversationId, {
      items,
    });

    console.log("[CHAT] Message added to conversation");

    // Usar Responses API para generar la respuesta con el modelo y archivos
    const responseParams: {
      model: string;
      instructions: string;
      conversation_id: string;
      tools?: Array<{ type: string; file_ids?: string[] }>;
    } = {
      model: "gpt-5",
      instructions: `You are an expert construction estimator and blueprint analyst. You help users understand their construction blueprints, provide cost estimates, identify discrepancies, and answer questions about their projects.

Key responsibilities:
- Answer questions about blueprint analyses
- Provide cost estimates based on user's inventory
- Explain technical details in clear language
- Help identify potential issues or discrepancies
- Suggest solutions and best practices

When referencing costs, always use the user's inventory data when available. Be concise but thorough in your responses.`,
      conversation_id: openaiConversationId,
    };

    // Si hay archivos de blueprints, agregarlos como herramienta
    if (blueprintFileIds.length > 0) {
      responseParams.tools = [
        {
          type: "file_search",
          file_ids: blueprintFileIds,
        },
      ];
      console.log("[CHAT] Attaching blueprint files:", blueprintFileIds);
    }

    // Generar respuesta usando Responses API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiResponse = await (openai as any).responses.create(responseParams);

    console.log("[CHAT] Response generated");

    // Extraer el texto de la respuesta
    let reply = "No response generated.";
    if (apiResponse.output && Array.isArray(apiResponse.output)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messageOutput = apiResponse.output.find((item: any) => item.type === "message");
       
      if (messageOutput?.content && Array.isArray(messageOutput.content)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textContent = messageOutput.content.find((item: any) => item.type === "output_text");
        if (textContent?.text) {
          reply = textContent.text;
        }
      }
    }

    // Guardar mensajes en Supabase
    await supabase.from("chat_messages").insert([
      {
        conversation_id: conversationId,
        role: "user",
        content: message,
      },
      {
        conversation_id: conversationId,
        role: "assistant",
        content: reply,
      },
    ]);

    console.log("[CHAT] Messages saved to database");

    return NextResponse.json({
      reply,
      conversationId,
    });
  } catch (error: unknown) {
    console.error("[CHAT_ERROR]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
