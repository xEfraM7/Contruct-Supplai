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

      console.log("[INVENTORY_CHECK] Equipment data:", JSON.stringify(equipment, null, 2));
      console.log("[INVENTORY_CHECK] Equipment count:", equipment?.length || 0);

      if (equipment && equipment.length > 0) {
        equipmentContext = `\n\n## INVENTORY DATA (JSON Format)\n\n\`\`\`json\n${JSON.stringify(
          equipment,
          null,
          2
        )}\n\`\`\`\n\nUse this inventory for item matching and cost referencing.\n`;
      } else {
        equipmentContext = `\n\n## INVENTORY STATUS\n\n**⚠️ NO INVENTORY AVAILABLE**\n\nThe user has 0 items in their equipment inventory.\n\n**CRITICAL INSTRUCTIONS FOR EMPTY INVENTORY:**\n\n1. **DO NOT include any prices or costs in the TAKEOFF table**\n2. **DO NOT create cost estimates or dollar amounts**\n3. **DO NOT invent, assume, or estimate any prices**\n4. Format the TAKEOFF table as:\n   | Item | Unit | Quantity | Unit Cost | Total Cost |\n   |------|------|----------|-----------|------------|\n   | [Item name] | [unit] | [qty] | N/A | N/A |\n\n5. In the BUDGET SUMMARY section, state:\n   "**Cannot provide cost estimates** - No inventory data available. Please add equipment to your inventory before requesting cost analysis."\n\n6. Focus on:\n   - Identifying required items and quantities\n   - Technical specifications\n   - Material types and standards\n   - Installation requirements\n\n7. **NEVER use example prices, market estimates, or placeholder costs**\n\n`;
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Crear Vector Store y agregar archivo
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("[ANALYZE_BLUEPRINT] Creando vector store...");
    
    // Paso 1: Crear vector store vacío
    const vectorStore = await openai.vectorStores.create({
      name: `Blueprint Analysis - ${fileName}`,
    });

    console.log("[ANALYZE_BLUEPRINT] Vector store creado:", vectorStore.id);

    // Paso 2: Agregar el archivo al vector store
    console.log("[ANALYZE_BLUEPRINT] Agregando archivo al vector store...");
    await openai.vectorStores.files.create(vectorStore.id, {
      file_id: uploadedFile.id,
    });

    // Paso 3: Esperar a que el archivo se indexe
    console.log("[ANALYZE_BLUEPRINT] Esperando indexación del archivo...");
    
    // Esperar un poco antes del primer retrieve para dar tiempo a que se asocie
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    let fileStatus = await openai.vectorStores.files.retrieve(uploadedFile.id, {
      vector_store_id: vectorStore.id,
    });

    // Polling para esperar que se complete la indexación
    let attempts = 0;
    const maxAttempts = 60; // Aumentado a 60 segundos para PDFs grandes
    while (fileStatus.status !== "completed" && attempts < maxAttempts) {
      if (fileStatus.status === "failed") {
        throw new Error(`File indexing failed: ${fileStatus.last_error?.message || "Unknown error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      fileStatus = await openai.vectorStores.files.retrieve(uploadedFile.id, {
        vector_store_id: vectorStore.id,
      });
      attempts++;
      console.log(`[ANALYZE_BLUEPRINT] File status: ${fileStatus.status} (attempt ${attempts}/${maxAttempts})`);
    }

    if (fileStatus.status !== "completed") {
      throw new Error("File indexing timeout - the file is taking too long to process");
    }

    console.log("[ANALYZE_BLUEPRINT] Archivo indexado correctamente.");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Construir el prompt completo
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const systemInstructions = `You are a senior construction estimator and blueprint analyst specializing in architectural, structural, and MEP drawings.

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

**CRITICAL: This section must ONLY contain numbered RFI questions. DO NOT include any other content, explanations, or sections here.**

Generate numbered Requests for Information for ambiguous details:
- **RFI-01:** [Specific question about unclear detail]
- **RFI-02:** [Specific question about missing information]
- **RFI-03:** [Another specific question]

**FORMAT RULES:**
1. Each RFI must be on its own line starting with "- **RFI-XX:**"
2. Keep questions concise and specific
3. DO NOT add subsections, explanations, or additional content after the RFIs
4. DO NOT include "TECHNICAL SUMMARY" or any other section content here
5. End this section immediately after the last RFI

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
8. **SECTION SEPARATION:** Each section must be completely independent. NEVER mix content from different sections
9. **RFI SECTION PURITY:** The RFIs section must ONLY contain RFI questions (RFI-01, RFI-02, etc.). Do NOT include TECHNICAL SUMMARY, BUDGET SUMMARY, or any other section content within the RFIs section
10. **SECTION BOUNDARIES:** Always use "---" to separate sections and start each new section with its exact header (## SECTION NAME)

## 🧠 CONTEXTUAL BEHAVIOR

- Focus analysis on the specified category (Electrical, Plumbing, etc.)
- Prioritize matching existing inventory items before listing additional needs
- Reference inventory quantities and check availability status
- Apply relevant code standards (NEC, IPC, IBC) where applicable
- Use field terminology and data-driven reasoning`;

    let userMessage = `AREA OF FOCUS: ${finalCategory}\n\n`;
    userMessage += `USER QUESTION: ${prompt}\n\n`;

    if (equipmentContext) {
      userMessage += `${equipmentContext}\n`;
      if (equipmentContext.includes("NO INVENTORY AVAILABLE")) {
        userMessage += `⚠️ CRITICAL: Since inventory is empty, DO NOT provide any cost estimates or prices. List items with "N/A" for costs.\n\n`;
      } else {
        userMessage += `IMPORTANT: Use only this inventory to reference cost and availability of materials.\n\n`;
      }
    }

    userMessage += `Please analyze the attached construction plan PDF. Follow the structured output with all required sections.

**CRITICAL FORMAT REQUIREMENT:**
Each section must be completely separate. The RFIs section must ONLY contain RFI questions like this:

## RFIs

- **RFI-01:** [Question about unclear detail]
- **RFI-02:** [Question about missing information]
- **RFI-03:** [Another question]

---

## TECHNICAL SUMMARY

[Technical content goes here - NOT in the RFIs section]

DO NOT mix sections. DO NOT include TECHNICAL SUMMARY or BUDGET SUMMARY content inside the RFIs section.

Use engineering judgment but do not guess or assume anything not visible in the plan or inventory.
`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LOG COMPLETO DEL PROMPT ENVIADO A OPENAI
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("\n");
    console.log("╔" + "═".repeat(78) + "╗");
    console.log("║" + " ".repeat(20) + "COMPLETE PROMPT TO OPENAI" + " ".repeat(33) + "║");
    console.log("╚" + "═".repeat(78) + "╝");
    console.log("\n");
    
    console.log("┌─ SYSTEM INSTRUCTIONS ─────────────────────────────────────────────────┐");
    console.log(systemInstructions);
    console.log("└────────────────────────────────────────────────────────────────────────┘");
    console.log("\n");
    
    console.log("┌─ USER MESSAGE ─────────────────────────────────────────────────────────┐");
    console.log(userMessage);
    console.log("└────────────────────────────────────────────────────────────────────────┘");
    console.log("\n");
    
    console.log("┌─ ATTACHED FILE ────────────────────────────────────────────────────────┐");
    console.log(`File ID: ${uploadedFile.id}`);
    console.log(`File Name: ${fileName}`);
    console.log(`Vector Store ID: ${vectorStore.id}`);
    console.log("└────────────────────────────────────────────────────────────────────────┘");
    console.log("\n");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Usar Responses API
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("[ANALYZE_BLUEPRINT] Ejecutando análisis con Responses API...");
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiResponse = await (openai as any).responses.create({
      model: "gpt-5",
      instructions: systemInstructions,
      input: userMessage,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [vectorStore.id],
        },
      ],
      store: false,
    });

    console.log("[ANALYZE_BLUEPRINT] Respuesta recibida.");

    // Extraer el texto de la respuesta
    let result = "Sin respuesta generada.";

    if (apiResponse.output && Array.isArray(apiResponse.output)) {
      const messageOutput = apiResponse.output.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => item.type === "message"
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((messageOutput as any)?.content && Array.isArray((messageOutput as any).content)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textContent = (messageOutput as any).content.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => item.type === "output_text"
        );
        
        if (textContent?.text) {
          result = textContent.text;
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LOG DE LA RESPUESTA DE OPENAI
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("\n");
    console.log("╔" + "═".repeat(78) + "╗");
    console.log("║" + " ".repeat(20) + "OPENAI RESPONSE RECEIVED" + " ".repeat(34) + "║");
    console.log("╚" + "═".repeat(78) + "╝");
    console.log("\n");

    if (result === "Sin respuesta generada.") {
      console.error("┌─ ERROR: NO TEXT EXTRACTED ────────────────────────────────────────────┐");
      console.error("[API_RESPONSE_STRUCTURE]", JSON.stringify(apiResponse, null, 2));
      console.error("└────────────────────────────────────────────────────────────────────────┘");
    } else {
      console.log("┌─ RAW API RESPONSE (JSON) ──────────────────────────────────────────────┐");
      console.log(JSON.stringify(apiResponse, null, 2));
      console.log("└────────────────────────────────────────────────────────────────────────┘");
      console.log("\n");
      
      console.log("┌─ EXTRACTED TEXT RESULT ────────────────────────────────────────────────┐");
      console.log(result);
      console.log("└────────────────────────────────────────────────────────────────────────┘");
      console.log("\n");
      
      // Log de estadísticas
      const resultLength = result.length;
      const sections = {
        takeoff: result.includes("## TAKEOFF"),
        discrepancies: result.includes("## DISCREPANCIES"),
        rfis: result.includes("## RFIs"),
        technical: result.includes("## TECHNICAL SUMMARY"),
        budget: result.includes("## BUDGET SUMMARY"),
      };
      
      console.log("┌─ RESPONSE STATISTICS ──────────────────────────────────────────────────┐");
      console.log(`Total characters: ${resultLength}`);
      console.log(`Sections found:`);
      console.log(`  ✓ TAKEOFF: ${sections.takeoff ? "YES" : "NO"}`);
      console.log(`  ✓ DISCREPANCIES: ${sections.discrepancies ? "YES" : "NO"}`);
      console.log(`  ✓ RFIs: ${sections.rfis ? "YES" : "NO"}`);
      console.log(`  ✓ TECHNICAL SUMMARY: ${sections.technical ? "YES" : "NO"}`);
      console.log(`  ✓ BUDGET SUMMARY: ${sections.budget ? "YES" : "NO"}`);
      console.log("└────────────────────────────────────────────────────────────────────────┘");
    }

    console.log("\n[ANALYZE_BLUEPRINT] Análisis completado.\n");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Limpieza de recursos
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      await openai.vectorStores.delete(vectorStore.id);
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
