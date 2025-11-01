import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openAI";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log("[ANALYZE_BLUEPRINT] Iniciando análisis...");

    const body = await req.json();
    const { fileUrl, fileName, prompt, category } = body;

    console.log("[ANALYZE_BLUEPRINT] Datos recibidos:", {
      fileName,
      fileUrl: fileUrl ? "Provided" : "Missing",
      category,
    });

    if (!fileUrl || !fileName || !prompt) {
      return NextResponse.json(
        { error: "fileUrl, fileName y prompt son requeridos." },
        { status: 400 }
      );
    }

    // Descargar el archivo desde Supabase Storage
    console.log("[ANALYZE_BLUEPRINT] Descargando archivo desde Supabase...");
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error("Failed to download file from Supabase Storage");
    }
    const blob = await response.blob();
    const fileToUpload = new File([blob], fileName, {
      type: "application/pdf",
    });
    console.log("[ANALYZE_BLUEPRINT] Archivo descargado:", {
      size: `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`,
    });

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
        equipmentContext = `\n\n## INVENTORY DATA (JSON Format)\n\n\`\`\`json\n${JSON.stringify(
          equipment,
          null,
          2
        )}\n\`\`\`\n\nUse this inventory for item matching and cost referencing.\n`;
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
      name: "Construction Estimator",
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      instructions: `You are a senior construction estimator and blueprint analyst specializing in architectural, structural, and MEP drawings.

## 🎯 OBJECTIVE
Analyze the attached construction blueprint and produce a structured technical report with cost estimation based STRICTLY on the user's inventory.

## 📘 RESPONSE FORMAT

You MUST respond using EXACTLY these section headers in this order:

## TAKEOFF

Provide a brief summary of detected components grouped by location or system, then include this MANDATORY cost table:

| Item | Unit | Quantity | Unit Cost | Total Cost |
|------|------|-----------|-----------|------------|
| [Item name from inventory] | [unit] | [qty] | $[price from inventory] | $[total] |

**CRITICAL RULES FOR THE TABLE:**
1. Use ONLY items and prices from the provided INVENTORY DATA (JSON Format)
2. Match item names EXACTLY as they appear in the inventory JSON
3. Use the "value" field from inventory as Unit Cost
4. If an item is NOT in the inventory, DO NOT include it in this table
5. Calculate Total Cost = Quantity × Unit Cost (from inventory)
6. Include at least 3-5 items from inventory that match the blueprint requirements
7. After the table, add: **Total Cost for Available Items:** $X,XXX

Then list separately:
**Additional Items Needed:** [Items required by blueprint but NOT in inventory - list only, no prices]

---

## DISCREPANCIES

List design or documentation issues found in the drawings:
- Missing dimensions or unclear annotations
- Coordination conflicts (structural vs MEP, clearance issues)
- Code compliance gaps or inconsistencies
- Missing legend symbols or unreadable scales

If none found, write exactly: "No discrepancies detected."

---

## RFIs

Generate numbered Requests for Information for ambiguous details:
- **RFI-01:** [Specific question about unclear detail]
- **RFI-02:** [Specific question about missing information]

If none needed, write exactly: "No RFIs required."

---

## TECHNICAL SUMMARY

Provide concise technical insights in professional engineering language:
- Construction scope covered by the blueprint
- Primary systems identified (electrical, plumbing, HVAC, etc.)
- Unique design features or site conditions
- Coordination considerations or safety implications

---

## BUDGET SUMMARY

Provide cost summary table combining inventory and additional needs:

| Category | Available Inventory Value | Additional Estimated Cost | Total Estimated Cost |
|----------|---------------------------|---------------------------|----------------------|
| [Category name] | $X,XXX | $X,XXX | $X,XXX |

Add a short conclusion about inventory coverage and procurement needs.
Example: "The existing inventory covers approximately X% of the [Category] work. Additional procurement required for items not in inventory."

---

## ⚙️ MANDATORY RULES

1. **PRICES:** Use ONLY prices from the provided inventory JSON - NEVER invent or estimate prices
2. **MATCHING:** Match inventory items by name, category, and specifications to blueprint requirements
3. **NO ASSUMPTIONS:** Do not assume dimensions, materials, or specifications not visible in the blueprint
4. **UNITS:** Use consistent units (imperial/metric) based on the drawing
5. **INSUFFICIENT DETAIL:** If detail is missing, state: "Not enough detail available to quantify"
6. **FORMATTING:** Use clean markdown with proper tables and bullet lists
7. **SECTION HEADERS:** NEVER deviate from the exact section headers listed above

## 🧠 CONTEXTUAL BEHAVIOR

- Focus analysis on the specified category (Electrical, Plumbing, etc.)
- Prioritize matching existing inventory items before listing additional needs
- Reference inventory quantities and check availability status
- Apply relevant code standards (NEC, IPC, IBC) where applicable
- Use field terminology and data-driven reasoning`,
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
