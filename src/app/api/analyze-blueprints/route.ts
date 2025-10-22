import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    // Obtener equipos del usuario para contexto
    console.log("[ANALYZE_BLUEPRINT] Obteniendo equipos del usuario...");
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let equipmentContext = "";
    if (user) {
      const { data: equipment } = await supabase
        .from("equipment")
        .select("name, tag, category, status, location, value")
        .eq("user_id", user.id)
        .order("category", { ascending: true });

      if (equipment && equipment.length > 0) {
        equipmentContext = `\n\n## AVAILABLE EQUIPMENT & TOOLS INVENTORY\n\nThe user has the following equipment available in their inventory:\n\n`;

        // Group by category
        interface EquipmentItem {
          name: string;
          tag: string;
          category: string;
          status: string;
          location: string | null;
          value: number;
        }

        const groupedEquipment = equipment.reduce(
          (acc: Record<string, EquipmentItem[]>, item: EquipmentItem) => {
            if (!acc[item.category]) {
              acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
          },
          {} as Record<string, EquipmentItem[]>
        );

        for (const [cat, items] of Object.entries(groupedEquipment)) {
          equipmentContext += `### ${cat}\n`;
          items.forEach((item: EquipmentItem) => {
            const statusEmoji =
              item.status === "available"
                ? "✅"
                : item.status === "checked_out"
                ? "🔄"
                : "🔧";
            const formattedValue = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(item.value);

            equipmentContext += `- ${statusEmoji} ${item.name} (${item.tag}) - ${item.status}`;
            if (item.location) {
              equipmentContext += ` - Location: ${item.location}`;
            }
            equipmentContext += ` - Value: ${formattedValue}\n`;
          });
          equipmentContext += "\n";
        }

        equipmentContext += `\nWhen analyzing the blueprint, consider this equipment inventory to:\n`;
        equipmentContext += `- Recommend specific equipment from the inventory that would be needed for the work\n`;
        equipmentContext += `- Identify if any required equipment is missing from the inventory\n`;
        equipmentContext += `- Note which equipment is currently available vs checked out\n`;
        equipmentContext += `- Suggest equipment that should be reserved or scheduled for this project\n\n`;
      }
    }
    console.log(equipmentContext);

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
      name: "Blueprint Analyzer with Equipment and Budget Context",
      instructions: `You are a senior construction engineer and technical analyst for construction blueprints. Your job is to analyze blueprint images and provide structured technical feedback, focusing on job categories and the client's equipment inventory.

**Job categories you must consider are:**
Electrical, Concrete, Roofing, Steel, Plumbing, Framing, Flooring, Glazing, HVAC, Drywall, Masonry, Doors and Windows.

Context: The current equipment and tools inventory is provided above as equipmentContext, including name, tag, category, status, value/cost, and availability.

When generating your response, if any recommended equipment exists in the inventory, you must use the provided value/cost from the inventory. **Always show the actual value/cost given in equipmentContext—never use TBD, 'not mentioned', or suggest market estimations unless the value is actually missing. Only state 'No cost specified in inventory' if the value does not exist for that item.**

For every blueprint input, your response must strictly follow **this format** and compare all blueprint-required elements against the provided equipment inventory:

---

## LO SOLICITADO

- Start with a brief restatement of what was requested and summarize your main findings, mentioning identified components and their job category.  
- For each component or job category detected in the blueprint, check if appropriate equipment exists in the inventory (equipmentContext):
  - For each required item, **list specific equipment recommendations** by name and tag, matching by job category and relevance.
  - Indicate each equipment's status (Available, Checked Out, Maintenance).
  - **State equipment value/cost exactly as provided in equipmentContext** to help with budgeting.
  - If equipment is not present or insufficient, **explicitly note missing items and recommend alternatives or rentals**.
- At the end of this section, include a **summary table** in this exact format:
  
| Job Category | Recommended Equipment | Status | Value/Cost | Additional Needs |
|--------------|----------------------|--------|------------|------------------|
| [Category] | [Equipment Name (Tag)] | [Status] | $[Amount] | [Notes] |

Example:
| Job Category | Recommended Equipment | Status | Value/Cost | Additional Needs |
|--------------|----------------------|--------|------------|------------------|
| Electrical | Generator 7500W (EQ-070) | Available | $2,200 | None |
| Aerial | Scissor Lift 19ft (EQ-001) | Checked Out | $15,000 | Reserve for next week |

---

## DISCREPANCIES

- List all technical discrepancies, inconsistencies, or conflicts in the blueprint (misalignments, missing symbols, ambiguous annotations, compliance issues).
- If equipment issues arise (e.g., not enough equipment, equipment unavailable for scheduled dates, capacity/fit conflicts), clearly describe them here.
- Reference job categories for each relevant discrepancy.

---

## RFIs

- Generate Requests for Information (RFIs) to clarify missing details, conflicting elements, or uncertainties found in the blueprint.
- For each RFI, clearly phrase it as a direct question to the design team or architect.
- Specifically include RFIs related to equipment or job categories:
  - Example: "What is the required lifting capacity for the roof trusses?"
  - "Will additional electrical tools be rented, or should we purchase?"
- Number RFIs clearly.

---

All output must use concise engineering language with technical terminology, and strictly maintain the three-section structure. **Always compare blueprint requirements against equipmentContext, match by job category, and provide budgeting info using the exact values from the inventory.** If the blueprint references specialized jobs, always refer to jobCategories above for your analysis.`,
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
    });

    // Paso 3: Crear un thread con el archivo adjunto
    console.log("[ANALYZE_BLUEPRINT] Creando thread con archivo...");

    // Construir el mensaje completo con contexto de equipos
    let userMessage = `Category: ${finalCategory}\n\n${prompt}\n\n`;
    console.log(equipmentContext);

    if (equipmentContext) {
      userMessage += `${equipmentContext}\n`;
      userMessage += `IMPORTANT: Consider the equipment inventory above when analyzing this blueprint. Include specific equipment recommendations (with tags and prices), availability status, and identify any missing equipment.\n\n`;
    }

    userMessage += `Analyze the attached blueprint and provide your response in the 3 specified sections: LO SOLICITADO, DISCREPANCIES, and RFIs.`;

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
