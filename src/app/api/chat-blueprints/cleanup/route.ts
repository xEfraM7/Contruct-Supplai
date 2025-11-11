import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Cleanup chat session resources
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[CHAT_CLEANUP] Limpiando recursos...");

    const body = await req.json();
    const { session_id } = body;

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

    // 2. Eliminar Conversation de OpenAI
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (openai as any).conversations.delete(session.conversation_id);
      console.log("[CHAT_CLEANUP] Conversation eliminada");
    } catch (error) {
      console.warn("[CHAT_CLEANUP] Error eliminando conversation:", error);
    }

    // 3. Eliminar Vector Store
    try {
      await openai.vectorStores.delete(session.vector_store_id);
      console.log("[CHAT_CLEANUP] Vector Store eliminado");
    } catch (error) {
      console.warn("[CHAT_CLEANUP] Error eliminando vector store:", error);
    }

    // 4. Eliminar archivo de OpenAI
    if (session.openai_file_id) {
      try {
        await openai.files.delete(session.openai_file_id);
        console.log("[CHAT_CLEANUP] Archivo eliminado");
      } catch (error) {
        console.warn("[CHAT_CLEANUP] Error eliminando archivo:", error);
      }
    }

    // 5. Marcar sesión como inactiva
    await supabase
      .from("blueprint_chat_sessions")
      .update({ is_active: false })
      .eq("id", session_id);

    console.log("[CHAT_CLEANUP] Sesión marcada como inactiva");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[CHAT_CLEANUP_ERROR]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
