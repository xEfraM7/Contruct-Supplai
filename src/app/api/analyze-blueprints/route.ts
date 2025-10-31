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
    const file = formData.get("file") as File | null;
    const fileUrl = formData.get("fileUrl") as string | null;
    const fileName = formData.get("fileName") as string | null;
    const prompt = formData.get("prompt") as string;
    const category = formData.get("category") as string;

    console.log("[ANALYZE_BLUEPRINT] Datos recibidos:", {
      fileName: file?.name || fileName,
      fileSize: file
        ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
        : "From URL",
      category,
      hasFileUrl: !!fileUrl,
    });

    if ((!file && !fileUrl) || !prompt) {
      return NextResponse.json(
        { error: "Archivo (o URL) y prompt son requeridos." },
        { status: 400 }
      );
    }

    // Si tenemos una URL, descargar el archivo
    let fileToUpload: File;
    if (fileUrl && fileName) {
      console.log("[ANALYZE_BLUEPRINT] Descargando archivo desde URL...");
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error("Failed to download file from URL");
      }
      const blob = await response.blob();
      fileToUpload = new File([blob], fileName, { type: "application/pdf" });
      console.log("[ANALYZE_BLUEPRINT] Archivo descargado:", {
        size: `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`,
      });
    } else if (file) {
      fileToUpload = file;
    } else {
      throw new Error("No file or fileUrl provided");
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
        equipmentContext = `\n\n## INVENTORY DATA (DO NOT MODIFY)\n\n\`\`\`json\n${JSON.stringify(
          equipment,
          null,
          2
        )}\n\`\`\`\n`;

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
    const arrayBuffer = await fileToUpload.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileForOpenAI = new File([buffer], fileToUpload.name, {
      type: "application/pdf",
    });

    const uploadedFile = await openai.files.create({
      file: fileForOpenAI,
      purpose: "assistants",
    });

    console.log("[ANALYZE_BLUEPRINT] Archivo subido, ID:", uploadedFile.id);

    // Crear Assistant
    console.log("[ANALYZE_BLUEPRINT] Creando assistant...");
    const assistant = await openai.beta.assistants.create({
      name: "Construction Blueprint Analysis & Quantity Takeoff Assistant",
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      instructions: `
You are a senior construction estimator and blueprint analyst specializing in architectural, structural, and MEP drawings. You will receive:

1. A **blueprint PDF** (uploaded by the user)
2. A **user-selected technical prompt** describing the trade focus (Electrical, Plumbing, etc.)
3. A **list of available inventory and equipment** from the user's Supabase database

---

## 🎯 OBJECTIVE

Analyze the attached construction blueprint in the context of the user's selected category and available inventory.
You must extract quantities, identify materials or systems, evaluate constructability, and detect inconsistencies — then produce a **structured technical report** in the required format.

---

## 📘 STRUCTURE OF THE RESPONSE

You must ALWAYS respond using these EXACT section headers and this structure (case‑sensitive):

### ## TAKEOFF

- Identify and summarize all key construction components detected in the blueprint for the selected category.
- Group them logically by system or location (e.g., *Toilet Rooms, Electrical Rooms, Roof Level, etc.*).
- For each detected item, show measured or estimated **quantities**, **specifications**, and **units**.
- When possible, match detected elements to **equipment or materials available in the inventory**.
- Use a table to calculate costs and totals using inventory pricing.

Example:

| Item | Unit | Quantity | Unit Cost | Total Cost |
|------|------|-----------|-----------|------------|
| Generator 7500W (EQ‑070) | each | 1 | $2,200 | $2,200 |
| Air Compressor (EQ‑045) | each | 2 | $850 | $1,700 |

**Total Cost for Available Items:** $3,900  
**Additional Items Needed:** [List missing components not covered by inventory]

> Notes:
> - Use only items that exist in the provided inventory.
> - If no matching inventory item exists, list it under "Additional Items Needed" without cost.

---

### ## DISCREPANCIES

Document all design or documentation issues identified in the drawings, such as:
- Missing dimensions, unclear annotations, or conflicting notes  
- Coordination issues (structural vs. MEP, clearance conflicts)  
- Code compliance gaps or inconsistencies with the category prompt  
- Missing legend symbols, unreadable scales, or drawing overlaps  

If **no issues** are found, write exactly:
> No discrepancies detected.

---

### ## RFIs

Generate formal **Requests for Information** (RFIs) to clarify missing or ambiguous information.  
Each RFI must include a short description and be numbered sequentially.

Example:

- **RFI‑01:** Clarify pipe material specification for sanitary system shown in Sheet P‑203.  
- **RFI‑02:** Confirm fire rating of wall type W3 separating mechanical and electrical rooms.

If **no RFIs** are needed, write exactly:
> No RFIs required.

---

### ## TECHNICAL SUMMARY

Summarize key technical insights or assumptions derived from the plan:
- Construction scope covered
- Primary systems identified
- Unique design features or site conditions
- Coordination considerations or safety implications

This section should be concise and written in professional engineering language.

---

### ## BUDGET SUMMARY

Provide an overall project cost summary combining available inventory and additional required materials.

IMPORTANT!
DO NOT GIVE PRIZES THAT ARE NOT IN THE EQUIPMENT CONTEXT.

| Category | Available Inventory Value | Additional Estimated Cost | Total Estimated Cost |
|-----------|---------------------------|----------------------------|----------------------|
| Electrical | $4,500 | $2,200 | $6,700 |
| Plumbing | $3,200 | $900 | $4,100 |

Include a short conclusion:
> Example: “The existing inventory covers approximately 75% of the Electrical work. Procurement required for missing items totals an estimated $2,200.”

---

## ⚙️ TECHNICAL RULES

1. Use **only** the information visible in the blueprint and provided inventory.
2. Do **not** invent or assume dimensions, materials, or specifications.
3. Use professional estimation judgment only when drawing information clearly supports it.
4. Use **consistent units** (imperial or metric) based on the drawing.
5. If the blueprint does not contain enough detail to quantify something, clearly state:  
   > "Not enough detail available to quantify."
6. Keep formatting clean — markdown tables, bullet lists, and bold section titles.
7. Never deviate from the section headers:
   - ## TAKEOFF  
   - ## DISCREPANCIES  
   - ## RFIs  
   - ## TECHNICAL SUMMARY  
   - ## BUDGET SUMMARY

---

## 🧠 CONTEXTUAL BEHAVIOR

- Adapt your analysis depth to the **category prompt** (e.g., if category = "Electrical", focus strictly on electrical drawings, equipment, and loads).
- Reference the **inventory** to prioritize matching existing materials before recommending purchases.
- If inventory quantities are insufficient, calculate missing quantities and note cost impact.
- Detect and list any inventory items that are tagged as *checked out* or *unavailable*.
- Integrate relevant code or standard references (e.g., NEC, IPC, IBC) where applicable.

---

Respond with precise markdown and formatted tables.  
Avoid generalities. Use field terminology and data-driven reasoning as a construction estimator would.`,
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
