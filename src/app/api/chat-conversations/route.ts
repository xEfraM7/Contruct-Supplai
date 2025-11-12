import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET - Obtener conversaciones del usuario
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    const blueprintId = searchParams.get("blueprint_id");

    let query = supabase
      .from("chat_conversations")
      .select(
        `
        id,
        title,
        created_at,
        last_message_at,
        project_id,
        blueprint_id,
        project:project(name),
        blueprint:blueprints(file_name)
      `
      )
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (blueprintId) {
      query = query.eq("blueprint_id", blueprintId);
    }

    const { data: conversations, error } = await query;

    if (error) throw error;

    return NextResponse.json({ conversations });
  } catch (error: unknown) {
    console.error("[CHAT_CONVERSATIONS_ERROR]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE - Eliminar una conversación
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[DELETE_CONVERSATION_ERROR]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
