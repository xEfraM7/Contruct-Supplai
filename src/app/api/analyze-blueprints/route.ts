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
            equipmentContext += ` - Quantity: ${item.quantity ?? "N/A"} - Value: ${formattedValue}\n`;
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

Respond using the following exact structure and headers:

---

## TAKEOFF

- Summarize the key construction elements detected in the plan.
- Group all detected components by job category (e.g., Electrical, Plumbing).
- List quantities and specifications for each element.

---

## TECHNICAL RESPONSE

- Provide technical specifications and requirements.
- Reference standards and codes where applicable.
- Detail installation or construction methods.

---

## MATERIAL COST ESTIMATION

Create a detailed cost table using equipment from the inventory:

| Item | Unit Cost | Quantity | Total Cost |
|------|-----------|----------|------------|
| Generator 7500W (EQ-070) | $2,200 | 1 | $2,200 |

**Estimated Total:** $X,XXX

For each item:
- Use actual equipment from inventory with tags
- Show status (Available, Checked Out, Maintenance)
- Use exact costs from inventory
- Flag missing items not in inventory

---

## DISCREPANCIES

- List all drawing issues or technical inconsistencies found in the blueprint:
  - Misalignments, missing dimensions, annotation issues
  - Structural vs. MEP conflicts
  - Ambiguities that prevent proper execution
  - Equipment availability conflicts

---

## RFIs

- Generate formal Requests for Information to clarify:
  - Missing specs, material selections, load capacities, sequencing
  - Any assumption that cannot be safely made

Number each RFI clearly (RFI-01, RFI-02, etc.).

---

## BUDGET SUMMARY

- Total materials cost
- Contingency budget (if applicable)
- Overall project budget estimate

---

### RULES:

- Never guess or invent missing information.  
- Raise RFIs instead of making assumptions.  
- Use only what is in the blueprint and the inventory.  
- Keep language concise and technical for construction field teams.
- Always use the exact section headers shown above.
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
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(
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
console.log(JSON.stringify(messages.data, null, 2));

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
      console.warn("[ANALYZE_BLUEPRINT] Error al limpiar recursos:", cleanupError);
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
        details: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
