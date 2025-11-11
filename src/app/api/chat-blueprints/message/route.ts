import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Send a message in a chat session
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[CHAT_MESSAGE] Procesando mensaje...");

    const body = await req.json();
    const { session_id, message } = body;

    if (!session_id || !message) {
      return NextResponse.json(
        { error: "session_id y message son requeridos" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // 1. Obtener sesión
    const { data: session, error: sessionError } = await supabase
      .from("blueprint_chat_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    console.log("[CHAT_MESSAGE] Sesión encontrada:", session.conversation_id);

    // 2. Agregar mensaje del usuario a la Conversation
    console.log("[CHAT_MESSAGE] Agregando mensaje del usuario...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (openai as any).conversations.items.create(session.conversation_id, {
      items: [
        {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: message }],
        },
      ],
    });

    // 3. Obtener inventario del usuario
    const { data: equipment } = await supabase
      .from("equipment")
      .select("name, tag, category, status, location, value, quantity")
      .eq("user_id", user.id)
      .order("category", { ascending: true });

    let equipmentContext = "";
    if (equipment && equipment.length > 0) {
      equipmentContext = `\n\n## INVENTARIO DISPONIBLE\n\n\`\`\`json\n${JSON.stringify(
        equipment,
        null,
        2
      )}\n\`\`\`\n`;
    } else {
      equipmentContext = `\n\n## INVENTARIO\n\n⚠️ No hay equipos en el inventario.\n`;
    }

    // 4. Crear Response usando la Conversation
    console.log("[CHAT_MESSAGE] Generando respuesta...");

    const systemInstructions = `Eres un asistente experto en construcción y análisis de planos arquitectónicos.

## 🎯 TU FUNCIÓN

Responder preguntas específicas sobre el plano de construcción de forma conversacional y útil.

## 📚 CONTEXTO DISPONIBLE

1. **Plano PDF**: Tienes acceso completo al plano mediante la herramienta file_search
2. **Inventario del usuario**: ${equipment && equipment.length > 0 ? `${equipment.length} items disponibles` : "Sin inventario"}
3. **Historial de conversación**: Puedes referenciar mensajes anteriores

## 🎨 ESTILO DE RESPUESTA

- **Conciso**: 2-4 párrafos máximo
- **Específico**: Usa números, ubicaciones y referencias exactas del plano
- **Conversacional**: Habla de forma natural, no como un robot
- **Visual**: Usa emojis ocasionalmente (📐 🔌 💡 ⚠️ ✅)
- **Estructurado**: Usa bullets o listas cuando sea apropiado

## 🔍 CÓMO RESPONDER

1. **Busca en el plano**: Usa file_search para encontrar información específica
2. **Sé preciso**: Cita números de habitaciones, grid lines, o detalles específicos
3. **Usa el inventario**: Cuando pregunten sobre costos o disponibilidad
4. **Admite limitaciones**: Si no puedes ver algo claramente, dilo
5. **Sugiere alternativas**: Si la pregunta es ambigua, ofrece opciones

## ⚠️ REGLAS IMPORTANTES

- NO inventes información que no esté en el plano
- NO asumas dimensiones o especificaciones
- SI el plano no muestra algo claramente, di "No puedo ver eso claramente en el plano"
- SIEMPRE usa el inventario del usuario para costos (no inventes precios)
- MANTÉN el contexto de la conversación previa

${equipmentContext}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiResponse = await (openai as any).responses.create({
      model: "gpt-5",
      instructions: systemInstructions,
      conversation_id: session.conversation_id,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [session.vector_store_id],
        },
      ],
      store: true, // Guardar la respuesta en la Conversation
    });

    // 5. Extraer respuesta
    let assistantMessage = "Sin respuesta generada.";

    if (apiResponse.output && Array.isArray(apiResponse.output)) {
      const messageOutput = apiResponse.output.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => item.type === "message"
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (messageOutput?.content && Array.isArray((messageOutput as any).content)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textContent = (messageOutput as any).content.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => item.type === "output_text"
        );

        if (textContent?.text) {
          assistantMessage = textContent.text;
        }
      }
    }

    console.log("[CHAT_MESSAGE] Respuesta generada");

    // 6. Actualizar timestamp de la sesión
    await supabase
      .from("blueprint_chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", session_id);

    return NextResponse.json({
      message: assistantMessage,
      conversation_id: session.conversation_id,
    });
  } catch (error: unknown) {
    console.error("[CHAT_MESSAGE_ERROR]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
