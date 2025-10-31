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
        .select("name, tag, category, status, location, value, quantity")
        .eq("user_id", user.id)
        .order("category", { ascending: true });

      if (equipment && equipment.length > 0) {
        equipmentContext = `\n\n## AVAILABLE PRODUCTS INVENTORY\n\nThe user has the following products available in their inventory:\n\n`;

        interface EquipmentItem {
          name: string;
          tag: string;
          category: string;
          status: string;
          location: string | null;
          value: number;
          quantity: number | null;
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
          items.forEach((item) => {
            const formattedValue = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(item.value);

            equipmentContext += `- ${item.name} (${item.tag}) - Status: ${item.status}`;
            if (item.location) {
              equipmentContext += ` - Location: ${item.location}`;
            }
            equipmentContext += ` - Quantity: ${
              item.quantity ?? "N/A"
            } - Value: ${formattedValue}\n`;
          });
          equipmentContext += `\n`;
        }

        equipmentContext += `\nWhen analyzing the blueprint, consider this inventory to:\n`;
        equipmentContext += `- Recommend products from inventory based on detected components\n`;
        equipmentContext += `- Detect missing or insufficient items\n`;
        equipmentContext += `- Flag items that are checked out or unavailable\n\n`;
      }
    }

    // Subir PDF a OpenAI
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

    // Crear Assistant
    console.log("[ANALYZE_BLUEPRINT] Creando assistant...");
    const assistant = await openai.beta.assistants.create({
      name: "Construction Plan Review & Estimation Assistant",
      instructions: `
You are a senior construction plan review expert with experience in analyzing architectural, structural, and MEP drawings. You will receive:

1. A construction plan in PDF format  
2. A technical question from the user  
3. An equipment and materials inventory (with name, tag, category, status, quantity, value)

---

CRITICAL: You MUST respond using EXACTLY these section headers (case-sensitive, no variations):

## TAKEOFF

Summarize the key construction elements detected in the plan.
- Group all detected components by job category (e.g., Electrical, Plumbing)
- List quantities and specifications for each element
- Include location details (e.g., Toilet Rooms, Kitchen, etc.)

Example format:
- **Toilet Rooms**: 2 units required
- **Kitchen**: 1 unit required

Then create a detailed cost table using equipment from the inventory:

| Item | Unit Cost | Quantity | Total Cost |
|------|-----------|----------|------------|
| Generator 7500W (EQ-070) | $2,200 | 1 | $2,200 |
| Air Compressor (EQ-045) | $850 | 2 | $1,700 |

**Total Cost for Available:** 2 x $2,200 = $3,900

For each item in the table:
- Use format: Equipment Name (TAG)
- Show exact costs from inventory
- Include quantity and total cost
- Use only equipment from the provided inventory

---

## DISCREPANCIES

List all drawing issues or technical inconsistencies found in the blueprint.

If there are NO discrepancies, you MUST write: "No discrepancies detected."

If there ARE discrepancies, list them as:
- Misalignments, missing dimensions, annotation issues
- Structural vs. MEP conflicts
- Ambiguities that prevent proper execution
- Equipment availability conflicts

---

## RFIs

Generate formal Requests for Information to clarify missing or ambiguous information.

If there are NO RFIs needed, you MUST write: "No RFIs required."

If RFIs are needed, number each clearly:
- RFI-01: [Description]
- RFI-02: [Description]

---

### CRITICAL RULES:

1. Use EXACTLY these headers: ## TAKEOFF, ## DISCREPANCIES, ## RFIs
2. Do NOT add numbers before headers (e.g., "1. TAKEOFF" is WRONG)
3. Do NOT use alternative names (e.g., "LO SOLICITADO" is WRONG)
4. Always include the cost table in the TAKEOFF section
5. Never guess or invent missing information
6. If no discrepancies exist, explicitly state "No discrepancies detected"
7. If no RFIs needed, explicitly state "No RFIs required"
  `,
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
    });

    // Crear Thread y mensaje
    console.log("[ANALYZE_BLUEPRINT] Creando thread...");

    let userMessage = ``;
    userMessage += `AREA OF FOCUS: ${finalCategory}\n\n`;
    userMessage += `USER QUESTION: ${prompt}\n\n`;

    if (equipmentContext) {
      userMessage += `${equipmentContext}\n`;
      userMessage += `IMPORTANT: Use only this inventory to reference cost and availability of materials.\n\n`;
    }

    userMessage += `Please analyze the attached construction plan PDF. Follow the structured output with:\n\n
1. TAKEOFF  
2. TECHNICAL RESPONSE  
3. MATERIAL COST ESTIMATION  
4. DISCREPANCIES  
5. RFIs  
6. BUDGET SUMMARY\n\n
Use engineering judgment but do not guess or assume anything not visible in the plan or inventory.\n`;

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

    // Ejecutar el análisis
    console.log("[ANALYZE_BLUEPRINT] Ejecutando análisis...");
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistant.id,
    });

    if (run.status !== "completed") {
      throw new Error(`Run falló con estado: ${run.status}`);
    }

    // Obtener resultado
    const messagesList = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messagesList.data.find(
      (msg) => msg.role === "assistant"
    );

    let result = "Sin respuesta generada.";

    if (assistantMessage?.content[0]?.type === "text") {
      result = assistantMessage.content[0].text.value;
    } else {
      console.warn("[ANALYZE_BLUEPRINT] Respuesta sin contenido de texto.");
    }

    // Paso 1: Ver respuesta cruda
    console.log("[OPENAI RAW RESPONSE]");
    console.log(JSON.stringify(messagesList.data, null, 2));

    // Paso 2: Ver resultado final que irá al frontend
    console.log("[AI FINAL RESULT]");
    console.log(result);

    console.log("[ANALYZE_BLUEPRINT] Análisis completado.");

    // Limpieza
    try {
      await openai.beta.assistants.delete(assistant.id);
      await openai.files.delete(uploadedFile.id);
      console.log("[ANALYZE_BLUEPRINT] Recursos eliminados.");
    } catch (cleanupError) {
      console.warn(
        "[ANALYZE_BLUEPRINT] Error al limpiar recursos:",
        cleanupError
      );
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
