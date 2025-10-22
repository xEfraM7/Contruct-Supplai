import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let assistant: { id: string } | null = null;
  let uploadedFile: { id: string } | null = null;

  try {
    console.log("[ANALYZE_BLUEPRINT] Iniciando análisis...");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const prompt = formData.get("prompt") as string;
    const category = formData.get("category") as string;

    console.log("[ANALYZE_BLUEPRINT] Datos recibidos:", {
      fileName: file?.name,
      fileSize: `${(file?.size / 1024 / 1024).toFixed(2)} MB`,
      category,
    });

    if (!file || !prompt) {
      return NextResponse.json(
        { error: "Archivo y prompt son requeridos." },
        { status: 400 }
      );
    }

    // Validar que el archivo sea PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF." },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo (máximo 25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo no puede ser mayor a 25MB." },
        { status: 400 }
      );
    }

    const finalCategory = category || "General";

    // Ya no necesitamos el contexto de equipos para el nuevo prompt simplificado

    // Paso 1: Subir el archivo a OpenAI
    console.log("[ANALYZE_BLUEPRINT] Subiendo PDF a OpenAI...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileToUpload = new File([buffer], file.name, {
      type: "application/pdf",
    });

    uploadedFile = await openai.files.create({
      file: fileToUpload,
      purpose: "assistants",
    });

    console.log("[ANALYZE_BLUEPRINT] Archivo subido, ID:", uploadedFile.id);

    // Paso 2: Crear un assistant con file_search
    console.log("[ANALYZE_BLUEPRINT] Creando assistant...");
    assistant = await openai.beta.assistants.create({
      name: "Construction Blueprint Analysis AI",
      instructions: `You are a construction blueprint analysis AI.

You will be given:
1. A specific **category** from the following: electrical, concrete, roofing, steel, plumbing, framing, flooring, glazing, HVAC, drywall, masonry, doors & windows.
2. A **user prompt** that describes what the user wants to analyze or verify from the blueprint.
3. A **blueprint in PDF format**.

Your task is to:
1. Analyze the PDF blueprint based on the selected category.
2. Provide a clear and accurate response to the user's question, only using the information available in the blueprint and the input data.
3. Identify and describe any **discrepancies** related to the user's query within the blueprint (e.g., missing elements, mismatched dimensions, code violations).
4. Detect and list any **potential RFIs (Requests for Information)** based on unclear, missing, or conflicting details relevant to the question and category.

### Output Format:

---
**Main Answer:**  
[Provide a direct and concise answer to the user's question, grounded only in the content of the blueprint.]

**Discrepancies Found:**  
[List any relevant issues, inconsistencies, or design conflicts detected in the blueprint.]

**Suggested RFIs:**  
[List any questions or clarifications that should be formally raised due to ambiguity, missing information, or contradictions.]
---

### Rules:
- **DO NOT fabricate or assume any information.** Only refer to what is present in the PDF and input data.
- If the required information is **not available or not visible in the blueprint**, clearly state that it cannot be confirmed.
- If the blueprint contains **conflicting or unclear information**, highlight it and explain the nature of the issue.
- Use accurate construction terminology relevant to the selected category.
- Keep all answers factual, structured, and objective.`,
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
    });

    // Paso 3: Crear un thread con el archivo adjunto
    console.log("[ANALYZE_BLUEPRINT] Creando thread con archivo...");

    // Construir el mensaje completo
    let userMessage = `Category: ${finalCategory}\n\nUser Question: ${prompt}\n\n`;

    userMessage += `Please analyze the attached blueprint and provide your response in the specified format: Main Answer, Discrepancies Found, and Suggested RFIs.`;

    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: userMessage,
          attachments: [
            {
              file_id: uploadedFile.id,
              tools: [{ type: "file_search" }],
            },
          ],
        },
      ],
    });

    // Paso 4: Ejecutar el assistant
    console.log("[ANALYZE_BLUEPRINT] Ejecutando análisis...");
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistant.id,
    });

    console.log("[ANALYZE_BLUEPRINT] Run status:", run.status);

    if (run.status !== "completed") {
      console.error("[ANALYZE_BLUEPRINT] Run failed details:", {
        status: run.status,
        last_error: run.last_error,
        failed_at: run.failed_at,
        expires_at: run.expires_at,
      });

      let errorMessage = `Run falló con estado: ${run.status}`;
      if (run.last_error) {
        errorMessage += ` - Error: ${run.last_error.message} (Code: ${run.last_error.code})`;
      }

      throw new Error(errorMessage);
    }

    // Paso 5: Obtener la respuesta
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(
      (msg) => msg.role === "assistant"
    );

    const result =
      assistantMessage?.content[0]?.type === "text"
        ? assistantMessage.content[0].text.value
        : "Sin respuesta";

    console.log("[ANALYZE_BLUEPRINT] Análisis completado");

    // Limpieza: Eliminar recursos temporales
    try {
      console.log("[ANALYZE_BLUEPRINT] Limpiando recursos...");
      await Promise.all([
        openai.beta.assistants.delete(assistant.id),
        openai.files.delete(uploadedFile.id),
      ]);
      console.log("[ANALYZE_BLUEPRINT] Recursos limpiados exitosamente");
    } catch (cleanupError) {
      console.warn("[ANALYZE_BLUEPRINT] Error en limpieza:", cleanupError);
      // No fallar por errores de limpieza
    }

    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("[ANALYZE_BLUEPRINT_ERROR]:", error);

    // Intentar limpiar recursos en caso de error
    try {
      if (assistant?.id) {
        await openai.beta.assistants.delete(assistant.id);
      }
      if (uploadedFile?.id) {
        await openai.files.delete(uploadedFile.id);
      }
    } catch (cleanupError) {
      console.warn(
        "[ANALYZE_BLUEPRINT] Error limpiando recursos tras fallo:",
        cleanupError
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Error interno del servidor";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
