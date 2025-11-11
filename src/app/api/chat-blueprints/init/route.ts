import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Initialize a chat session for a blueprint
 * Creates a Conversation and Vector Store in OpenAI
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[CHAT_INIT] Iniciando sesión de chat...");

    const body = await req.json();
    const { blueprint_id } = body;

    if (!blueprint_id) {
      return NextResponse.json(
        { error: "blueprint_id es requerido" },
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

    // 1. Obtener blueprint
    const { data: blueprint, error: blueprintError } = await supabase
      .from("blueprints")
      .select("*")
      .eq("id", blueprint_id)
      .eq("user_id", user.id)
      .single();

    if (blueprintError || !blueprint) {
      return NextResponse.json(
        { error: "Blueprint no encontrado" },
        { status: 404 }
      );
    }

    console.log("[CHAT_INIT] Blueprint encontrado:", blueprint.file_name);

    // 2. Verificar si ya existe una sesión activa
    const { data: existingSession } = await supabase
      .from("blueprint_chat_sessions")
      .select("*")
      .eq("blueprint_id", blueprint_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (existingSession) {
      console.log("[CHAT_INIT] Sesión existente encontrada");
      return NextResponse.json({
        session_id: existingSession.id,
        conversation_id: existingSession.conversation_id,
        is_new: false,
      });
    }

    // 3. Descargar archivo desde Supabase
    console.log("[CHAT_INIT] Descargando archivo...");
    const response = await fetch(blueprint.file_url);
    if (!response.ok) {
      throw new Error("Failed to download blueprint file");
    }
    const blob = await response.blob();
    const file = new File([blob], blueprint.file_name, {
      type: "application/pdf",
    });

    // 4. Subir a OpenAI
    console.log("[CHAT_INIT] Subiendo a OpenAI...");
    const uploadedFile = await openai.files.create({
      file: file,
      purpose: "assistants",
    });

    console.log("[CHAT_INIT] Archivo subido:", uploadedFile.id);

    // 5. Crear Vector Store
    console.log("[CHAT_INIT] Creando vector store...");
    const vectorStore = await openai.vectorStores.create({
      name: `Chat - ${blueprint.file_name}`,
    });

    // 6. Agregar archivo al vector store
    await openai.vectorStores.files.create(vectorStore.id, {
      file_id: uploadedFile.id,
    });

    // 7. Esperar indexación
    console.log("[CHAT_INIT] Esperando indexación...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let fileStatus = await openai.vectorStores.files.retrieve(
      uploadedFile.id,
      {
        vector_store_id: vectorStore.id,
      }
    );

    let attempts = 0;
    const maxAttempts = 60;
    while (fileStatus.status !== "completed" && attempts < maxAttempts) {
      if (fileStatus.status === "failed") {
        throw new Error(
          `File indexing failed: ${fileStatus.last_error?.message || "Unknown error"}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      fileStatus = await openai.vectorStores.files.retrieve(
        uploadedFile.id,
        {
          vector_store_id: vectorStore.id,
        }
      );
      attempts++;
      console.log(
        `[CHAT_INIT] File status: ${fileStatus.status} (${attempts}/${maxAttempts})`
      );
    }

    if (fileStatus.status !== "completed") {
      throw new Error("File indexing timeout");
    }

    console.log("[CHAT_INIT] Archivo indexado correctamente");

    // 8. Crear Conversation en OpenAI
    console.log("[CHAT_INIT] Creando conversación...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversation = await (openai as any).conversations.create({
      metadata: {
        blueprint_id: blueprint_id,
        user_id: user.id,
        blueprint_name: blueprint.file_name,
      },
    });

    console.log("[CHAT_INIT] Conversación creada:", conversation.id);

    // 9. Guardar sesión en BD
    const { data: session, error: sessionError } = await supabase
      .from("blueprint_chat_sessions")
      .insert({
        blueprint_id: blueprint_id,
        user_id: user.id,
        conversation_id: conversation.id,
        vector_store_id: vectorStore.id,
        openai_file_id: uploadedFile.id,
        title: `Chat - ${blueprint.file_name}`,
        is_active: true,
      })
      .select()
      .single();

    if (sessionError) {
      console.error("[CHAT_INIT] Error guardando sesión:", sessionError);
      throw sessionError;
    }

    console.log("[CHAT_INIT] Sesión creada exitosamente");

    return NextResponse.json({
      session_id: session.id,
      conversation_id: conversation.id,
      is_new: true,
    });
  } catch (error: unknown) {
    console.error("[CHAT_INIT_ERROR]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
