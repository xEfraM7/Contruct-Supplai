import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    const finalCategory = category || "General";

    // Paso 1: Subir el archivo a OpenAI
    console.log("[ANALYZE_BLUEPRINT] Subiendo PDF a OpenAI...");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileToUpload = new File([buffer], file.name, {
      type: "application/pdf",
    });

    const uploadedFile = await openai.files.create({
      file: fileToUpload,
      purpose: "assistants",
    });

    console.log("[ANALYZE_BLUEPRINT] Archivo subido, ID:", uploadedFile.id);

    // Paso 2: Crear un assistant con file_search
    console.log("[ANALYZE_BLUEPRINT] Creando assistant...");
    const assistant = await openai.beta.assistants.create({
      name: "Blueprint Analyzer",
      instructions: `You are an expert construction engineer specialized in the technical analysis of architectural and construction blueprints.

Your task is to analyze blueprint images and detect architectural and construction elements such as:
- Roofing systems
- Electrical layouts
- Wall structures
- Door placements
- Annotations or embedded text

For every blueprint input, provide a technical analysis structured in exactly the following 3 sections:

## LO SOLICITADO
Briefly describe what was requested to be analyzed and summarize your main findings, including the identified components relevant to the request.

## DISCREPANCIES
List all technical discrepancies, inconsistencies, or potential design conflicts detected in the blueprint. This may include misalignments, missing symbols, non-compliance with standard construction norms, or ambiguous annotations.

## RFIs
Generate a list of Requests for Information (RFIs) required to clarify uncertainties, missing details, or conflicting elements. Each RFI should be clearly numbered and phrased as a direct question to the design team or architect.

Make sure your output uses concise engineering language, and include relevant technical terminology where appropriate. Maintain this format strictly for every analysis.`,
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
    });

    // Paso 3: Crear un thread con el archivo adjunto
    console.log("[ANALYZE_BLUEPRINT] Creando thread con archivo...");
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: `Category: ${finalCategory}\n\n${prompt}\n\nAnalyze the attached blueprint and provide your response in the 3 specified sections: LO SOLICITADO, DISCREPANCIES, and RFIs.`,
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

    if (run.status !== "completed") {
      throw new Error(`Run falló con estado: ${run.status}`);
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
      await openai.beta.assistants.delete(assistant.id);
      await openai.files.delete(uploadedFile.id);
      console.log("[ANALYZE_BLUEPRINT] Recursos limpiados");
    } catch (cleanupError) {
      console.warn("[ANALYZE_BLUEPRINT] Error en limpieza:", cleanupError);
    }

    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("[ANALYZE_BLUEPRINT_ERROR]:", error);
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
