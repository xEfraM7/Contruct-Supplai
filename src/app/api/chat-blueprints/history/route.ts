import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Get chat history for a session
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id es requerido" },
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

    // 2. Obtener items de la Conversation desde OpenAI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = await (openai as any).conversations.items.list(
      session.conversation_id,
      {
        limit: 100,
        order: "asc",
      }
    );

    // 3. Formatear mensajes
    const messages = items.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item.type === "message")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => {
        let content = "";

        if (item.content && Array.isArray(item.content)) {
          // Extraer texto del contenido
          const textContent = item.content.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => c.type === "input_text" || c.type === "output_text"
          );
          content = textContent?.text || "";
        }

        return {
          id: item.id,
          role: item.role,
          content: content,
          created_at: item.created_at,
        };
      });

    return NextResponse.json({ messages });
  } catch (error: unknown) {
    console.error("[CHAT_HISTORY_ERROR]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
