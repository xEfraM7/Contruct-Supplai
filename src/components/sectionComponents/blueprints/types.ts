// Blueprint related types and interfaces

export interface ExtractedItem {
  itemId: string;
  csiCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  confidence: number;
  source: string;
}

export interface AnalysisResult {
  requested: string;
  discrepancies: string;
  rfis: string;
  technicalSummary?: string;
  budgetSummary?: string;
  extractedItems?: ExtractedItem[];
  discrepancyCount?: number;
  totalCostAvailable?: number;
  totalCostNeeded?: number;
  availableItemsCount?: number;
  neededItemsCount?: number;
}

export interface Blueprint {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  category: string;
  createdAt: string;
}

export interface Analysis {
  id: string;
  blueprintId: string;
  category: string;
  prompt: string;
  result: string;
  createdAt: string;
}

export interface BlueprintFormData {
  category: string;
  prompt: string;
  file: FileList | null;
  uploadMode: "new" | "existing";
  selectedBlueprintId: string | null;
}

export interface BlueprintComponentProps {
  projectId: string;
}
