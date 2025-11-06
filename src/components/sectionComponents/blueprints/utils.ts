import { AnalysisResult, ExtractedItem } from "./types";

/**
 * Parse the AI analysis result text into structured data
 */
export const parseAnalysisResult = (text: string): AnalysisResult => {
  console.log("[PARSE] Texto completo recibido:", text);

  // Buscar secciones con headers exactos (sin números)
  const requestedMatch = text.match(
    /##\s*TAKEOFF\s*([\s\S]*?)(?=##\s*(?:DISCREPANCIES|RFIs)|$)/i
  );

  const discrepanciesMatch = text.match(
    /##\s*DISCREPANCIES\s*([\s\S]*?)(?=##\s*RFIs|$)/i
  );
  
  // Extraer RFIs y limpiar contenido extra
  const rfisMatch = text.match(/##\s*RFIs\s*([\s\S]*?)(?=##\s*TECHNICAL SUMMARY|##\s*BUDGET SUMMARY|$)/i);
  
  let cleanedRfis = rfisMatch?.[1]?.trim() || "No RFIs required";
  
  // Limpiar la sección de RFIs: solo mantener líneas que empiecen con "- **RFI-"
  if (cleanedRfis && cleanedRfis !== "No RFIs required") {
    const rfiLines = cleanedRfis.split('\n');
    const actualRfis = rfiLines.filter(line => {
      const trimmed = line.trim();
      // Mantener solo líneas que sean RFIs o estén vacías
      return trimmed === '' || 
             trimmed.startsWith('- **RFI-') || 
             trimmed.startsWith('**RFI-') ||
             trimmed.match(/^-?\s*\*\*RFI-\d+:/);
    });
    
    // Si encontramos RFIs válidos, usar solo esos
    if (actualRfis.some(line => line.includes('RFI-'))) {
      cleanedRfis = actualRfis.join('\n').trim();
    }
  }

  // Extraer TECHNICAL SUMMARY
  const technicalSummaryMatch = text.match(
    /##\s*TECHNICAL SUMMARY\s*([\s\S]*?)(?=##\s*BUDGET SUMMARY|##\s*RFIs|$)/i
  );
  const technicalSummary = technicalSummaryMatch?.[1]?.trim() || undefined;

  // Extraer BUDGET SUMMARY
  const budgetSummaryMatch = text.match(
    /##\s*BUDGET SUMMARY\s*([\s\S]*?)$/i
  );
  const budgetSummary = budgetSummaryMatch?.[1]?.trim() || undefined;

  // Extract items from summary table if exists
  const extractedItems: ExtractedItem[] = [];
  const requestedText = requestedMatch?.[1] || "";

  // Find all locations mentioned in the text
  // Look for patterns like "- **Toilet Rooms**: 1 unit required"
  const locationMatches = Array.from(
    requestedText.matchAll(/[-•*]\s*\*\*([^*:]+)\*\*:\s*(\d+)\s*unit/gi)
  );
  const locations = locationMatches.map((m) => ({
    name: m[1].trim(),
    quantity: parseInt(m[2]),
  }));

  // If no specific pattern found, look for room mentions in summary
  if (locations.length === 0) {
    const summaryMatches = Array.from(
      requestedText.matchAll(/[-•*]\s*\*\*([^*:]+)\*\*:/gi)
    );
    summaryMatches.forEach((m) => {
      locations.push({
        name: m[1].trim(),
        quantity: 1,
      });
    });
  }

  // Buscar tabla - soporta múltiples formatos
  // Formato 1: Item | Unit Cost | Quantity | Total Cost
  // Formato 2: Item | Unit | Quantity | Unit Cost | Total Cost
  const tableMatch = requestedText.match(
    /\|\s*Item\s*\|.*?\|\s*Quantity\s*\|.*?\|\s*Total Cost\s*\|([\s\S]*?)(?=\n\n|\*\*|$)/i
  );

  console.log("[PARSE] Tabla encontrada:", !!tableMatch);
  if (tableMatch) {
    console.log("[PARSE] Contenido de tabla:", tableMatch[1]);
  }

  if (tableMatch) {
    const rows = tableMatch[1]
      .split("\n")
      .filter(
        (row) => row.trim() && !row.includes("---") && !row.includes("|--")
      );
    rows.forEach((row, rowIndex) => {
      const cells = row
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);

      let equipmentName: string;
      let equipmentTag: string;
      let cost: number;
      let quantity: number;
      let unit: string = "EA";

      // Detectar formato basado en número de columnas
      if (cells.length === 5) {
        // Formato: Item | Unit | Quantity | Unit Cost | Total Cost
        const itemMatch = cells[0]?.match(/(.+?)\s*\(([^)]+)\)/);
        equipmentName = itemMatch?.[1]?.trim() || cells[0];
        equipmentTag = itemMatch?.[2]?.trim() || "";
        unit = cells[1] || "EA";
        quantity = parseInt(cells[2]) || 1;
        const unitCostMatch = cells[3]?.match(/\$?\s*([0-9,]+(?:\.[0-9]{2})?)/);
        cost = parseFloat(unitCostMatch?.[1]?.replace(/,/g, "") || "0");
      } else if (cells.length === 4) {
        // Formato: Item | Unit Cost | Quantity | Total Cost
        const itemMatch = cells[0]?.match(/(.+?)\s*\(([^)]+)\)/);
        equipmentName = itemMatch?.[1]?.trim() || cells[0];
        equipmentTag = itemMatch?.[2]?.trim() || "";
        const unitCostMatch = cells[1]?.match(/\$?\s*([0-9,]+(?:\.[0-9]{2})?)/);
        cost = parseFloat(unitCostMatch?.[1]?.replace(/,/g, "") || "0");
        quantity = parseInt(cells[2]) || 1;
      } else {
        // Formato no reconocido, saltar esta fila
        return;
      }

      // Determinar confidence: 92% si está en inventario, 85% si no
      const confidence = equipmentTag ? 92 : 85;

      // Create individual items for each location
      if (locations.length > 0) {
        locations.forEach((location, locIndex) => {
          // Generate unique ID combining row index and location index
          const uniqueId = equipmentTag
            ? `${equipmentTag}-${rowIndex}-${locIndex}`
            : `ITEM-${String(rowIndex * 100 + locIndex + 1).padStart(3, "0")}`;

          extractedItems.push({
            itemId: uniqueId,
            csiCode: "",
            description: equipmentName,
            quantity: location.quantity,
            unit,
            unitCost: cost,
            total: cost * location.quantity,
            confidence,
            source: location.name,
          });
        });
      } else {
        // Fallback: create single item
        extractedItems.push({
          itemId:
            equipmentTag || `ITEM-${String(rowIndex + 1).padStart(3, "0")}`,
          csiCode: "",
          description: equipmentName,
          quantity,
          unit,
          unitCost: cost,
          total: cost * quantity,
          confidence,
          source: "Blueprint",
        });
      }
    });
  }

  // Extract total costs from AI response
  let totalCostAvailable = 0;
  let totalCostNeeded = 0;
  let availableItemsCount = 0;
  let neededItemsCount = 0;

  // Look for "Total Cost for Available" pattern
  const totalCostMatch = requestedText.match(
    /Total Cost for Available:\s*(\d+)\s*x\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*=\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  );
  if (totalCostMatch) {
    availableItemsCount = parseInt(totalCostMatch[1]);
    totalCostAvailable = parseFloat(totalCostMatch[3].replace(/,/g, ""));
  }

  // Calculate needed items from extractedItems
  if (extractedItems.length > 0) {
    neededItemsCount = extractedItems.filter(
      (item) => item.confidence < 90
    ).length;
    totalCostNeeded = extractedItems
      .filter((item) => item.confidence < 90)
      .reduce((sum, item) => sum + item.total, 0);

    // If we didn't find the total from text, calculate from available items
    if (totalCostAvailable === 0) {
      availableItemsCount = extractedItems.filter(
        (item) => item.confidence >= 90
      ).length;
      totalCostAvailable = extractedItems
        .filter((item) => item.confidence >= 90)
        .reduce((sum, item) => sum + item.total, 0);
    }
  }

  // Count discrepancies
  const discrepancyText = discrepanciesMatch?.[1]?.trim() || "";

  // Check if AI explicitly says there are no discrepancies
  const noDiscrepanciesPatterns = [
    /no discrepancies/i,
    /there are no discrepancies/i,
    /no conflicts/i,
    /no issues/i,
    /no problems/i,
    /everything matches/i,
    /all requirements are met/i,
    /blueprint matches/i,
    /inventory matches/i,
  ];

  const hasNoDiscrepancies = noDiscrepanciesPatterns.some((pattern) =>
    pattern.test(discrepancyText)
  );

  // Only count actual discrepancy items if AI doesn't explicitly say there are none
  const discrepancyCount = hasNoDiscrepancies
    ? 0
    : discrepancyText
        .split("\n")
        .filter(
          (line) =>
            line.trim().match(/^[-•*]\s/) || line.trim().match(/^\d+\./)
        ).length;

  // Usar solo la sección TAKEOFF para "requested"
  const requestedContent = requestedMatch?.[1]?.trim() || "Not available";

  console.log("[PARSE] Items extraídos:", extractedItems.length);
  console.log("[PARSE] Discrepancy count:", discrepancyCount);
  console.log("[PARSE] Total cost available:", totalCostAvailable);
  console.log("[PARSE] Total cost needed:", totalCostNeeded);

  return {
    requested: requestedContent,
    discrepancies: discrepancyText || "No discrepancies detected",
    rfis: cleanedRfis,
    technicalSummary,
    budgetSummary,
    extractedItems: extractedItems.length > 0 ? extractedItems : undefined,
    discrepancyCount: discrepancyCount > 0 ? discrepancyCount : undefined,
    totalCostAvailable:
      totalCostAvailable > 0 ? totalCostAvailable : undefined,
    totalCostNeeded: totalCostNeeded > 0 ? totalCostNeeded : undefined,
    availableItemsCount:
      availableItemsCount > 0 ? availableItemsCount : undefined,
    neededItemsCount: neededItemsCount > 0 ? neededItemsCount : undefined,
  };
};

/**
 * Simulate progress steps with delays
 */
export const simulateProgress = async (
  steps: readonly { label: string; duration: number }[],
  setProgressStep: (step: number) => void
) => {
  for (let i = 0; i < steps.length; i++) {
    setProgressStep(i);
    await new Promise((resolve) => setTimeout(resolve, steps[i].duration));
  }
};
