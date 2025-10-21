"use server";


import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { convertPdfToImages } from "../pdf-to-img";
import { openai } from "../openAI";
import { db } from "../db";

type AnalyzeProps = {
  file: File;
  prompt: string;
  category: string;
};

export async function analyzeBlueprint({ file, prompt, category }: AnalyzeProps) {
  try {
    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Guardar temporalmente en disco
    const filePath = join(tmpdir(), `upload-${Date.now()}.pdf`);
    await writeFile(filePath, buffer);

    // Convertir PDF a imágenes base64
    const images = await convertPdfToImages(buffer);

    // Preparar prompt para Vision
    const messages: any[] = [
      {
        role: "system",
        content:
          "Eres un experto en construcción encargado de revisar planos. Analiza el plano visual y responde con base en el contexto.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Categoría del trabajo: ${category}\n\nPrompt: ${prompt}\n\nAnaliza las imágenes adjuntas del plano y responde:\n1. Respuesta al prompt.\n2. Discrepancias detectadas.\n3. Cualquier RFI necesario.`,
          },
          ...images.slice(0, 3).map((img) => ({
            type: "image_url",
            image_url: { url: img },
          })),
        ],
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages,
      max_tokens: 2000,
    });

    const result = completion.choices[0].message.content || "Sin respuesta";

    // Guardar en DB sin userId
    await db.blueprintAnalysis.create({
      data: {
        userId: "dev-user", // Temporal
        category,
        prompt,
        result,
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al analizar el plano",
    };
  }
}

export async function getAllBlueprintAnalyses() {
  try {
    const analyses = await db.blueprintAnalysis.findMany({
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: analyses,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al obtener análisis",
    };
  }
}
