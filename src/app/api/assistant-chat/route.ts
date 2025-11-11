import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Mapeo de categorías de blueprint a categorías de inventario
const CATEGORY_MAPPING: Record<string, string[]> = {
  Electrical: ["Electrical", "Tools", "Safety"],
  Plumbing: ["Plumbing", "Tools", "Safety"],
  HVAC: ["HVAC", "Tools", "Safety"],
  Structural: ["Structural", "Tools", "Safety"],
  Architectural: ["Architectural", "Tools", "Safety"],
  General: ["Electrical", "Plumbing", "HVAC", "Structural", "Architectural", "Tools", "Safety"],
};

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
    let blueprintCategory = "General";

    if (user && projectId) {
      // ✅ OPTIMIZACIÓN 1: Cargar datos en PARALELO
      const projectPromise = supabase
        .from("projects")
        .select("name, description")
        .eq("id", projectId)
        .single();

      const blueprintPromise = blueprintId
        ? supabase
            .from("blueprints")
            .select("file_name, category, file_url, openai_file_id")
            .eq("id", blueprintId)
            .single()
        : null;

      const analysesPromise = blueprintId
        ? supabase
            .from("blueprint_analyses")
            .select("category, prompt, created_at")
            .eq("blueprint_id", blueprintId)
            .order("created_at", { ascending: false })
            .limit(3)
        : null;

      // Ejecutar todas las consultas en paralelo
      const [projectResult, blueprintResult, analysesResult] = await Promise.all([
        projectPromise,
        blueprintPromise,
        analysesPromise,
      ]);

      // Procesar proyecto
      if (projectResult?.data) {
        contextInfo += `\n## PROJECT CONTEXT\nProject: ${projectResult.data.name}\n`;
        if (projectResult.data.description) {
          contextInfo += `Description: ${projectResult.data.description}\n`;
        }
      }

      // Procesar blueprint
      if (blueprintResult?.data) {
        const blueprint = blueprintResult.data;
        blueprintCategory = blueprint.category || "General";
        contextInfo += `\n## CURRENT BLUEPRINT\nFile: ${blueprint.file_name}\nCategory: ${blueprint.category}\n`;

        // Manejar archivo de OpenAI
        if (blueprint.openai_file_id) {
          blueprintFileIds.push(blueprint.openai_file_id);
          console.log("[CHAT] Using cached OpenAI file:", blueprint.openai_file_id);
        } else if (blueprint.file_url) {
          // Subir en paralelo con otras operaciones
          try {
            console.log("[CHAT] Uploading blueprint to OpenAI...");
            const [response] = await Promise.all([
              fetch(blueprint.file_url),
            ]);
            
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

              // Guardar en background (no esperar)
              supabase
                .from("blueprints")
                .update({ openai_file_id: uploadedFile.id })
                .eq("id", blueprintId)
                .then(() => console.log("[CHAT] OpenAI file ID cached"));
            }
          } catch (uploadError) {
            console.error("[CHAT] Error uploading blueprint:", uploadError);
          }
        }
      }

      // ✅ OPTIMIZACIÓN 2: Filtrar inventario por categoría relevante
      const relevantCategories = CATEGORY_MAPPING[blueprintCategory] || CATEGORY_MAPPING.General;
      
      const { data: equipment } = await supabase
        .from("equipment")
        .select("name, tag, category, status, value, quantity")
        .eq("user_id", user.id)
        .in("category", relevantCategories)
        .order("category", { ascending: true });

      if (equipment && equipment.length > 0) {
        // ✅ OPTIMIZACIÓN 3: Formato compacto del inventario
        contextInfo += `\n## RELEVANT INVENTORY (${blueprintCategory})\n`;
        contextInfo += `Total items: ${equipment.length}\n\n`;
        
        // Agrupar por categoría para mejor legibilidad
        const grouped = equipment.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {} as Record<string, typeof equipment>);

        Object.entries(grouped).forEach(([cat, items]) => {
          contextInfo += `**${cat}:**\n`;
          items.forEach(item => {
            contextInfo += `- ${item.name} (${item.tag}): $${item.value} x${item.quantity} [${item.status}]\n`;
          });
          contextInfo += `\n`;
        });
      } else {
        contextInfo += `\n## INVENTORY STATUS\nNo items found for ${blueprintCategory} category.\n`;
      }

      // Procesar análisis (solo metadata, no resultados completos)
      if (analysesResult?.data && analysesResult.data.length > 0) {
        contextInfo += `\n## RECENT ANALYSES\n`;
        analysesResult.data.forEach((analysis, idx) => {
          const date = new Date(analysis.created_at).toLocaleDateString();
          contextInfo += `${idx + 1}. ${analysis.category} - ${date}\n   Q: ${analysis.prompt.substring(0, 80)}...\n`;
        });
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
        // Si no existe, crear nueva conversación en OpenAI con contexto inicial
        const initialItems = [];
        
        // Agregar contexto como primer mensaje si existe
        if (contextInfo) {
          initialItems.push({
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: `SYSTEM CONTEXT:\n${contextInfo}` }],
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conversation = await (openai as any).conversations.create({
          items: initialItems.length > 0 ? initialItems : undefined,
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
        console.log("[CHAT] Created new conversation with context:", openaiConversationId);
      }
    } else {
      // Crear nueva conversación en OpenAI con contexto inicial
      const initialItems = [];
      
      // Agregar contexto como primer mensaje si existe
      if (contextInfo) {
        initialItems.push({
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: `SYSTEM CONTEXT:\n${contextInfo}` }],
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversation = await (openai as any).conversations.create({
        items: initialItems.length > 0 ? initialItems : undefined,
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
      console.log("[CHAT] Created new conversation with context:", conversationId);
    }

    // Preparar el mensaje (el contexto ya está en la conversación si es nueva)
    // Solo incluir contexto si es una conversación existente que no lo tiene
    const isExistingConversation = clientConversationId !== null;
    const messageContent = isExistingConversation && contextInfo
      ? `${contextInfo}\n\n---\n\nUser Question: ${message}`
      : message;

    // Usar Responses API para generar la respuesta con el modelo y archivos
    // La Responses API automáticamente agrega el input y output a la conversación
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseParams: any = {
      model: "gpt-5",
      instructions: `You are an expert construction estimator and blueprint analyst. You help users understand their construction blueprints, provide cost estimates, identify discrepancies, and answer questions about their projects.

Key responsibilities:
- Answer questions about blueprint analyses
- Provide cost estimates based on user's inventory
- Explain technical details in clear language
- Help identify potential issues or discrepancies
- Suggest solutions and best practices

When referencing costs, always use the user's inventory data when available. Be concise but thorough in your responses.`,
      input: messageContent,
      conversation: openaiConversationId, // Vincula con la conversación existente
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

    // ✅ OPTIMIZACIÓN 4: Streaming de respuesta
    console.log("[CHAT] Generating response with streaming...");
    
    // Crear stream de respuesta
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const apiResponse = await (openai as any).responses.create({
            ...responseParams,
            stream: true,
          });

          let fullReply = "";

          // Procesar el stream
          for await (const chunk of apiResponse) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (chunk.type === "response.output_item.delta" && (chunk as any).delta?.type === "output_text") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const text = (chunk as any).delta?.text || "";
              fullReply += text;
              
              // Enviar chunk al cliente
              const data = JSON.stringify({ 
                type: "chunk", 
                content: text,
                conversationId,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Guardar mensajes en Supabase en background
          supabase.from("chat_messages").insert([
            {
              conversation_id: conversationId,
              role: "user",
              content: message,
            },
            {
              conversation_id: conversationId,
              role: "assistant",
              content: fullReply,
            },
          ]).then(() => console.log("[CHAT] Messages saved to database"));

          // Enviar mensaje de finalización
          const doneData = JSON.stringify({ 
            type: "done", 
            conversationId,
            fullReply,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
          
          controller.close();
        } catch (error) {
          console.error("[CHAT_STREAM_ERROR]:", error);
          const errorData = JSON.stringify({ 
            type: "error", 
            error: error instanceof Error ? error.message : "Stream error",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: unknown) {
    console.error("[CHAT_ERROR]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
